import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const photos = await prisma.spotlightPhoto.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(photos);
}

export async function POST(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { url, title, caption, sortOrder } = await request.json();

  const photo = await prisma.spotlightPhoto.create({
    data: {
      url,
      title: title || null,
      caption: caption || null,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(photo);
}

export async function PATCH(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { id, ...data } = await request.json();

  const photo = await prisma.spotlightPhoto.update({
    where: { id },
    data,
  });

  return NextResponse.json(photo);
}

export async function DELETE(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.spotlightPhoto.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
