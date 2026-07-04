"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AdminGooglePage() {
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState(false);
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  async function connect() {
    setConnecting(true);
    const res = await fetch("/api/google/connect");
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "Failed to start Google connection.");
      setConnecting(false);
    }
  }

  return (
    <div>
      <h1 className="section-title">Google Photos</h1>
      <p className="mt-2 text-muted">
        Connect your Google Photos account to attach albums to client appointments.
      </p>

      {success && (
        <p className="mt-6 rounded-sm border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Google Photos connected successfully!
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Connection failed: {error.replace(/_/g, " ")}
        </p>
      )}

      <div className="card mt-8">
        <h3 className="font-serif text-lg">Connect Account</h3>
        <p className="mt-2 text-sm text-muted">
          You&apos;ll need to set up Google Cloud OAuth credentials with the Photos Library API
          enabled. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment.
        </p>
        <button
          onClick={connect}
          disabled={connecting}
          className="btn-primary mt-6 disabled:opacity-50"
        >
          {connecting ? "Redirecting..." : "Connect Google Photos"}
        </button>
      </div>

      <div className="card mt-6">
        <h3 className="font-serif text-lg">Setup Instructions</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Create a project in Google Cloud Console</li>
          <li>Enable the Google Photos Library API</li>
          <li>Create OAuth 2.0 credentials (Web application)</li>
          <li>Add redirect URI: <code className="text-foreground">/api/google/callback</code></li>
          <li>Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env</li>
        </ol>
      </div>
    </div>
  );
}
