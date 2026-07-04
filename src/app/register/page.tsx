"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-32">
        <div className="card w-full max-w-lg">
          <h1 className="font-serif text-2xl">Create Your Account</h1>
          <p className="mt-2 text-sm text-muted">
            Register to view session pricing and book your photography appointment.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <p className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Full Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Password * (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="input-field"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  ZIP Code
                </label>
                <input
                  value={form.zip}
                  onChange={(e) => update("zip", e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Street Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  City
                </label>
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  State
                </label>
                <input
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account & Continue"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
