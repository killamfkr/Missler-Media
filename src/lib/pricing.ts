import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";

export interface PriceBreakdown {
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  promoCodeId?: string;
  promoLabel?: string;
}

export async function getTaxRate(): Promise<number> {
  const rate = await getSetting("tax_rate", "0");
  return parseFloat(rate) || 0;
}

export async function validatePromoCode(code: string) {
  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!promo || !promo.active) {
    return { error: "Invalid promo code." };
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return { error: "This promo code has expired." };
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return { error: "This promo code has reached its usage limit." };
  }

  return { promo };
}

export function calculateDiscount(
  subtotal: number,
  discountType: "PERCENT" | "FIXED",
  discountValue: number
): number {
  if (discountType === "PERCENT") {
    return Math.min(subtotal, subtotal * (discountValue / 100));
  }
  return Math.min(subtotal, discountValue);
}

export async function calculatePrice(
  subtotal: number,
  promoCode?: string
): Promise<PriceBreakdown> {
  const taxRate = await getTaxRate();
  let discountAmount = 0;
  let promoCodeId: string | undefined;
  let promoLabel: string | undefined;

  if (promoCode) {
    const result = await validatePromoCode(promoCode);
    if ("error" in result) {
      throw new Error(result.error);
    }
    discountAmount = calculateDiscount(
      subtotal,
      result.promo.discountType,
      result.promo.discountValue
    );
    promoCodeId = result.promo.id;
    promoLabel =
      result.promo.discountType === "PERCENT"
        ? `${result.promo.code} (${result.promo.discountValue}% off)`
        : `${result.promo.code} ($${result.promo.discountValue} off)`;
  }

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = Math.max(0, afterDiscount + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxRate,
    taxAmount,
    total,
    promoCodeId,
    promoLabel,
  };
}
