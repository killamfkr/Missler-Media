"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    const profile = await fetch("/api/profile").then((r) => r.json());

    if (profile?.role !== "ADMIN") {
      await signOut({ redirect: false });
      setLoading(false);
      setError("This area is for studio administrators only.");
      return;
    }

    setLoading(false);
    router.push("/admin");
    router.refresh();
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-32">
        <div className="card w-full max-w-md">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-accent" />
            <h1 className="font-serif text-2xl">Studio Admin</h1>
          </div>
          <p className="mt-2 text-sm text-muted">
            Sign in to manage photos, appointments, pricing, and client accounts.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <p className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@misslermedia.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In to Admin"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Client looking to book?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Client login
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
