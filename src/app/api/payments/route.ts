import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getPaymentConfig } from "@/lib/settings";
import { calculatePrice } from "@/lib/pricing";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appointmentId, pricingPackageId, paymentMethod, promoCode } =
    await request.json();

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: session.user.id },
  });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  const pkg = await prisma.pricingPackage.findUnique({
    where: { id: pricingPackageId },
  });
  if (!pkg || !pkg.active) {
    return NextResponse.json({ error: "Package not found." }, { status: 404 });
  }

  let breakdown;
  try {
    breakdown = await calculatePrice(pkg.price, promoCode);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid promo code." },
      { status: 400 }
    );
  }

  const config = await getPaymentConfig();
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      appointmentId,
      pricingPackageId,
      promoCodeId: breakdown.promoCodeId || null,
      subtotal: breakdown.subtotal,
      discountAmount: breakdown.discountAmount,
      taxAmount: breakdown.taxAmount,
      amount: breakdown.total,
      paymentMethod,
      status: "PENDING",
    },
  });

  if (paymentMethod === "STRIPE" && config.stripeEnabled) {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(breakdown.total * 100),
      currency: "usd",
      metadata: { orderId: order.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: paymentIntent.id },
    });

    return NextResponse.json({
      orderId: order.id,
      clientSecret: paymentIntent.client_secret,
      ...breakdown,
    });
  }

  if (paymentMethod === "VENMO" && config.venmoEnabled) {
    return NextResponse.json({
      orderId: order.id,
      ...breakdown,
      venmoUsername: config.venmoUsername,
      instructions: `Send $${breakdown.total.toFixed(2)} to @${config.venmoUsername} with note: Order ${order.id.slice(-8)}`,
    });
  }

  if (paymentMethod === "PAYPAL" && config.paypalEnabled) {
    return NextResponse.json({
      orderId: order.id,
      ...breakdown,
      paypalClientId: config.paypalClientId,
    });
  }

  return NextResponse.json({ error: "Payment method unavailable." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, status, paymentId } = await request.json();

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { promoCode: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status || "PAID",
      paymentId: paymentId || order.paymentId,
    },
  });

  if (updated.status === "PAID" && order.promoCodeId) {
    await prisma.promoCode.update({
      where: { id: order.promoCodeId },
      data: { usedCount: { increment: 1 } },
    });
  }

  return NextResponse.json(updated);
}
