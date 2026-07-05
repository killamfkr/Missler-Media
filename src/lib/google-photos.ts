import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getGoogleConfig } from "@/lib/settings";

const SCOPES = ["https://www.googleapis.com/auth/photoslibrary.readonly"];
const PHOTOS_API = "https://photoslibrary.googleapis.com/v1";

export async function getGoogleOAuthClient() {
  const { clientId, clientSecret, redirectUri } = await getGoogleConfig();

  if (!clientId || !clientSecret) return null;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function getGoogleAuthUrl() {
  const oauth2Client = await getGoogleOAuthClient();
  if (!oauth2Client) return null;
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function isGoogleConfigured() {
  const { clientId, clientSecret } = await getGoogleConfig();
  return Boolean(clientId && clientSecret);
}

export async function getStoredGoogleTokens() {
  return prisma.googleToken.findFirst({ orderBy: { updatedAt: "desc" } });
}

export async function isGoogleConnected() {
  const tokens = await getStoredGoogleTokens();
  return Boolean(tokens?.accessToken);
}

async function getAccessToken(): Promise<string | null> {
  const oauth2Client = await getGoogleOAuthClient();
  if (!oauth2Client) return null;

  const tokens = await getStoredGoogleTokens();
  if (!tokens) return null;

  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken ?? undefined,
  });

  if (tokens.expiresAt < new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
        await prisma.googleToken.update({
          where: { id: tokens.id },
          data: {
            accessToken: credentials.access_token,
            expiresAt: new Date(credentials.expiry_date ?? Date.now() + 3600000),
          },
        });
        return credentials.access_token;
      }
    } catch {
      return null;
    }
  }

  return tokens.accessToken;
}

async function photosFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch(`${PHOTOS_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function listGoogleAlbums() {
  const albums: { id: string; title: string; coverUrl?: string }[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "50" });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await photosFetch<{
      albums?: { id: string; title: string; coverPhotoBaseUrl?: string }[];
      nextPageToken?: string;
    }>(`/albums?${params}`);

    if (!data) break;

    for (const album of data.albums ?? []) {
      if (album.id && album.title) {
        albums.push({
          id: album.id,
          title: album.title,
          coverUrl: album.coverPhotoBaseUrl,
        });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return albums;
}

export async function listAlbumPhotos(albumId: string) {
  const items: { id: string; url: string; filename?: string }[] = [];
  let pageToken: string | undefined;

  do {
    const data = await photosFetch<{
      mediaItems?: { id: string; baseUrl: string; filename?: string }[];
      nextPageToken?: string;
    }>("/mediaItems:search", {
      method: "POST",
      body: JSON.stringify({ albumId, pageSize: 100, pageToken }),
    });

    if (!data) break;

    for (const item of data.mediaItems ?? []) {
      if (item.id && item.baseUrl) {
        items.push({
          id: item.id,
          url: `${item.baseUrl}=w1200-h1200`,
          filename: item.filename,
        });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

export async function disconnectGoogle() {
  await prisma.googleToken.deleteMany();
}
