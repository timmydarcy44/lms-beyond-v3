"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import SidebarExpert from "@/components/SidebarExpert";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { ArrowLeft, Construction } from "lucide-react";

const SECTIONS: Record<string, { title: string; description: string }> = {
  attestations: {
    title: "Attestations d'heures",
    description: "Consultez et téléchargez vos attestations d'intervention.",
  },
  supports: {
    title: "Supports de formation",
    description: "Bibliothèque de supports et ressources pédagogiques.",
  },
  facturation: {
    title: "Facturation",
    description: "Suivi des factures et paiements Byound.",
  },
};

export default function ExpertActiviteSectionPage() {
  const params = useParams();
  const { isApproved } = useExpertAccess();
  const section = typeof params.section === "string" ? params.section : "";
  const meta = SECTIONS[section];

  if (!meta) {
    return (
      <div className="min-h-screen bg-[#070b1f] text-white">
        <SidebarExpert restricted={!isApproved} />
        <main className="min-h-screen lg:pl-[260px]">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <p className="text-white/55">Section introuvable.</p>
            <Link href="/dashboard/expert" className="mt-4 inline-block text-[#A9AEFF] hover:underline">
              Retour au tableau de bord
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b1f] text-white">
      <SidebarExpert restricted={!isApproved} />
      <main className="min-h-screen lg:pl-[260px]">
        <div className="mx-auto max-w-3xl px-6 py-10 pb-24">
          <Link
            href="/dashboard/expert"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#A9AEFF] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour au tableau de bord
          </Link>
          <div className="rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#635BFF]/20 bg-[#635BFF]/8">
                <Construction className="h-6 w-6 text-[#A9AEFF]" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
                <p className="mt-2 text-sm text-white/55">{meta.description}</p>
                <p className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white/50">
                  Cette section sera disponible prochainement. En attendant, vos missions et votre profil restent
                  accessibles depuis le menu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
