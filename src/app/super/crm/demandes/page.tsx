import { Suspense } from "react";
import { FormationDemandesInbox } from "@/components/super-admin/formation-demandes-inbox";

export default function DemandesEntrantesPage() {
  return (
    <div className="min-h-screen bg-[#0A0C1B] px-3 py-6 sm:px-6 sm:py-8">
      <Suspense fallback={<p className="text-sm text-[#A3A8C7]">Chargement…</p>}>
        <FormationDemandesInbox />
      </Suspense>
    </div>
  );
}
