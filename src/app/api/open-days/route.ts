import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots, formatSlotTime } from "@/lib/slots";

export async function GET() {
  const openDays = await prisma.openDay.findMany({
    where: {
      active: true,
      date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    include: {
      appointments: {
        where: { status: { not: "CANCELLED" } },
        select: { slotTime: true },
      },
    },
    orderBy: { date: "asc" },
  });

  const available = openDays.map((day) => {
    const bookedSlots = day.appointments
      .map((a) => a.slotTime)
      .filter(Boolean) as string[];

    const allSlots = generateTimeSlots(
      day.startTime,
      day.endTime,
      day.slotDurationMinutes
    );

    const openSlots = allSlots
      .filter((time) => !bookedSlots.includes(time))
      .map((time) => ({ time, label: formatSlotTime(time) }));

    return {
      id: day.id,
      date: day.date,
      startTime: day.startTime,
      endTime: day.endTime,
      slotDurationMinutes: day.slotDurationMinutes,
      notes: day.notes,
      spotsRemaining: openSlots.length,
      isFull: openSlots.length === 0,
      availableSlots: openSlots,
    };
  });

  return NextResponse.json(available.filter((d) => !d.isFull || d.availableSlots.length > 0));
}
