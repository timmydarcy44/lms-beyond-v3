import { Suspense } from "react";

import { CareAccueilClient } from "@/components/apprenant/care-accueil-client";

export default function ApprenantCarePage() {
  return (
    <Suspense
      fallback={
        <div className="px-10 py-10 text-[14px] text-[#9AA3BD]">Chargement de Byound Care…</div>
      }
    >
      <CareAccueilClient />
    </Suspense>
  );
}
