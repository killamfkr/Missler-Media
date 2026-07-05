import { NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/google-photos";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const base = process.env.NEXT_PUBLIC_APP_URL || "";

  if (error) {
    return NextResponse.redirect(
      new URL("/admin/storage?error=auth_denied", base)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/storage?error=no_code", base)
    );
  }

  const oauth2Client = await getGoogleOAuthClient();
  if (!oauth2Client) {
    return NextResponse.redirect(
      new URL("/admin/storage?error=not_configured", base)
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const existing = await prisma.googleToken.findFirst();

    if (existing) {
      await prisma.googleToken.update({
        where: { id: existing.id },
        data: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token ?? existing.refreshToken,
          expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600000),
        },
      });
    } else {
      await prisma.googleToken.create({
        data: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token ?? null,
          expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600000),
        },
      });
    }

    return NextResponse.redirect(
      new URL("/admin/storage?success=true", base)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/admin/storage?error=token_failed", base)
    );
  }
}
