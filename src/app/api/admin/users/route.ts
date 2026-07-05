import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      role: true,
      createdAt: true,
      _count: { select: { appointments: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function PATCH(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { userId, role } = await request.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json(user);
}
