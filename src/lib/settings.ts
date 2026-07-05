import { prisma } from "@/lib/prisma";

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting?.value ?? fallback;
}

export async function setSetting(key: string, value: string) {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getPaymentConfig() {
  const keys = [
    "stripe_enabled",
    "stripe_publishable_key",
    "paypal_enabled",
    "paypal_client_id",
    "venmo_enabled",
    "venmo_username",
  ];
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return {
    stripeEnabled: map.stripe_enabled === "true",
    stripePublishableKey:
      map.stripe_publishable_key ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      "",
    paypalEnabled: map.paypal_enabled === "true",
    paypalClientId:
      map.paypal_client_id || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    venmoEnabled: map.venmo_enabled === "true",
    venmoUsername: map.venmo_username || "",
  };
}

export async function getGoogleConfig() {
  const clientId =
    (await getSetting("google_client_id")) || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret =
    (await getSetting("google_client_secret")) ||
    process.env.GOOGLE_CLIENT_SECRET ||
    "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;

  return { clientId, clientSecret, redirectUri };
}

export async function getStudioInfo() {
  return {
    businessName: await getSetting("studio_name", "Missler Media Photography"),
    businessPhone: await getSetting("studio_phone"),
    businessEmail: await getSetting("studio_email"),
    businessAddress: await getSetting("studio_address"),
  };
}
