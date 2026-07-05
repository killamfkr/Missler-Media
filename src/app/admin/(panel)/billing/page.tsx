"use client";

import { useEffect, useState } from "react";
import { Trash2, Percent, Tag } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  active: boolean;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
}

export default function AdminBillingPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [taxRate, setTaxRate] = useState("0");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENT" as "PERCENT" | "FIXED",
    discountValue: "",
    maxUses: "",
    expiresAt: "",
  });

  function load() {
    fetch("/api/admin/billing").then((r) => r.json()).then((d) => {
      setPromoCodes(d.promoCodes || []);
      setTaxRate(String(d.taxRate ?? 0));
    });
  }

  useEffect(() => { load(); }, []);

  async function saveTax(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-tax", taxRate }),
    });
    setMessage("Tax rate saved.");
  }

  async function addPromo(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ code: "", description: "", discountType: "PERCENT", discountValue: "", maxUses: "", expiresAt: "" });
    setMessage("Promo code created.");
    load();
  }

  async function togglePromo(promo: PromoCode) {
    await fetch("/api/admin/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: promo.id, active: !promo.active }),
    });
    load();
  }

  async function removePromo(id: string) {
    await fetch(`/api/admin/billing?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="section-title">Billing & Promo Codes</h1>
      <p className="mt-2 text-muted">Set tax rates and create promo codes for client checkout.</p>

      {message && (
        <p className="mt-4 rounded-sm border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{message}</p>
      )}

      <form onSubmit={saveTax} className="card mt-8">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Tax Rate</h2>
        </div>
        <p className="mt-2 text-sm text-muted">Applied to all orders after discounts.</p>
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="input-field"
              placeholder="8.25"
            />
          </div>
          <button type="submit" className="btn-primary text-xs">Save Tax Rate</button>
        </div>
      </form>

      <form onSubmit={addPromo} className="card mt-8 space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Create Promo Code</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input required placeholder="Code (e.g. SUMMER20)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-field" />
          <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as "PERCENT" | "FIXED" })} className="input-field">
            <option value="PERCENT">Percentage Off</option>
            <option value="FIXED">Fixed Amount Off</option>
          </select>
          <input required type="number" step="0.01" placeholder={form.discountType === "PERCENT" ? "Discount %" : "Amount $"} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="input-field" />
          <input type="number" placeholder="Max uses (optional)" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="input-field" />
          <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="input-field" />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
        </div>
        <button type="submit" className="btn-primary">Create Promo Code</button>
      </form>

      <div className="mt-8 space-y-3">
        <h2 className="font-serif text-xl">Active Promo Codes</h2>
        {promoCodes.length === 0 ? (
          <p className="text-sm text-muted">No promo codes yet.</p>
        ) : (
          promoCodes.map((promo) => (
            <div key={promo.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-accent">{promo.code}</span>
                  <span className={`rounded-sm px-2 py-0.5 text-xs ${promo.active ? "bg-green-500/10 text-green-400" : "bg-muted/10 text-muted"}`}>
                    {promo.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {promo.discountType === "PERCENT" ? `${promo.discountValue}% off` : `$${promo.discountValue} off`}
                  {promo.maxUses && ` · ${promo.usedCount}/${promo.maxUses} used`}
                  {!promo.maxUses && ` · ${promo.usedCount} used`}
                  {promo.expiresAt && ` · Expires ${new Date(promo.expiresAt).toLocaleDateString()}`}
                </p>
                {promo.description && <p className="text-xs text-muted">{promo.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => togglePromo(promo)} className="btn-secondary text-xs">
                  {promo.active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => removePromo(promo.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
