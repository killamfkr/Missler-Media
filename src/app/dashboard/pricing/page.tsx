"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check, Tag } from "lucide-react";

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string;
}

interface Appointment {
  id: string;
  slotTime?: string;
  openDay: { date: string };
  orders: { status: string }[];
}

interface PaymentConfig {
  stripeEnabled: boolean;
  stripePublishableKey: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  venmoEnabled: boolean;
  venmoUsername: string;
}

interface PriceBreakdown {
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  promoLabel?: string;
}

function StripeCheckout({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");
    const { error: stripeError } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    setLoading(false);
    if (stripeError) { setError(stripeError.message || "Payment failed."); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handlePay} className="mt-4">
      <PaymentElement />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary mt-4 w-full disabled:opacity-50">
        {loading ? "Processing..." : "Pay with Card"}
      </button>
    </form>
  );
}

export default function PricingPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [selectedPkg, setSelectedPkg] = useState("");
  const [selectedApt, setSelectedApt] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [promoError, setPromoError] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [venmoInfo, setVenmoInfo] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/pricing").then((r) => r.json()).then(setPackages);
    fetch("/api/appointments").then((r) => r.json()).then(setAppointments);
    fetch("/api/payment-config").then((r) => r.json()).then(setConfig);
  }, []);

  const unpaidAppointments = appointments.filter((a) => !a.orders.some((o) => o.status === "PAID"));
  const selectedPackage = packages.find((p) => p.id === selectedPkg);

  async function applyPromo() {
    if (!selectedPackage) return;
    setPromoError("");
    const res = await fetch("/api/promo-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtotal: selectedPackage.price, promoCode }),
    });
    const data = await res.json();
    if (!res.ok) { setPromoError(data.error); setBreakdown(null); return; }
    setBreakdown(data);
  }

  useEffect(() => {
    if (selectedPackage && !promoCode) {
      fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtotal: selectedPackage.price }),
      }).then((r) => r.json()).then(setBreakdown);
    }
  }, [selectedPackage, promoCode]);

  async function startPayment() {
    if (!selectedPkg || !selectedApt || !paymentMethod) return;

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: selectedApt,
        pricingPackageId: selectedPkg,
        paymentMethod,
        promoCode: promoCode || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }

    setOrderId(data.orderId);
    setBreakdown(data);

    if (paymentMethod === "STRIPE" && data.clientSecret) setClientSecret(data.clientSecret);
    else if (paymentMethod === "VENMO") setVenmoInfo(data.instructions);
  }

  async function markPaid() {
    if (!orderId) return;
    await fetch("/api/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: "PAID" }),
    });
    setSuccess(true);
  }

  const stripePromise = config?.stripePublishableKey ? loadStripe(config.stripePublishableKey) : null;
  const displayTotal = breakdown?.total ?? selectedPackage?.price ?? 0;

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link href="/dashboard" className="text-sm text-muted hover:text-accent">&larr; Back to Dashboard</Link>
          <h1 className="section-title mt-4">Session Pricing</h1>
          <p className="mt-2 text-muted">Choose a package, apply a promo code, and complete payment.</p>

          {success ? (
            <div className="card mt-8 text-center">
              <Check className="mx-auto h-10 w-10 text-accent" />
              <p className="mt-4 font-serif text-xl">Payment Complete</p>
            </div>
          ) : (
            <>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {packages.map((pkg) => {
                  const features = JSON.parse(pkg.features || "[]") as string[];
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => { setSelectedPkg(pkg.id); setBreakdown(null); setPromoCode(""); }}
                      className={`card text-left transition ${selectedPkg === pkg.id ? "border-accent" : "hover:border-accent/50"}`}
                    >
                      <h3 className="font-serif text-xl">{pkg.name}</h3>
                      <p className="mt-2 text-3xl font-light text-accent">${pkg.price.toFixed(0)}</p>
                      <p className="mt-2 text-sm text-muted">{pkg.description}</p>
                      <ul className="mt-4 space-y-1">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-muted">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              {selectedPkg && unpaidAppointments.length > 0 && (
                <div className="card mt-8 space-y-6">
                  <div>
                    <h3 className="font-serif text-lg">Select Appointment</h3>
                    <select value={selectedApt} onChange={(e) => setSelectedApt(e.target.value)} className="input-field mt-3">
                      <option value="">Choose an appointment...</option>
                      {unpaidAppointments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {new Date(a.openDay.date).toLocaleDateString()}
                          {a.slotTime && ` at ${a.slotTime}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-accent" />
                      <h3 className="font-serif text-lg">Promo Code</h3>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="input-field"
                        placeholder="Enter code"
                      />
                      <button onClick={applyPromo} className="btn-secondary shrink-0 text-xs">Apply</button>
                    </div>
                    {promoError && <p className="mt-2 text-sm text-red-400">{promoError}</p>}
                  </div>

                  {breakdown && (
                    <div className="rounded-sm border border-card-border bg-surface p-4 text-sm">
                      <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>${breakdown.subtotal.toFixed(2)}</span></div>
                      {breakdown.discountAmount > 0 && (
                        <div className="mt-1 flex justify-between text-green-400">
                          <span>Discount{breakdown.promoLabel ? ` (${breakdown.promoLabel})` : ""}</span>
                          <span>-${breakdown.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {breakdown.taxAmount > 0 && (
                        <div className="mt-1 flex justify-between"><span className="text-muted">Tax ({breakdown.taxRate}%)</span><span>${breakdown.taxAmount.toFixed(2)}</span></div>
                      )}
                      <div className="mt-2 flex justify-between border-t border-card-border pt-2 font-medium">
                        <span>Total</span><span className="text-accent">${breakdown.total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-serif text-lg">Payment Method</h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {config?.stripeEnabled && (
                        <button onClick={() => setPaymentMethod("STRIPE")} className={`rounded-sm border px-4 py-2 text-sm ${paymentMethod === "STRIPE" ? "border-accent text-accent" : "border-card-border"}`}>
                          Credit Card
                        </button>
                      )}
                      {config?.paypalEnabled && (
                        <button onClick={() => setPaymentMethod("PAYPAL")} className={`rounded-sm border px-4 py-2 text-sm ${paymentMethod === "PAYPAL" ? "border-accent text-accent" : "border-card-border"}`}>
                          PayPal
                        </button>
                      )}
                      {config?.venmoEnabled && (
                        <button onClick={() => setPaymentMethod("VENMO")} className={`rounded-sm border px-4 py-2 text-sm ${paymentMethod === "VENMO" ? "border-accent text-accent" : "border-card-border"}`}>
                          Venmo
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedApt && paymentMethod && !clientSecret && !venmoInfo && (
                    <button onClick={startPayment} className="btn-primary">
                      Continue to Payment — ${displayTotal.toFixed(2)}
                    </button>
                  )}

                  {clientSecret && stripePromise && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripeCheckout clientSecret={clientSecret} onSuccess={markPaid} />
                    </Elements>
                  )}

                  {paymentMethod === "PAYPAL" && orderId && config?.paypalClientId && breakdown && (
                    <PayPalScriptProvider options={{ clientId: config.paypalClientId, currency: "USD" }}>
                      <div className="mt-4">
                        <PayPalButtons
                          style={{ layout: "vertical" }}
                          createOrder={(_, actions) =>
                            actions.order.create({
                              intent: "CAPTURE",
                              purchase_units: [{ amount: { value: breakdown.total.toFixed(2), currency_code: "USD" }, description: selectedPackage?.name }],
                            })
                          }
                          onApprove={async (_, actions) => { await actions.order?.capture(); await markPaid(); }}
                        />
                      </div>
                    </PayPalScriptProvider>
                  )}

                  {venmoInfo && (
                    <div className="rounded-sm border border-card-border bg-surface p-4">
                      <p className="text-sm">{venmoInfo}</p>
                      <button onClick={markPaid} className="btn-primary mt-4 text-xs">I&apos;ve Sent Venmo Payment</button>
                    </div>
                  )}
                </div>
              )}

              {selectedPkg && unpaidAppointments.length === 0 && (
                <div className="card mt-8 text-center text-muted">
                  <p>Book an appointment first, then return here to select a package.</p>
                  <Link href="/dashboard/appointments" className="btn-primary mt-4 inline-flex text-xs">Book Appointment</Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
