"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import {
  SkillsEmptyHint,
  SkillsSectionKicker,
} from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import { encodeSkillParam } from "@/lib/apprenant/edge-skills-center";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
} from "@/lib/apprenant/connect-nav";
import { getSkillDeclarationStatus } from "@/lib/hard-skills/hard-skills-portfolio";
import { foldSkillKey } from "@/lib/hard-skills/skill-catalog-policy";

export default function SkillsCompetencesPage() {
  const { loading, error, records, meta, earnedBadgeNames } = useEdgeSkillsCenter();

  return (
    <EdgePageAmbiance ambiance="skills">
      <div className={`${APPRENANT_PAGE_SHELL} max-w-3xl pb-24`}>
        <header className="space-y-3">
          <SkillsSectionKicker>Mes compétences</SkillsSectionKicker>
          <h1 className="text-[30px] font-bold tracking-[-0.03em] text-white sm:text-[36px]">
            Votre capital
          </h1>
          <p className="max-w-lg text-[14px] text-white/40">
            Chaque compétence a sa fiche : niveau, preuves, historique et prochaines actions.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/dashboard/apprenant/skills/develop" className={CONNECT_BTN_PRIMARY}>
              Déclarer une compétence
            </Link>
          </div>
        </header>

        <div className="mt-10 space-y-2">
          {loading && <SkillsEmptyHint>Chargement…</SkillsEmptyHint>}
          {error && <SkillsEmptyHint>{error}</SkillsEmptyHint>}
          {!loading && !error && records.length === 0 && (
            <SkillsEmptyHint>
              Aucune compétence pour le moment. Commencez par en développer une.
            </SkillsEmptyHint>
          )}
          {records.map((rec) => {
            const badgeEarned = earnedBadgeNames.some((name) => foldSkillKey(name) === foldSkillKey(rec.name));
            const status = getSkillDeclarationStatus(meta[rec.name], { badgeEarned });
            const target = meta[rec.name]?.trainingTargetLevel;
            return (
              <Link
                key={rec.name}
                href={`/dashboard/apprenant/skills/c/${encodeSkillParam(rec.name)}`}
                className="group flex items-center gap-4 rounded-2xl border border-transparent px-3 py-4 transition hover:border-white/[0.06] hover:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-semibold text-white">{rec.name}</span>
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/80">
                      {status.label}
                    </span>
                  </div>
                  <p className="text-[13px] text-white/55">
                    Auto-évaluation : {rec.level}
                    {target ? ` · Objectif : ${target}` : ""}
                    <span className="text-white/35"> · {rec.category}</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/20 transition group-hover:text-[#7BA7FF]" />
              </Link>
            );
          })}
        </div>
      </div>
    </EdgePageAmbiance>
  );
}
