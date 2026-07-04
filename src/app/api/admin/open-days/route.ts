import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const days = await prisma.openDay.findMany({
    include: { _count: { select: { appointments: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(days);
}

export async function POST(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { date, startTime, endTime, maxAppointments, notes } =
    await request.json();

  const day = await prisma.openDay.create({
    data: {
      date: new Date(date),
      startTime: startTime || "09:00",
      endTime: endTime || "17:00",
      maxAppointments: maxAppointments || 4,
      notes: notes || null,
    },
  });

  return NextResponse.json(day);
}

export async function PATCH(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { id, ...data } = await request.json();
  if (data.date) data.date = new Date(data.date);

  const day = await prisma.openDay.update({ where: { id }, data });
  return NextResponse.json(day);
}

export async function DELETE(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.openDay.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
