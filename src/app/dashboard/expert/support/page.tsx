"use client";

import { EdgeExpertPageShell } from "@/components/edge-ui/edge-expert-page-shell";
import { EdgeCard } from "@/components/edge-ui/edge-card";
import { HelpCircle, Mail, MessageCircle } from "lucide-react";

export default function ExpertSupportPage() {
  return (
    <EdgeExpertPageShell title="Support" subtitle="Une équipe Byound dédiée pour vous accompagner.">
      <div className="grid gap-4 md:grid-cols-2">
        <EdgeCard padding="lg" className="border-white/[0.07] bg-[#10173a]/70 text-white shadow-none">
          <Mail className="h-6 w-6 text-[#A9AEFF]" />
          <p className="mt-3 text-sm font-semibold">Email support</p>
          <a href="mailto:cockpit@edgebs.fr" className="mt-2 block text-sm text-[#A9AEFF] hover:underline">
            cockpit@edgebs.fr
          </a>
        </EdgeCard>
        <EdgeCard padding="lg" className="border-white/[0.07] bg-[#10173a]/70 text-white shadow-none">
          <MessageCircle className="h-6 w-6 text-[#A9AEFF]" />
          <p className="mt-3 text-sm font-semibold">Questions fréquentes</p>
          <p className="mt-2 text-sm text-white/55">Validation de profil, Byound Certified, missions entreprises.</p>
        </EdgeCard>
      </div>
      <EdgeCard padding="lg" className="mt-4 border-white/[0.07] bg-[#10173a]/70 text-center text-white shadow-none">
        <HelpCircle className="mx-auto h-10 w-10 text-[#A9AEFF]" />
        <p className="mt-4 text-sm text-white/55">Centre d'aide complet en cours de construction.</p>
      </EdgeCard>
    </EdgeExpertPageShell>
  );
}
