"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import {
  SkillsEmptyHint,
  SkillsProgressBar,
  SkillsSectionKicker,
} from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import { encodeSkillParam, levelProgressPercent, nextHardSkillLevel } from "@/lib/apprenant/edge-skills-center";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";
import { resolveSkillUxStatus, SKILL_UX_STATUS } from "@/lib/hard-skills/hard-skills-portfolio";

export default function SkillsCompetencesPage() {
  const { loading, error, records, meta } = useEdgeSkillsCenter();

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
              Développer
            </Link>
            <Link href="/dashboard/apprenant/skills/prove" className={CONNECT_BTN_SECONDARY}>
              Prouver
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
            const status = resolveSkillUxStatus(meta[rec.name]);
            const statusUi = SKILL_UX_STATUS[status];
            const target = meta[rec.name]?.trainingTargetLevel ?? nextHardSkillLevel(rec.level);
            const progress = levelProgressPercent(rec.level, target);
            return (
              <Link
                key={rec.name}
                href={`/dashboard/apprenant/skills/c/${encodeSkillParam(rec.name)}`}
                className="group flex items-center gap-4 rounded-2xl border border-transparent px-3 py-4 transition hover:border-white/[0.06] hover:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-semibold text-white">{rec.name}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusUi.className}`}
                    >
                      {statusUi.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-white/35">
                    <span>{rec.level}</span>
                    <span>·</span>
                    <span>{rec.category}</span>
                  </div>
                  <SkillsProgressBar value={progress} className="max-w-xs" />
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
