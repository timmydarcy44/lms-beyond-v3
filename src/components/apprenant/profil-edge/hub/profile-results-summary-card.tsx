"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { HubPillCta, HubSectionHeader, HubSurface } from "./hub-ui";

type Props = {
  discScores: DiscScores | null;
  hasIdmc: boolean;
  hasSoftSkills: boolean;
  softSkillsScores: Record<string, number> | null;
  forcesCount: number;
};

function discPrimaryLabel(scores: DiscScores): string {
  const entries: Array<[string, number]> = [
    ["Dominant", scores.D],
    ["Influent", scores.I],
    ["Stable", scores.S],
    ["Consciencieux", scores.C],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "—";
}

function softSkillsHint(
  hasSoftSkills: boolean,
  forcesCount: number,
  soft: Record<string, number> | null,
): string {
  if (!hasSoftSkills || !soft) return "Test à réaliser";
  if (forcesCount > 0) {
    return `${forcesCount} force${forcesCount > 1 ? "s" : ""} principale${forcesCount > 1 ? "s" : ""}`;
  }
  const top = Object.entries(soft).sort((a, b) => b[1] - a[1])[0];
  return top ? `Point fort : ${top[0]}` : "Résultats disponibles";
}

export function ProfileResultsSummaryCard({
  discScores,
  hasIdmc,
  hasSoftSkills,
  softSkillsScores,
  forcesCount,
}: Props) {
  return (
    <section>
      <HubSectionHeader
        title="Mes résultats EDGE"
        subtitle="Synthèse — le détail reste accessible en un tap."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <HubSurface tone="ocean" className="min-h-[150px] justify-between gap-3 !p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/70">DISC</p>
          <p className="text-[16px] font-semibold leading-snug text-white">
            {discScores ? `Profil : ${discPrimaryLabel(discScores)}` : "Non renseigné"}
          </p>
        </HubSurface>
        <HubSurface tone="violet" className="min-h-[150px] justify-between gap-3 !p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/70">IDMC</p>
          <p className="text-[16px] font-semibold leading-snug text-white">
            {hasIdmc ? "Point fort : Connaissance de soi" : "Test à réaliser"}
          </p>
        </HubSurface>
        <HubSurface tone="ember" className="min-h-[150px] justify-between gap-3 !p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/70">
            Soft skills
          </p>
          <p className="text-[16px] font-semibold leading-snug text-white">
            {softSkillsHint(hasSoftSkills, forcesCount, softSkillsScores)}
          </p>
        </HubSurface>
      </div>
      <div className="mt-4">
        <Link href="/dashboard/apprenant/profil">
          <HubPillCta>
            Voir tous mes résultats
            <ArrowRight className="h-4 w-4" />
          </HubPillCta>
        </Link>
      </div>
    </section>
  );
}
