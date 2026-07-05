import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const [users, appointments, orders, openDays, packages, spotlight] =
    await Promise.all([
      prisma.user.count(),
      prisma.appointment.count(),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.openDay.count({ where: { active: true } }),
      prisma.pricingPackage.count({ where: { active: true } }),
      prisma.spotlightPhoto.count({ where: { active: true } }),
    ]);

  const recentAppointments = await prisma.appointment.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      openDay: true,
    },
  });

  return NextResponse.json({
    stats: { users, appointments, orders, openDays, packages, spotlight },
    recentAppointments,
  });
}
