"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ProfilePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data) setForm(data);
      });
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Update failed.");
      return;
    }

    setMessage("Profile updated successfully.");
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-lg px-6 py-12">
          <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
            &larr; Back to Dashboard
          </Link>
          <h1 className="section-title mt-4">My Profile</h1>
          <p className="mt-2 text-muted">Update your contact information.</p>

          <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
            {message && (
              <p className="rounded-sm border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
                {message}
              </p>
            )}
            {error && (
              <p className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Email</label>
              <input value={form.email} disabled className="input-field opacity-60" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Full Name</label>
              <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Street Address</label>
              <input value={form.address} onChange={(e) => update("address", e.target.value)} className="input-field" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">City</label>
                <input value={form.city} onChange={(e) => update("city", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">State</label>
                <input value={form.state} onChange={(e) => update("state", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">ZIP</label>
                <input value={form.zip} onChange={(e) => update("zip", e.target.value)} className="input-field" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
