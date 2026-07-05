"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Slot {
  time: string;
  label: string;
}

interface OpenDay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  availableSlots: Slot[];
}

export default function AppointmentsPage() {
  const [openDays, setOpenDays] = useState<OpenDay[]>([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    fetch("/api/open-days").then((r) => r.json()).then(setOpenDays);
  }

  useEffect(() => { load(); }, []);

  const currentDay = openDays.find((d) => d.id === selectedDay);

  async function book() {
    if (!selectedDay || !selectedSlot) return;
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openDayId: selectedDay, slotTime: selectedSlot, notes }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      if (res.status === 409) load();
      return;
    }

    setMessage("Appointment booked! Head to pricing to select your package.");
    setSelectedDay("");
    setSelectedSlot("");
    setNotes("");
    load();
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
            Choose a day and time slot. Each slot can only be booked once to prevent scheduling conflicts.
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
                <button
                  key={day.id}
                  onClick={() => { setSelectedDay(day.id); setSelectedSlot(""); }}
                  className={`card w-full text-left transition ${
                    selectedDay === day.id ? "border-accent" : "hover:border-accent/50"
                  }`}
                >
                  <p className="font-medium">
                    {format(new Date(day.date), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted">
                    {day.startTime} – {day.endTime}
                    {day.notes && ` · ${day.notes}`}
                  </p>
                  <p className="mt-1 text-xs text-accent">
                    {day.availableSlots.length} time slot{day.availableSlots.length !== 1 ? "s" : ""} available
                  </p>
                </button>
              ))
            )}
          </div>

          {currentDay && (
            <div className="mt-6">
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted">
                Select a Time Slot
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {currentDay.availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`rounded-sm border px-3 py-2 text-sm transition ${
                      selectedSlot === slot.time
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-card-border hover:border-accent/50"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSlot && (
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
            disabled={!selectedDay || !selectedSlot || loading}
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
