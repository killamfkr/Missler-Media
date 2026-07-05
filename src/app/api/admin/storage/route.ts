import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { setSetting, getGoogleConfig } from "@/lib/settings";
import {
  isGoogleConfigured,
  isGoogleConnected,
  listGoogleAlbums,
  listAlbumPhotos,
  getGoogleAuthUrl,
  disconnectGoogle,
} from "@/lib/google-photos";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const configured = await isGoogleConfigured();
  const connected = await isGoogleConnected();
  const { clientId, redirectUri } = await getGoogleConfig();

  let albums: { id: string; title: string; coverUrl?: string }[] = [];
  if (connected) {
    albums = await listGoogleAlbums();
  }

  const appointments = await prisma.appointment.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      openDay: true,
      photoAccess: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    google: {
      configured,
      connected,
      clientId,
      hasSecret: Boolean((await getGoogleConfig()).clientSecret),
      redirectUri,
      connectUrl: configured ? await getGoogleAuthUrl() : null,
      albumCount: albums.length,
    },
    albums,
    appointments,
  });
}

export async function POST(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const body = await request.json();

  if (body.action === "save-credentials") {
    const { clientId, clientSecret } = body;
    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required." }, { status: 400 });
    }
    await setSetting("google_client_id", clientId);
    if (clientSecret) {
      await setSetting("google_client_secret", clientSecret);
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === "disconnect") {
    await disconnectGoogle();
    return NextResponse.json({ success: true });
  }

  if (body.action === "grant-google") {
    const { appointmentId, userId, googleAlbumId, albumTitle } = body;
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

    return NextResponse.json(access);
  }

  if (body.action === "grant-manual") {
    const { appointmentId, userId, albumTitle, photoUrls } = body;
    const urls = (photoUrls as string[])
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      return NextResponse.json({ error: "Add at least one photo URL." }, { status: 400 });
    }

    const photos = urls.map((url, i) => ({
      id: `manual-${i}`,
      url,
      filename: `photo-${i + 1}`,
    }));

    const access = await prisma.photoAccess.upsert({
      where: { appointmentId },
      create: {
        userId,
        appointmentId,
        albumTitle: albumTitle || "Client Gallery",
        photosJson: JSON.stringify(photos),
      },
      update: {
        albumTitle: albumTitle || "Client Gallery",
        photosJson: JSON.stringify(photos),
      },
    });

    return NextResponse.json(access);
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
