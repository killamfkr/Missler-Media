import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { listGoogleAlbums, listAlbumPhotos } from "@/lib/google-photos";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const albums = await listGoogleAlbums();
  return NextResponse.json(albums);
}

export async function POST(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { appointmentId, userId, googleAlbumId, albumTitle } =
    await request.json();

  let photosJson: string | null = null;
  if (googleAlbumId) {
    const photos = await listAlbumPhotos(googleAlbumId);
    photosJson = JSON.stringify(photos);
  }

  const access = await prisma.photoAccess.upsert({
    where: { appointmentId },
    create: {
      userId,
      appointmentId,
      googleAlbumId: googleAlbumId || null,
      albumTitle: albumTitle || null,
      photosJson,
    },
    update: {
      googleAlbumId: googleAlbumId || null,
      albumTitle: albumTitle || null,
      photosJson,
    },
  });

  const order = await prisma.order.findFirst({
    where: { appointmentId, userId },
  });
  if (order && order.status !== "PAID") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });
  }

  return NextResponse.json(access);
}
