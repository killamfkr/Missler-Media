"use client";

import { useEffect, useState } from "react";

export default function AdminPaymentsPage() {
  const [form, setForm] = useState({
    stripe_enabled: "false",
    stripe_publishable_key: "",
    paypal_enabled: "false",
    paypal_client_id: "",
    venmo_enabled: "false",
    venmo_username: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((data) => {
        const map = Object.fromEntries(
          (data.settings || []).map((s: { key: string; value: string }) => [s.key, s.value])
        );
        setForm({
          stripe_enabled: map.stripe_enabled || "false",
          stripe_publishable_key: map.stripe_publishable_key || "",
          paypal_enabled: map.paypal_enabled || "false",
          paypal_client_id: map.paypal_client_id || "",
          venmo_enabled: map.venmo_enabled || "false",
          venmo_username: map.venmo_username || "",
        });
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function toggle(key: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key as keyof typeof f] === "true" ? "false" : "true",
    }));
  }

  return (
    <div>
      <h1 className="section-title">Payment Options</h1>
      <p className="mt-2 text-muted">
        Enable and configure Stripe, PayPal, and Venmo payment methods.
        Secret keys (Stripe secret, PayPal secret) are set via environment variables.
      </p>

      <form onSubmit={save} className="mt-8 space-y-6">
        {saved && (
          <p className="rounded-sm border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
            Payment settings saved.
          </p>
        )}

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg">Stripe</h3>
            <button
              type="button"
              onClick={() => toggle("stripe_enabled")}
              className={`rounded-sm px-3 py-1 text-xs ${
                form.stripe_enabled === "true"
                  ? "bg-accent text-background"
                  : "border border-card-border text-muted"
              }`}
            >
              {form.stripe_enabled === "true" ? "Enabled" : "Disabled"}
            </button>
          </div>
          <input
            placeholder="Stripe Publishable Key"
            value={form.stripe_publishable_key}
            onChange={(e) => setForm({ ...form, stripe_publishable_key: e.target.value })}
            className="input-field"
          />
          <p className="text-xs text-muted">
            Set STRIPE_SECRET_KEY in your .env file for server-side processing.
          </p>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg">PayPal</h3>
            <button
              type="button"
              onClick={() => toggle("paypal_enabled")}
              className={`rounded-sm px-3 py-1 text-xs ${
                form.paypal_enabled === "true"
                  ? "bg-accent text-background"
                  : "border border-card-border text-muted"
              }`}
            >
              {form.paypal_enabled === "true" ? "Enabled" : "Disabled"}
            </button>
          </div>
          <input
            placeholder="PayPal Client ID"
            value={form.paypal_client_id}
            onChange={(e) => setForm({ ...form, paypal_client_id: e.target.value })}
            className="input-field"
          />
          <p className="text-xs text-muted">
            Set PAYPAL_CLIENT_SECRET in your .env file.
          </p>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg">Venmo</h3>
            <button
              type="button"
              onClick={() => toggle("venmo_enabled")}
              className={`rounded-sm px-3 py-1 text-xs ${
                form.venmo_enabled === "true"
                  ? "bg-accent text-background"
                  : "border border-card-border text-muted"
              }`}
            >
              {form.venmo_enabled === "true" ? "Enabled" : "Disabled"}
            </button>
          </div>
          <input
            placeholder="Venmo Username (without @)"
            value={form.venmo_username}
            onChange={(e) => setForm({ ...form, venmo_username: e.target.value })}
            className="input-field"
          />
          <p className="text-xs text-muted">
            Clients will send payment manually and confirm on their end.
          </p>
        </div>

        <button type="submit" className="btn-primary">Save Payment Settings</button>
      </form>
    </div>
  );
}
