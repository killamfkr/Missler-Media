import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-card-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
        <div>
          <p className="font-serif text-lg">Missler Media Photography</p>
          <p className="mt-1 text-sm text-muted">
            Capturing moments that last a lifetime.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-muted">
          <Link href="/register" className="hover:text-accent">
            Book a Session
          </Link>
          <Link href="/login" className="hover:text-accent">
            Client Login
          </Link>
        </div>
        <p className="text-xs text-muted">
          &copy; {new Date().getFullYear()} Missler Media Photography
        </p>
      </div>
    </footer>
  );
}
