import { Suspense } from "react";

import { EcolePlanningClient } from "@/components/ecole/ecole-planning-client";

export const dynamic = "force-dynamic";

export default function EcolePlanningPage() {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-slate-400">Chargement du planning…</p>}>
      <EcolePlanningClient />
    </Suspense>
  );
}
