import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { getGoogleAuthUrl } from "@/lib/google-photos";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const url = await getGoogleAuthUrl();
  if (!url) {
    return NextResponse.json(
      { error: "Google OAuth not configured. Add credentials in Admin → Cloud Storage." },
      { status: 400 }
    );
  }
  return NextResponse.json({ url });
}
