"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Image, DollarSign, User } from "lucide-react";

interface Appointment {
  id: string;
  status: string;
  createdAt: string;
  openDay: { date: string; startTime: string; endTime: string };
  orders: { status: string; pricingPackage: { name: string } }[];
  photoAccess: { id: string } | null;
}

export function DashboardContent() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setProfile);
    fetch("/api/appointments").then((r) => r.json()).then(setAppointments);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <h1 className="section-title">
          Welcome{profile ? `, ${profile.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-muted">
          Manage your appointments, view pricing, and access your photos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/dashboard/appointments", icon: Calendar, label: "Book Appointment", desc: "Schedule on open days" },
          { href: "/dashboard/pricing", icon: DollarSign, label: "View Pricing", desc: "Session packages & payment" },
          { href: "/dashboard/photos", icon: Image, label: "My Photos", desc: "Purchased galleries" },
          { href: "/dashboard/profile", icon: User, label: "My Profile", desc: "Contact information" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="card group transition hover:border-accent/50">
            <item.icon className="h-6 w-6 text-accent" />
            <h3 className="mt-4 font-serif text-lg group-hover:text-accent">{item.label}</h3>
            <p className="mt-1 text-sm text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="font-serif text-xl">Your Appointments</h2>
        {appointments.length === 0 ? (
          <div className="card mt-4 text-center">
            <p className="text-muted">No appointments yet.</p>
            <Link href="/dashboard/appointments" className="btn-primary mt-4 inline-flex text-xs">
              Book Your First Session
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="card flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium">
                    {format(new Date(apt.openDay.date), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted">
                    {apt.openDay.startTime} – {apt.openDay.endTime}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-sm border border-card-border px-3 py-1 text-xs uppercase tracking-wider">
                    {apt.status}
                  </span>
                  {apt.photoAccess && (
                    <Link href="/dashboard/photos" className="text-sm text-accent hover:underline">
                      View Photos
                    </Link>
                  )}
                  {apt.orders.length === 0 && (
                    <Link href="/dashboard/pricing" className="text-sm text-accent hover:underline">
                      Select Package
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
