import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots } from "@/lib/slots";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { userId: session.user.id },
    include: {
      openDay: true,
      orders: { include: { pricingPackage: true, promoCode: true } },
      photoAccess: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { openDayId, slotTime, notes } = await request.json();
  if (!openDayId || !slotTime) {
    return NextResponse.json(
      { error: "Please select a day and time slot." },
      { status: 400 }
    );
  }

  const openDay = await prisma.openDay.findUnique({
    where: { id: openDayId },
    include: {
      appointments: {
        where: { status: { not: "CANCELLED" } },
        select: { slotTime: true, userId: true },
      },
    },
  });

  if (!openDay || !openDay.active) {
    return NextResponse.json({ error: "Open day not available." }, { status: 400 });
  }

  const validSlots = generateTimeSlots(
    openDay.startTime,
    openDay.endTime,
    openDay.slotDurationMinutes
  );

  if (!validSlots.includes(slotTime)) {
    return NextResponse.json({ error: "Invalid time slot." }, { status: 400 });
  }

  const slotTaken = openDay.appointments.some((a) => a.slotTime === slotTime);
  if (slotTaken) {
    return NextResponse.json(
      { error: "This time slot was just booked. Please choose another." },
      { status: 409 }
    );
  }

  const sameDay = openDay.appointments.find((a) => a.userId === session.user!.id);
  if (sameDay) {
    return NextResponse.json(
      { error: "You already have an appointment on this day." },
      { status: 400 }
    );
  }

  const conflicting = await prisma.appointment.findFirst({
    where: {
      userId: session.user.id,
      status: { not: "CANCELLED" },
      openDay: { date: openDay.date },
    },
  });
  if (conflicting) {
    return NextResponse.json(
      { error: "You already have an appointment on this date." },
      { status: 400 }
    );
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        userId: session.user.id,
        openDayId,
        slotTime,
        notes: notes || null,
      },
      include: { openDay: true },
    });

    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json(
      { error: "This time slot is no longer available." },
      { status: 409 }
    );
  }
}
