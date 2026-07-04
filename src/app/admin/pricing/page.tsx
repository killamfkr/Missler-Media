"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string;
  active: boolean;
}

export default function AdminPricingPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    features: "",
  });

  function load() {
    fetch("/api/admin/pricing").then((r) => r.json()).then(setPackages);
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        features: form.features.split("\n").filter(Boolean),
      }),
    });
    setForm({ name: "", description: "", price: "", features: "" });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/pricing?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="section-title">Pricing Packages</h1>
      <p className="mt-2 text-muted">Configure session packages visible to registered clients.</p>

      <form onSubmit={add} className="card mt-8 space-y-4">
        <h3 className="font-serif text-lg">Add Package</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Package name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
          />
          <input
            required
            type="number"
            step="0.01"
            placeholder="Price ($)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="input-field"
          />
        </div>
        <input
          required
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field"
        />
        <textarea
          required
          placeholder="Features (one per line)"
          value={form.features}
          onChange={(e) => setForm({ ...form, features: e.target.value })}
          className="input-field min-h-[100px]"
        />
        <button type="submit" className="btn-primary">Add Package</button>
      </form>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {packages.map((pkg) => {
          const features = JSON.parse(pkg.features || "[]") as string[];
          return (
            <div key={pkg.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-xl">{pkg.name}</h3>
                  <p className="text-2xl text-accent">${pkg.price}</p>
                </div>
                <button onClick={() => remove(pkg.id)} className="text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-muted">{pkg.description}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
