import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getPaymentConfig } from "@/lib/settings";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appointmentId, pricingPackageId, paymentMethod } = await request.json();

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

  const config = await getPaymentConfig();
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      appointmentId,
      pricingPackageId,
      amount: pkg.price,
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
      amount: Math.round(pkg.price * 100),
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
      amount: pkg.price,
    });
  }

  if (paymentMethod === "VENMO" && config.venmoEnabled) {
    return NextResponse.json({
      orderId: order.id,
      amount: pkg.price,
      venmoUsername: config.venmoUsername,
      instructions: `Send $${pkg.price.toFixed(2)} to @${config.venmoUsername} with note: Order ${order.id.slice(-8)}`,
    });
  }

  if (paymentMethod === "PAYPAL" && config.paypalEnabled) {
    return NextResponse.json({
      orderId: order.id,
      amount: pkg.price,
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

  return NextResponse.json(updated);
}
