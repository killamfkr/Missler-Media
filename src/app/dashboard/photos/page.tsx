"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Lock } from "lucide-react";

interface Gallery {
  id: string;
  albumTitle?: string;
  grantedAt: string;
  photos: { id: string; url: string; filename?: string }[];
  appointment: { openDay: { date: string } };
}

export default function PhotosPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selected, setSelected] = useState<Gallery | null>(null);

  useEffect(() => {
    fetch("/api/photos").then((r) => r.json()).then(setGalleries);
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
            &larr; Back to Dashboard
          </Link>
          <h1 className="section-title mt-4">My Photos</h1>
          <p className="mt-2 text-muted">
            Galleries from your completed and purchased sessions.
          </p>

          {galleries.length === 0 ? (
            <div className="card mt-8 text-center">
              <Lock className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-4 text-muted">
                No photos available yet. Photos are unlocked after your session
                and package purchase.
              </p>
              <Link href="/dashboard/pricing" className="btn-primary mt-4 inline-flex text-xs">
                View Pricing
              </Link>
            </div>
          ) : selected ? (
            <div>
              <button
                onClick={() => setSelected(null)}
                className="mt-6 text-sm text-muted hover:text-accent"
              >
                &larr; All Galleries
              </button>
              <h2 className="mt-4 font-serif text-2xl">
                {selected.albumTitle ||
                  format(new Date(selected.appointment.openDay.date), "MMMM d, yyyy")}
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selected.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square overflow-hidden rounded-sm">
                    <Image
                      src={photo.url}
                      alt={photo.filename || "Photo"}
                      fill
                      className="object-cover transition hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {galleries.map((gallery) => (
                <button
                  key={gallery.id}
                  onClick={() => setSelected(gallery)}
                  className="card text-left transition hover:border-accent/50"
                >
                  {gallery.photos[0] ? (
                    <div className="relative mb-4 aspect-video overflow-hidden rounded-sm">
                      <Image
                        src={gallery.photos[0].url}
                        alt="Gallery cover"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 flex aspect-video items-center justify-center rounded-sm bg-surface text-muted">
                      No preview
                    </div>
                  )}
                  <h3 className="font-serif text-lg">
                    {gallery.albumTitle ||
                      format(new Date(gallery.appointment.openDay.date), "MMMM d, yyyy")}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {gallery.photos.length} photos
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
