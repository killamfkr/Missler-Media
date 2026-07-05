"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  role: string;
  createdAt: string;
  _count: { appointments: number; orders: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  function load() {
    fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
  }

  useEffect(() => { load(); }, []);

  async function toggleRole(user: User) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        role: user.role === "ADMIN" ? "USER" : "ADMIN",
      }),
    });
    load();
  }

  return (
    <div>
      <h1 className="section-title">Client Accounts</h1>
      <p className="mt-2 text-muted">View and manage registered client accounts.</p>

      <div className="mt-8 space-y-3">
        {users.map((user) => (
          <div key={user.id} className="card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.name}</p>
                  <span className="rounded-sm border border-card-border px-2 py-0.5 text-xs uppercase">
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-muted">{user.email}</p>
                {user.phone && <p className="text-sm text-muted">{user.phone}</p>}
                {(user.address || user.city) && (
                  <p className="text-sm text-muted">
                    {[user.address, user.city, user.state, user.zip].filter(Boolean).join(", ")}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted">
                  Joined {format(new Date(user.createdAt), "MMM d, yyyy")} ·{" "}
                  {user._count.appointments} appointments · {user._count.orders} orders
                </p>
              </div>
              <button
                onClick={() => toggleRole(user)}
                className="btn-secondary text-xs"
              >
                {user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
