import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculatePrice } from "@/lib/pricing";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subtotal, promoCode } = await request.json();
    if (!subtotal || subtotal <= 0) {
      return NextResponse.json({ error: "Invalid subtotal." }, { status: 400 });
    }

    const breakdown = await calculatePrice(subtotal, promoCode);
    return NextResponse.json(breakdown);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid promo code." },
      { status: 400 }
    );
  }
}
