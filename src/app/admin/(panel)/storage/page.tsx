"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import {
  Cloud,
  Link2,
  CheckCircle2,
  XCircle,
  ImagePlus,
  Zap,
} from "lucide-react";

interface Album {
  id: string;
  title: string;
  coverUrl?: string;
}

interface Appointment {
  id: string;
  status: string;
  user: { id: string; name: string; email: string };
  openDay: { date: string };
  photoAccess: { id: string; albumTitle?: string } | null;
}

interface StorageData {
  google: {
    configured: boolean;
    connected: boolean;
    clientId: string;
    hasSecret: boolean;
    redirectUri: string;
    albumCount: number;
  };
  albums: Album[];
  appointments: Appointment[];
}

function StorageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<StorageData | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState("");
  const [manualUrls, setManualUrls] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const success = searchParams.get("success");
  const urlError = searchParams.get("error");

  function load() {
    fetch("/api/admin/storage")
      .then((r) => r.json())
      .then((d: StorageData) => {
        setData(d);
        if (d.google?.clientId) setClientId(d.google.clientId);
      });
  }

  useEffect(() => { load(); }, []);

  async function saveCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-credentials", clientId, clientSecret }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to save credentials.");
      return;
    }
    setMessage("Google API credentials saved.");
    setClientSecret("");
    load();
  }

  async function connectGoogle() {
    setConnecting(true);
    const res = await fetch("/api/google/connect");
    const d = await res.json();
    if (d.url) {
      window.location.href = d.url;
    } else {
      setError(d.error || "Configure Google credentials first.");
      setConnecting(false);
    }
  }

  async function disconnectGoogle() {
    await fetch("/api/admin/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect" }),
    });
    setMessage("Google Photos disconnected.");
    setSelectedAlbum(null);
    load();
  }

  async function quickGrant() {
    if (!selectedAppointment) {
      setError("Select a client appointment.");
      return;
    }
    const apt = data?.appointments.find((a) => a.id === selectedAppointment);
    if (!apt) return;

    setError("");
    let body: Record<string, unknown>;

    if (selectedAlbum) {
      body = {
        action: "grant-google",
        appointmentId: apt.id,
        userId: apt.user.id,
        googleAlbumId: selectedAlbum.id,
        albumTitle: selectedAlbum.title,
      };
    } else if (manualUrls.trim()) {
      body = {
        action: "grant-manual",
        appointmentId: apt.id,
        userId: apt.user.id,
        albumTitle: manualTitle || "Client Gallery",
        photoUrls: manualUrls.split("\n"),
      };
    } else {
      setError("Select a Google album or paste photo URLs.");
      return;
    }

    const res = await fetch("/api/admin/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to grant access.");
      return;
    }

    setMessage(`Photos shared with ${apt.user.name}!`);
    setSelectedAlbum(null);
    setManualUrls("");
    load();
  }

  const pendingAppointments = data?.appointments.filter((a) => !a.photoAccess) ?? [];

  return (
    <div>
      <h1 className="section-title">Cloud Photo Storage</h1>
      <p className="mt-2 text-muted">
        Connect Google Photos and quickly share albums with clients — or paste direct photo links from any cloud service.
      </p>

      {(success || urlError) && (
        <p className={`mt-4 rounded-sm border px-4 py-3 text-sm ${
          success
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
        }`}>
          {success ? "Google Photos connected!" : `Error: ${urlError?.replace(/_/g, " ")}`}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-sm border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Status bar */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-3">
          {data?.google.configured ? (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          ) : (
            <XCircle className="h-5 w-5 text-muted" />
          )}
          <div>
            <p className="text-sm font-medium">API Configured</p>
            <p className="text-xs text-muted">{data?.google.configured ? "Ready" : "Add credentials below"}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          {data?.google.connected ? (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          ) : (
            <XCircle className="h-5 w-5 text-muted" />
          )}
          <div>
            <p className="text-sm font-medium">Google Connected</p>
            <p className="text-xs text-muted">{data?.google.connected ? `${data.google.albumCount} albums` : "Not connected"}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <ImagePlus className="h-5 w-5 text-accent" />
          <div>
            <p className="text-sm font-medium">Manual URLs</p>
            <p className="text-xs text-muted">Any cloud photo link</p>
          </div>
        </div>
      </div>

      {/* Google setup */}
      <div className="card mt-8">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Google Photos Setup</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          Enter your Google Cloud OAuth credentials here — no need to edit Docker or .env files.
        </p>

        <form onSubmit={saveCredentials} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Client ID</label>
              <input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="input-field"
                placeholder="xxxx.apps.googleusercontent.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Client Secret {data?.google.hasSecret && "(saved — leave blank to keep)"}
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
          </div>
          {data?.google.redirectUri && (
            <p className="text-xs text-muted">
              Redirect URI for Google Cloud Console:{" "}
              <code className="text-foreground">{data.google.redirectUri}</code>
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary text-xs">Save Credentials</button>
            {data?.google.configured && !data.google.connected && (
              <button type="button" onClick={connectGoogle} disabled={connecting} className="btn-secondary text-xs disabled:opacity-50">
                {connecting ? "Redirecting..." : "Connect Google Photos"}
              </button>
            )}
            {data?.google.connected && (
              <>
                <button type="button" onClick={connectGoogle} className="btn-secondary text-xs">Reconnect</button>
                <button type="button" onClick={disconnectGoogle} className="text-xs text-red-400 hover:underline">Disconnect</button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Quick grant */}
      <div className="card mt-8 border-accent/30">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Quick Share to Client</h2>
        </div>
        <p className="mt-2 text-sm text-muted">Pick a client appointment, choose an album or paste URLs, and share in one click.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Client Appointment</label>
            <select
              value={selectedAppointment}
              onChange={(e) => setSelectedAppointment(e.target.value)}
              className="input-field"
            >
              <option value="">Select appointment...</option>
              {pendingAppointments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {apt.user.name} — {format(new Date(apt.openDay.date), "MMM d, yyyy")} ({apt.status})
                </option>
              ))}
            </select>
          </div>

          {selectedAlbum && (
            <p className="text-sm text-accent">
              Selected album: <strong>{selectedAlbum.title}</strong>
              <button onClick={() => setSelectedAlbum(null)} className="ml-2 text-muted hover:text-foreground">(clear)</button>
            </p>
          )}

          <div className="border-t border-card-border pt-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted" />
              <p className="text-sm font-medium">Or paste direct photo URLs (one per line)</p>
            </div>
            <input
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className="input-field mt-2"
              placeholder="Gallery title (optional)"
            />
            <textarea
              value={manualUrls}
              onChange={(e) => setManualUrls(e.target.value)}
              className="input-field mt-2 min-h-[80px]"
              placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
            />
            <p className="mt-1 text-xs text-muted">Works with Google Drive share links, Dropbox, iCloud, or any direct image URL.</p>
          </div>

          <button onClick={quickGrant} className="btn-primary">
            Share Photos with Client
          </button>
        </div>
      </div>

      {/* Album browser */}
      {data?.google.connected && data.albums.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl">Your Google Albums</h2>
          <p className="mt-1 text-sm text-muted">Click an album to select it for sharing.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.albums.map((album) => (
              <button
                key={album.id}
                onClick={() => { setSelectedAlbum(album); setManualUrls(""); }}
                className={`card text-left transition ${
                  selectedAlbum?.id === album.id ? "border-accent" : "hover:border-accent/50"
                }`}
              >
                {album.coverUrl ? (
                  <div className="relative mb-3 aspect-video overflow-hidden rounded-sm">
                    <Image src={album.coverUrl} alt={album.title} fill className="object-cover" sizes="300px" />
                  </div>
                ) : (
                  <div className="mb-3 flex aspect-video items-center justify-center rounded-sm bg-surface text-muted">
                    <Cloud className="h-8 w-8" />
                  </div>
                )}
                <p className="font-medium">{album.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Already shared */}
      {data && data.appointments.some((a) => a.photoAccess) && (
        <div className="mt-8">
          <h2 className="font-serif text-xl">Already Shared</h2>
          <div className="mt-4 space-y-2">
            {data.appointments
              .filter((a) => a.photoAccess)
              .map((apt) => (
                <div key={apt.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium">{apt.user.name}</p>
                    <p className="text-sm text-muted">
                      {format(new Date(apt.openDay.date), "MMM d, yyyy")} · {apt.photoAccess?.albumTitle || "Gallery"}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminStoragePage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading storage...</p>}>
      <StorageContent />
    </Suspense>
  );
}
