import { NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/google-photos";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/admin/google?error=auth_denied", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/google?error=no_code", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  const oauth2Client = getGoogleOAuthClient();
  if (!oauth2Client) {
    return NextResponse.redirect(
      new URL("/admin/google?error=not_configured", process.env.NEXT_PUBLIC_APP_URL)
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
      new URL("/admin/google?success=true", process.env.NEXT_PUBLIC_APP_URL)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/admin/google?error=token_failed", process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}
