"use client";

import { useEffect, useState } from "react";
import { User, Building2, Lock } from "lucide-react";

interface AccountData {
  user: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  studio: {
    businessName: string;
    businessPhone: string;
    businessEmail: string;
    businessAddress: string;
  };
}

export default function AdminAccountPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    businessName: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/account")
      .then((r) => r.json())
      .then((data: AccountData) => {
        if (data.user) {
          setForm((f) => ({
            ...f,
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            address: data.user.address || "",
            city: data.user.city || "",
            state: data.user.state || "",
            zip: data.user.zip || "",
            businessName: data.studio?.businessName || "",
            businessPhone: data.studio?.businessPhone || "",
            businessEmail: data.studio?.businessEmail || "",
            businessAddress: data.studio?.businessAddress || "",
          }));
        }
      });
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        businessName: form.businessName,
        businessPhone: form.businessPhone,
        businessEmail: form.businessEmail,
        businessAddress: form.businessAddress,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Save failed.");
      return;
    }
    setMessage("Account information saved.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Password change failed.");
      return;
    }

    setMessage("Password updated successfully.");
    update("currentPassword", "");
    update("newPassword", "");
    update("confirmPassword", "");
  }

  return (
    <div>
      <h1 className="section-title">Admin Account</h1>
      <p className="mt-2 text-muted">
        Manage your login details and studio contact information.
      </p>

      {message && (
        <p className="mt-6 rounded-sm border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={saveProfile} className="card mt-8 space-y-6">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Your Profile</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Full Name</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Email</label>
            <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Phone</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">ZIP</label>
            <input value={form.zip} onChange={(e) => update("zip", e.target.value)} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Address</label>
            <input value={form.address} onChange={(e) => update("address", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">City</label>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">State</label>
            <input value={form.state} onChange={(e) => update("state", e.target.value)} className="input-field" />
          </div>
        </div>

        <div className="border-t border-card-border pt-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl">Studio Information</h2>
          </div>
          <p className="mt-1 text-sm text-muted">Displayed on the site and used for client communications.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Business Name</label>
              <input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Business Phone</label>
              <input value={form.businessPhone} onChange={(e) => update("businessPhone", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Business Email</label>
              <input type="email" value={form.businessEmail} onChange={(e) => update("businessEmail", e.target.value)} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Business Address</label>
              <input value={form.businessAddress} onChange={(e) => update("businessAddress", e.target.value)} className="input-field" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? "Saving..." : "Save Account Info"}
        </button>
      </form>

      <form onSubmit={changePassword} className="card mt-8 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Change Password</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Current Password</label>
          <input type="password" value={form.currentPassword} onChange={(e) => update("currentPassword", e.target.value)} className="input-field" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">New Password</label>
            <input type="password" minLength={8} value={form.newPassword} onChange={(e) => update("newPassword", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Confirm New Password</label>
            <input type="password" minLength={8} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className="input-field" />
          </div>
        </div>
        <button type="submit" disabled={loading || !form.currentPassword} className="btn-primary disabled:opacity-50">
          Update Password
        </button>
      </form>
    </div>
  );
}
