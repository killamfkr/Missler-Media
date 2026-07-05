"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Clock } from "lucide-react";

interface Slot {
  time: string;
  label: string;
  available: boolean;
  appointment: {
    id: string;
    status: string;
    user: { name: string; email: string };
    notes?: string;
  } | null;
}

interface ScheduleDay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  notes?: string;
  active: boolean;
  slots: Slot[];
}

export default function AdminSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);

  function load() {
    fetch("/api/admin/schedule").then((r) => r.json()).then(setSchedule);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(appointmentId: string, status: string) {
    await fetch("/api/admin/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, status }),
    });
    load();
  }

  return (
    <div>
      <h1 className="section-title">Appointment Schedule</h1>
      <p className="mt-2 text-muted">
        View all time slots and bookings. Clients can only book open slots — conflicts are blocked automatically.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border border-card-border bg-surface" /> Available</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-accent/20 border border-accent" /> Booked</span>
      </div>

      {schedule.length === 0 ? (
        <div className="card mt-8 text-center text-muted">
          No upcoming open days. Add days under Open Days.
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {schedule.map((day) => (
            <div key={day.id} className="card">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-accent" />
                <div>
                  <h2 className="font-serif text-xl">
                    {format(new Date(day.date), "EEEE, MMMM d, yyyy")}
                  </h2>
                  <p className="text-sm text-muted">
                    {day.startTime} – {day.endTime} · {day.slotDurationMinutes} min sessions
                    {day.notes && ` · ${day.notes}`}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {day.slots.map((slot) => (
                  <div
                    key={slot.time}
                    className={`rounded-sm border p-3 ${
                      slot.available
                        ? "border-card-border bg-surface"
                        : "border-accent/40 bg-accent/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-3.5 w-3.5 text-muted" />
                        {slot.label}
                      </span>
                      {slot.available ? (
                        <span className="text-xs text-muted">Open</span>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    {slot.appointment && (
                      <div className="mt-2 border-t border-card-border pt-2">
                        <p className="text-sm font-medium">{slot.appointment.user.name}</p>
                        <p className="text-xs text-muted">{slot.appointment.user.email}</p>
                        <select
                          value={slot.appointment.status}
                          onChange={(e) => updateStatus(slot.appointment!.id, e.target.value)}
                          className="input-field mt-2 text-xs"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
