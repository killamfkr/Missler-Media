"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SpotlightPhoto {
  id: string;
  url: string;
  title?: string | null;
  caption?: string | null;
}

const DEFAULT_PHOTOS: SpotlightPhoto[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1493863641943-9b67192f0d4a?w=1920&q=80",
    title: "Timeless Portraits",
    caption: "Elegant photography for every occasion",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80",
    title: "Wedding Stories",
    caption: "Your love story, beautifully told",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1920&q=80",
    title: "Family Moments",
    caption: "Cherished memories preserved forever",
  },
];

export function Spotlight() {
  const [photos, setPhotos] = useState<SpotlightPhoto[]>(DEFAULT_PHOTOS);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/spotlight")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setPhotos(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % photos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [photos.length]);

  const photo = photos[current];

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {photos.map((p, i) => (
        <div
          key={p.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={p.url}
            alt={p.title || "Spotlight photo"}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-24 pt-32 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">
          Missler Media Photography
        </p>
        <h1 className="font-serif text-4xl font-light tracking-tight md:text-6xl lg:text-7xl">
          {photo.title || "Capture Your Story"}
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted md:text-lg">
          {photo.caption ||
            "Professional photography sessions tailored to you. Create an account to view pricing and book your session."}
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/register" className="btn-primary px-10 py-4 text-base">
            Book Appointment
          </Link>
          <Link href="/login" className="btn-secondary px-10 py-4 text-base">
            Client Sign In
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-8 bg-accent" : "w-1.5 bg-muted/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <button
        onClick={() => setCurrent((c) => (c - 1 + photos.length) % photos.length)}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-card-border/50 bg-background/30 p-2 backdrop-blur-sm transition hover:bg-background/60"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % photos.length)}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-card-border/50 bg-background/30 p-2 backdrop-blur-sm transition hover:bg-background/60"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </section>
  );
}
