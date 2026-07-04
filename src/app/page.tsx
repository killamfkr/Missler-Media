import { Navbar } from "@/components/Navbar";
import { Spotlight } from "@/components/Spotlight";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Spotlight />

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center">
            <h2 className="section-title">Our Services</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              From intimate portraits to grand celebrations, Missler Media delivers
              stunning imagery with an artistic eye and personal touch.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Portrait Sessions",
                desc: "Individual and family portraits in studio or on location.",
              },
              {
                title: "Weddings & Events",
                desc: "Full-day coverage capturing every precious moment.",
              },
              {
                title: "Commercial Work",
                desc: "Brand photography and product shoots for businesses.",
              },
            ].map((service) => (
              <div key={service.title} className="card text-center">
                <h3 className="font-serif text-xl">{service.title}</h3>
                <p className="mt-3 text-sm text-muted">{service.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-card-border bg-surface py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="section-title">Ready to Get Started?</h2>
            <p className="mt-4 text-muted">
              Create your account to view session pricing, book an open day, and
              access your photos after your shoot.
            </p>
            <Link href="/register" className="btn-primary mt-8 inline-flex px-10 py-4">
              Create Account & Book
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
