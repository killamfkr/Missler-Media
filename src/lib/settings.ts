import { prisma } from "@/lib/prisma";

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting?.value ?? fallback;
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
