import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getPaymentConfig } from "@/lib/settings";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const config = await getPaymentConfig();
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [
          "stripe_enabled",
          "stripe_publishable_key",
          "paypal_enabled",
          "paypal_client_id",
          "venmo_enabled",
          "venmo_username",
        ],
      },
    },
  });
  return NextResponse.json({ config, settings });
}

export async function POST(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const settings: Record<string, string> = await request.json();

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    });
  }

  return NextResponse.json({ success: true });
}
