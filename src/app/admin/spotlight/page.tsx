"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";

interface SpotlightPhoto {
  id: string;
  url: string;
  title?: string;
  caption?: string;
  sortOrder: number;
  active: boolean;
}

export default function AdminSpotlightPage() {
  const [photos, setPhotos] = useState<SpotlightPhoto[]>([]);
  const [form, setForm] = useState({ url: "", title: "", caption: "", sortOrder: 0 });

  function load() {
    fetch("/api/admin/spotlight").then((r) => r.json()).then(setPhotos);
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/spotlight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ url: "", title: "", caption: "", sortOrder: 0 });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/spotlight?id=${id}`, { method: "DELETE" });
    load();
  }

  async function toggle(photo: SpotlightPhoto) {
    await fetch("/api/admin/spotlight", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photo.id, active: !photo.active }),
    });
    load();
  }

  return (
    <div>
      <h1 className="section-title">Homepage Spotlight</h1>
      <p className="mt-2 text-muted">Manage the photos displayed on the homepage carousel.</p>

      <form onSubmit={add} className="card mt-8 space-y-4">
        <h3 className="font-serif text-lg">Add Photo</h3>
        <input
          required
          placeholder="Image URL"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="input-field"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input-field"
          />
          <input
            placeholder="Caption"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
            className="input-field"
          />
        </div>
        <button type="submit" className="btn-primary">Add to Spotlight</button>
      </form>

      <div className="mt-8 space-y-4">
        {photos.map((photo) => (
          <div key={photo.id} className="card flex gap-4">
            <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-sm">
              <Image src={photo.url} alt={photo.title || ""} fill className="object-cover" sizes="144px" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{photo.title || "Untitled"}</p>
              <p className="text-sm text-muted">{photo.caption}</p>
              <p className="mt-1 text-xs text-muted">{photo.active ? "Active" : "Hidden"}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => toggle(photo)} className="btn-secondary text-xs">
                {photo.active ? "Hide" : "Show"}
              </button>
              <button onClick={() => remove(photo.id)} className="text-xs text-red-400 hover:underline">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
