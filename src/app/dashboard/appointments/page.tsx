"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface OpenDay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  spotsRemaining: number;
  isFull: boolean;
}

export default function AppointmentsPage() {
  const [openDays, setOpenDays] = useState<OpenDay[]>([]);
  const [selected, setSelected] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/open-days").then((r) => r.json()).then(setOpenDays);
  }, []);

  async function book() {
    if (!selected) return;
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openDayId: selected, notes }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setMessage("Appointment booked! Head to pricing to select your package.");
    setSelected("");
    setNotes("");
    fetch("/api/open-days").then((r) => r.json()).then(setOpenDays);
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
            &larr; Back to Dashboard
          </Link>
          <h1 className="section-title mt-4">Book an Appointment</h1>
          <p className="mt-2 text-muted">
            Select an available open day for your photography session.
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

          <div className="mt-8 space-y-3">
            {openDays.length === 0 ? (
              <div className="card text-center text-muted">
                No open days available right now. Check back soon!
              </div>
            ) : (
              openDays.map((day) => (
                <label
                  key={day.id}
                  className={`card flex cursor-pointer items-center gap-4 transition ${
                    day.isFull ? "opacity-50" : "hover:border-accent/50"
                  } ${selected === day.id ? "border-accent" : ""}`}
                >
                  <input
                    type="radio"
                    name="openDay"
                    value={day.id}
                    disabled={day.isFull}
                    checked={selected === day.id}
                    onChange={() => setSelected(day.id)}
                    className="accent-accent"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {format(new Date(day.date), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted">
                      {day.startTime} – {day.endTime}
                      {day.notes && ` · ${day.notes}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted">
                    {day.isFull ? "Full" : `${day.spotsRemaining} spots left`}
                  </span>
                </label>
              ))
            )}
          </div>

          {selected && (
            <div className="mt-6">
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field min-h-[80px]"
                placeholder="Any special requests or details..."
              />
            </div>
          )}

          <button
            onClick={book}
            disabled={!selected || loading}
            className="btn-primary mt-6 disabled:opacity-50"
          >
            {loading ? "Booking..." : "Confirm Appointment"}
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
