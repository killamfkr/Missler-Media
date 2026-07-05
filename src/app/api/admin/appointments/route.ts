import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const appointments = await prisma.appointment.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      openDay: true,
      photoAccess: true,
      orders: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(appointments);
}
