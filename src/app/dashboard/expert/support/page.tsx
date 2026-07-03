"use client";

import { EdgeExpertPageShell } from "@/components/edge-ui/edge-expert-page-shell";
import { EdgeCard } from "@/components/edge-ui/edge-card";
import { HelpCircle, Mail, MessageCircle } from "lucide-react";

export default function ExpertSupportPage() {
  return (
    <EdgeExpertPageShell title="Support" subtitle="Une équipe EDGE dédiée pour vous accompagner.">
      <div className="grid gap-4 md:grid-cols-2">
        <EdgeCard padding="lg">
          <Mail className="h-6 w-6 text-[#635BFF]" />
          <p className="mt-3 text-sm font-semibold">Email support</p>
          <a href="mailto:cockpit@edgebs.fr" className="mt-2 block text-sm text-[#635BFF] hover:underline">
            cockpit@edgebs.fr
          </a>
        </EdgeCard>
        <EdgeCard padding="lg">
          <MessageCircle className="h-6 w-6 text-[#635BFF]" />
          <p className="mt-3 text-sm font-semibold">Questions fréquentes</p>
          <p className="mt-2 text-sm text-[#050505]/55">Validation de profil, EDGE Certified, missions entreprises.</p>
        </EdgeCard>
      </div>
      <EdgeCard padding="lg" className="mt-4 text-center">
        <HelpCircle className="mx-auto h-10 w-10 text-[#635BFF]" />
        <p className="mt-4 text-sm text-[#050505]/55">Centre d'aide complet en cours de construction.</p>
      </EdgeCard>
    </EdgeExpertPageShell>
  );
}
