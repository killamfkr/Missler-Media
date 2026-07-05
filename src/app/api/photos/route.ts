import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAlbumPhotos } from "@/lib/google-photos";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await prisma.photoAccess.findMany({
    where: { userId: session.user.id },
    include: {
      appointment: {
        include: { openDay: true },
      },
    },
    orderBy: { grantedAt: "desc" },
  });

  const galleries = await Promise.all(
    access.map(async (item) => {
      let photos: { id: string; url: string; filename?: string }[] = [];
      if (item.photosJson) {
        try {
          photos = JSON.parse(item.photosJson);
        } catch {
          photos = [];
        }
      } else if (item.googleAlbumId) {
        photos = await listAlbumPhotos(item.googleAlbumId);
      }
      return { ...item, photos };
    })
  );

  return NextResponse.json(galleries);
}
