import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaymentConfig } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getPaymentConfig();
  return NextResponse.json(config);
}
