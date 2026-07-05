"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Stats {
  users: number;
  appointments: number;
  orders: number;
  openDays: number;
  packages: number;
  spotlight: number;
}

interface RecentAppointment {
  id: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  openDay: { date: string };
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentAppointment[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setRecent(data.recentAppointments);
      });
  }, []);

  return (
    <div>
      <h1 className="section-title">Admin Overview</h1>
      <p className="mt-2 text-muted">Manage Missler Media Photography.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats &&
          [
            { label: "Clients", value: stats.users },
            { label: "Appointments", value: stats.appointments },
            { label: "Paid Orders", value: stats.orders },
            { label: "Open Days", value: stats.openDays },
            { label: "Active Packages", value: stats.packages },
            { label: "Spotlight Photos", value: stats.spotlight },
          ].map((item) => (
            <div key={item.label} className="card">
              <p className="text-sm text-muted">{item.label}</p>
              <p className="mt-1 font-serif text-3xl">{item.value}</p>
            </div>
          ))}
      </div>

      <h2 className="mt-12 font-serif text-xl">Recent Appointments</h2>
      <div className="mt-4 space-y-2">
        {recent.map((apt) => (
          <div key={apt.id} className="card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{apt.user.name}</p>
              <p className="text-sm text-muted">{apt.user.email}</p>
            </div>
            <div className="text-sm text-muted">
              {format(new Date(apt.openDay.date), "MMM d, yyyy")} · {apt.status}
            </div>
          </div>
        ))}
        {recent.length === 0 && (
          <p className="text-sm text-muted">No appointments yet.</p>
        )}
      </div>
    </div>
  );
}
