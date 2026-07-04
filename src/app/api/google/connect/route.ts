import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { getGoogleAuthUrl } from "@/lib/google-photos";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const url = getGoogleAuthUrl();
  if (!url) {
    return NextResponse.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 400 }
    );
  }
  return NextResponse.json({ url });
}
