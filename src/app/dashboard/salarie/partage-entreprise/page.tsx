"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { EntrepriseShareConsentForm } from "@/components/entreprise/entreprise-share-consent-form";

export default function SalariePartageEntreprisePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      }
    >
      <EntrepriseShareConsentForm
        defaultNext="/dashboard/salarie"
        variant="salarie"
        revokeHint="Vous pourrez retirer ce consentement à tout moment depuis votre espace salarié. Sans accord, vos résultats restent visibles uniquement par vous."
      />
    </Suspense>
  );
}
