"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import SidebarExpert from "@/components/SidebarExpert";
import { ArrowLeft, Construction } from "lucide-react";

const SECTIONS: Record<string, { title: string; description: string }> = {
  attestations: {
    title: "Attestations d'heures",
    description: "Consultez et téléchargez vos attestations d’intervention.",
  },
  supports: {
    title: "Supports de formation",
    description: "Bibliothèque de supports et ressources pédagogiques.",
  },
  facturation: {
    title: "Facturation",
    description: "Suivi des factures et paiements Beyond.",
  },
};

export default function ExpertActiviteSectionPage() {
  const params = useParams();
  const section = typeof params.section === "string" ? params.section : "";
  const meta = SECTIONS[section];

  if (!meta) {
    return (
      <div className="min-h-screen bg-[#05060a] pl-[280px] text-white">
        <SidebarExpert />
        <main className="relative mx-auto max-w-3xl px-6 py-16">
          <p className="text-white/70">Section introuvable.</p>
          <Link href="/dashboard/expert" className="mt-4 inline-block text-emerald-400 hover:underline">
            Retour au cockpit
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),rgba(2,6,23,0)_60%)] blur-3xl" />
      </div>
      <SidebarExpert />
      <main className="relative mx-auto max-w-3xl px-6 py-10 pb-24 pl-[280px]">
        <Link
          href="/dashboard/expert"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400/90 hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour au cockpit
        </Link>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10">
              <Construction className="h-6 w-6 text-amber-300" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{meta.title}</h1>
              <p className="mt-2 text-sm text-white/65">{meta.description}</p>
              <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                Cette section sera disponible prochainement. En attendant, vos missions et votre profil restent accessibles depuis le menu.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
