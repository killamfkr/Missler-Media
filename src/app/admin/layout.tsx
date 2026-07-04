import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/spotlight", label: "Homepage Photos" },
  { href: "/admin/open-days", label: "Open Days" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/users", label: "Accounts" },
  { href: "/admin/payments", label: "Payment Options" },
  { href: "/admin/photos", label: "Photo Access" },
  { href: "/admin/google", label: "Google Photos" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex flex-wrap gap-2 border-b border-card-border pb-4">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-sm border border-card-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
