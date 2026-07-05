import { Suspense } from "react";
import AdminGooglePage from "./GooglePage";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-muted">Loading...</p>}>
      <AdminGooglePage />
    </Suspense>
  );
}
