import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { setSetting, getSetting } from "@/lib/settings";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const [promoCodes, taxRate] = await Promise.all([
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }),
    getSetting("tax_rate", "0"),
  ]);

  return NextResponse.json({ promoCodes, taxRate: parseFloat(taxRate) || 0 });
}

export async function POST(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const body = await request.json();

  if (body.action === "set-tax") {
    const rate = parseFloat(body.taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return NextResponse.json({ error: "Tax rate must be 0–100." }, { status: 400 });
    }
    await setSetting("tax_rate", String(rate));
    return NextResponse.json({ success: true, taxRate: rate });
  }

  const { code, description, discountType, discountValue, maxUses, expiresAt } = body;
  if (!code || !discountType || discountValue === undefined) {
    return NextResponse.json({ error: "Code, type, and value are required." }, { status: 400 });
  }

  const promo = await prisma.promoCode.create({
    data: {
      code: code.toUpperCase().trim(),
      description: description || null,
      discountType,
      discountValue: parseFloat(discountValue),
      maxUses: maxUses ? parseInt(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(promo);
}

export async function PATCH(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const { id, ...data } = await request.json();
  if (data.discountValue !== undefined) data.discountValue = parseFloat(data.discountValue);
  if (data.expiresAt !== undefined) data.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

  const promo = await prisma.promoCode.update({ where: { id }, data });
  return NextResponse.json(promo);
}

export async function DELETE(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
