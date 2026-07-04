"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, Camera } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const links = session
    ? session.user.role === "ADMIN"
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/admin", label: "Admin" },
        ]
      : [{ href: "/dashboard", label: "Dashboard" }]
    : [];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-card-border/50 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-accent" />
          <span className="font-serif text-lg tracking-wide">
            Missler Media
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-muted transition hover:text-foreground"
            >
              Sign Out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted transition hover:text-foreground"
              >
                Sign In
              </Link>
              <Link href="/register" className="btn-primary text-xs">
                Book Appointment
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-card-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted"
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-left text-sm text-muted"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="text-sm text-muted">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-primary text-center text-xs">
                  Book Appointment
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
