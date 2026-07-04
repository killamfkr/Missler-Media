import { requireAuth } from "@/lib/session";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DashboardContent } from "@/components/DashboardContent";

export default async function DashboardPage() {
  await requireAuth();

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">
        <DashboardContent />
      </main>
      <Footer />
    </>
  );
}
