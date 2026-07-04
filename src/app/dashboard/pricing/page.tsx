"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check } from "lucide-react";

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string;
}

interface Appointment {
  id: string;
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

function StripeCheckout({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    setLoading(false);
    if (stripeError) {
      setError(stripeError.message || "Payment failed.");
      return;
    }
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
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [venmoInfo, setVenmoInfo] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/pricing").then((r) => r.json()).then(setPackages);
    fetch("/api/appointments").then((r) => r.json()).then(setAppointments);
    fetch("/api/payment-config")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  const unpaidAppointments = appointments.filter(
    (a) => !a.orders.some((o) => o.status === "PAID")
  );

  async function startPayment() {
    if (!selectedPkg || !selectedApt || !paymentMethod) return;

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: selectedApt,
        pricingPackageId: selectedPkg,
        paymentMethod,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }

    setOrderId(data.orderId);

    if (paymentMethod === "STRIPE" && data.clientSecret) {
      setClientSecret(data.clientSecret);
    } else if (paymentMethod === "VENMO") {
      setVenmoInfo(data.instructions);
    }
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

  const stripePromise = config?.stripePublishableKey
    ? loadStripe(config.stripePublishableKey)
    : null;

  const selectedPackage = packages.find((p) => p.id === selectedPkg);

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
            &larr; Back to Dashboard
          </Link>
          <h1 className="section-title mt-4">Session Pricing</h1>
          <p className="mt-2 text-muted">
            Choose a package and complete payment for your appointment.
          </p>

          {success ? (
            <div className="card mt-8 text-center">
              <Check className="mx-auto h-10 w-10 text-accent" />
              <p className="mt-4 font-serif text-xl">Payment Complete</p>
              <p className="mt-2 text-sm text-muted">
                Your photos will be available after your session.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {packages.map((pkg) => {
                  const features = JSON.parse(pkg.features || "[]") as string[];
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg.id)}
                      className={`card text-left transition ${
                        selectedPkg === pkg.id ? "border-accent" : "hover:border-accent/50"
                      }`}
                    >
                      <h3 className="font-serif text-xl">{pkg.name}</h3>
                      <p className="mt-2 text-3xl font-light text-accent">
                        ${pkg.price.toFixed(0)}
                      </p>
                      <p className="mt-2 text-sm text-muted">{pkg.description}</p>
                      <ul className="mt-4 space-y-1">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-muted">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              {selectedPkg && unpaidAppointments.length > 0 && (
                <div className="card mt-8">
                  <h3 className="font-serif text-lg">Select Appointment</h3>
                  <select
                    value={selectedApt}
                    onChange={(e) => setSelectedApt(e.target.value)}
                    className="input-field mt-3"
                  >
                    <option value="">Choose an appointment...</option>
                    {unpaidAppointments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {new Date(a.openDay.date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>

                  <h3 className="mt-6 font-serif text-lg">Payment Method</h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {config?.stripeEnabled && (
                      <button
                        onClick={() => setPaymentMethod("STRIPE")}
                        className={`rounded-sm border px-4 py-2 text-sm ${
                          paymentMethod === "STRIPE" ? "border-accent text-accent" : "border-card-border"
                        }`}
                      >
                        Credit Card (Stripe)
                      </button>
                    )}
                    {config?.paypalEnabled && (
                      <button
                        onClick={() => setPaymentMethod("PAYPAL")}
                        className={`rounded-sm border px-4 py-2 text-sm ${
                          paymentMethod === "PAYPAL" ? "border-accent text-accent" : "border-card-border"
                        }`}
                      >
                        PayPal
                      </button>
                    )}
                    {config?.venmoEnabled && (
                      <button
                        onClick={() => setPaymentMethod("VENMO")}
                        className={`rounded-sm border px-4 py-2 text-sm ${
                          paymentMethod === "VENMO" ? "border-accent text-accent" : "border-card-border"
                        }`}
                      >
                        Venmo
                      </button>
                    )}
                  </div>

                  {selectedApt && paymentMethod && !clientSecret && !venmoInfo && (
                    <button onClick={startPayment} className="btn-primary mt-6">
                      Continue to Payment
                      {selectedPackage && ` — $${selectedPackage.price.toFixed(2)}`}
                    </button>
                  )}

                  {clientSecret && stripePromise && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripeCheckout clientSecret={clientSecret} onSuccess={markPaid} />
                    </Elements>
                  )}

                  {paymentMethod === "PAYPAL" && orderId && config?.paypalClientId && selectedPackage && (
                    <PayPalScriptProvider options={{ clientId: config.paypalClientId, currency: "USD" }}>
                      <div className="mt-4">
                        <PayPalButtons
                          style={{ layout: "vertical" }}
                          createOrder={(_, actions) =>
                            actions.order.create({
                              intent: "CAPTURE",
                              purchase_units: [
                                {
                                  amount: { value: selectedPackage.price.toFixed(2), currency_code: "USD" },
                                  description: selectedPackage.name,
                                },
                              ],
                            })
                          }
                          onApprove={async (_, actions) => {
                            await actions.order?.capture();
                            await markPaid();
                          }}
                        />
                      </div>
                    </PayPalScriptProvider>
                  )}

                  {venmoInfo && (
                    <div className="mt-4 rounded-sm border border-card-border bg-surface p-4">
                      <p className="text-sm">{venmoInfo}</p>
                      <p className="mt-2 text-xs text-muted">
                        After sending payment, click below to confirm.
                      </p>
                      <button onClick={markPaid} className="btn-primary mt-4 text-xs">
                        I&apos;ve Sent Venmo Payment
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedPkg && unpaidAppointments.length === 0 && (
                <div className="card mt-8 text-center text-muted">
                  <p>Book an appointment first, then return here to select a package.</p>
                  <Link href="/dashboard/appointments" className="btn-primary mt-4 inline-flex text-xs">
                    Book Appointment
                  </Link>
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
