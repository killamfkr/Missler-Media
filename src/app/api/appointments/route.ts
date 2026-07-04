import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { userId: session.user.id },
    include: {
      openDay: true,
      orders: { include: { pricingPackage: true } },
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

  const { openDayId, notes } = await request.json();
  if (!openDayId) {
    return NextResponse.json({ error: "Open day is required." }, { status: 400 });
  }

  const openDay = await prisma.openDay.findUnique({
    where: { id: openDayId },
    include: { _count: { select: { appointments: true } } },
  });

  if (!openDay || !openDay.active) {
    return NextResponse.json({ error: "Open day not available." }, { status: 400 });
  }

  if (openDay._count.appointments >= openDay.maxAppointments) {
    return NextResponse.json({ error: "This day is fully booked." }, { status: 400 });
  }

  const existing = await prisma.appointment.findUnique({
    where: {
      userId_openDayId: { userId: session.user.id, openDayId },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have an appointment on this day." },
      { status: 400 }
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId: session.user.id,
      openDayId,
      notes: notes || null,
    },
    include: { openDay: true },
  });

  return NextResponse.json(appointment);
}
