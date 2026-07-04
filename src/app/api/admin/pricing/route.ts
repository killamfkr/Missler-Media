import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const packages = await prisma.pricingPackage.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(packages);
}

export async function POST(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { name, description, price, features, sortOrder } = await request.json();

  const pkg = await prisma.pricingPackage.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      features: JSON.stringify(features || []),
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(pkg);
}

export async function PATCH(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { id, features, price, ...rest } = await request.json();

  const data: Record<string, unknown> = { ...rest };
  if (features !== undefined) data.features = JSON.stringify(features);
  if (price !== undefined) data.price = parseFloat(price);

  const pkg = await prisma.pricingPackage.update({ where: { id }, data });
  return NextResponse.json(pkg);
}

export async function DELETE(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.pricingPackage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
