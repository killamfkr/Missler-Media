import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { handlers } = await import("@/lib/auth");
  return handlers.POST(req);
}

export async function GET(req: NextRequest) {
  const { handlers } = await import("@/lib/auth");
  return handlers.GET(req);
}
