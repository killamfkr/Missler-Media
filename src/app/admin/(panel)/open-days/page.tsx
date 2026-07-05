"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

interface OpenDay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxAppointments: number;
  notes?: string;
  active: boolean;
  _count: { appointments: number };
}

export default function AdminOpenDaysPage() {
  const [days, setDays] = useState<OpenDay[]>([]);
  const [form, setForm] = useState({
    date: "",
    startTime: "09:00",
    endTime: "17:00",
    maxAppointments: 4,
    notes: "",
  });

  function load() {
    fetch("/api/admin/open-days").then((r) => r.json()).then(setDays);
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/open-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ date: "", startTime: "09:00", endTime: "17:00", maxAppointments: 4, notes: "" });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/open-days?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="section-title">Open Days</h1>
      <p className="mt-2 text-muted">Configure available days for client appointments.</p>

      <form onSubmit={add} className="card mt-8 space-y-4">
        <h3 className="font-serif text-lg">Add Open Day</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="input-field"
          />
          <input
            type="number"
            min={1}
            value={form.maxAppointments}
            onChange={(e) => setForm({ ...form, maxAppointments: parseInt(e.target.value) })}
            className="input-field"
            placeholder="Max appointments"
          />
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="input-field"
          />
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="input-field"
          />
        </div>
        <input
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="input-field"
        />
        <button type="submit" className="btn-primary">Add Open Day</button>
      </form>

      <div className="mt-8 space-y-3">
        {days.map((day) => (
          <div key={day.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{format(new Date(day.date), "EEEE, MMMM d, yyyy")}</p>
              <p className="text-sm text-muted">
                {day.startTime} – {day.endTime} · {day._count.appointments}/{day.maxAppointments} booked
                {day.notes && ` · ${day.notes}`}
              </p>
            </div>
            <button onClick={() => remove(day.id)} className="text-red-400 hover:text-red-300">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
