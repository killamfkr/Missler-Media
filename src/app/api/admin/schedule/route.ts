import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots, formatSlotTime } from "@/lib/slots";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const openDays = await prisma.openDay.findMany({
    where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    include: {
      appointments: {
        where: { status: { not: "CANCELLED" } },
        include: { user: { select: { name: true, email: true } } },
      },
    },
    orderBy: { date: "asc" },
  });

  const schedule = openDays.map((day) => {
    const allSlots = generateTimeSlots(
      day.startTime,
      day.endTime,
      day.slotDurationMinutes
    );
    const bookedMap = new Map(
      day.appointments
        .filter((a) => a.slotTime)
        .map((a) => [a.slotTime!, a])
    );

    return {
      id: day.id,
      date: day.date,
      startTime: day.startTime,
      endTime: day.endTime,
      slotDurationMinutes: day.slotDurationMinutes,
      notes: day.notes,
      active: day.active,
      slots: allSlots.map((time) => {
        const apt = bookedMap.get(time);
        return {
          time,
          label: formatSlotTime(time),
          available: !apt,
          appointment: apt
            ? {
                id: apt.id,
                status: apt.status,
                user: apt.user,
                notes: apt.notes,
              }
            : null,
        };
      }),
      unslottedAppointments: day.appointments
        .filter((a) => !a.slotTime)
        .map((a) => ({
          id: a.id,
          status: a.status,
          user: a.user,
          notes: a.notes,
        })),
    };
  });

  return NextResponse.json(schedule);
}

export async function PATCH(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const { appointmentId, status } = await request.json();

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(appointment);
}
