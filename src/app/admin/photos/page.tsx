"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  status: string;
  user: { id: string; name: string; email: string };
  openDay: { date: string };
  photoAccess: { id: string; albumTitle?: string } | null;
}

interface Album {
  id: string;
  title: string;
}

export default function AdminPhotosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/appointments")
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setAppointments(data) : null));
    fetch("/api/admin/photos")
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setAlbums(data) : null))
      .catch(() => {});
  }, []);

  async function grantAccess(appointment: Appointment) {
    const albumId = selected[appointment.id];
    const album = albums.find((a) => a.id === albumId);

    await fetch("/api/admin/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: appointment.id,
        userId: appointment.user.id,
        googleAlbumId: albumId || null,
        albumTitle: album?.title || null,
      }),
    });

    alert("Photo access granted!");
    fetch("/api/admin/appointments")
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setAppointments(data) : null));
  }

  return (
    <div>
      <h1 className="section-title">Photo Access</h1>
      <p className="mt-2 text-muted">
        Grant clients access to their Google Photos albums after sessions.
        Connect Google Photos in the Google Photos admin page first.
      </p>

      {albums.length > 0 && (
        <p className="mt-4 text-sm text-green-400">
          {albums.length} Google albums available.
        </p>
      )}

      <div className="mt-8 space-y-4">
        {appointments.map((apt) => (
          <div key={apt.id} className="card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{apt.user.name}</p>
                <p className="text-sm text-muted">
                  {format(new Date(apt.openDay.date), "MMM d, yyyy")} · {apt.status}
                </p>
                {apt.photoAccess && (
                  <p className="mt-1 text-xs text-accent">
                    Access granted: {apt.photoAccess.albumTitle || "Yes"}
                  </p>
                )}
              </div>
              {!apt.photoAccess && (
                <div className="flex gap-2">
                  {albums.length > 0 ? (
                    <select
                      value={selected[apt.id] || ""}
                      onChange={(e) =>
                        setSelected({ ...selected, [apt.id]: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="">Select Google album...</option>
                      {albums.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <button
                    onClick={() => grantAccess(apt)}
                    className="btn-primary shrink-0 text-xs"
                  >
                    Grant Access
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {appointments.length === 0 && (
          <p className="text-sm text-muted">No appointments to manage.</p>
        )}
      </div>
    </div>
  );
}
