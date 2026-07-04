import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const openDays = await prisma.openDay.findMany({
    where: {
      active: true,
      date: { gte: new Date() },
    },
    include: {
      _count: { select: { appointments: true } },
    },
    orderBy: { date: "asc" },
  });

  const available = openDays.map((day) => ({
    ...day,
    spotsRemaining: day.maxAppointments - day._count.appointments,
    isFull: day._count.appointments >= day.maxAppointments,
  }));

  return NextResponse.json(available);
}
