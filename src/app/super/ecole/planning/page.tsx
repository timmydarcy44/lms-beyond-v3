import { Suspense } from "react";

import { EcolePlanningClient } from "@/components/ecole/ecole-planning-client";

export const dynamic = "force-dynamic";

export default function SuperEcolePlanningPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#F5F5F7] text-slate-900">
      <Suspense fallback={<p className="px-6 py-10 text-sm text-slate-500">Chargement du planning…</p>}>
        <EcolePlanningClient />
      </Suspense>
    </div>
  );
}
