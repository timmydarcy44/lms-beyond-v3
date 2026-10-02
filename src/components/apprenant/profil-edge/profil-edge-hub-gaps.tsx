"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Play, Sparkles, X } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import {
  buildCoachingSkillsFromMatching,
  type CoachingSkill,
} from "@/components/apprenant/profil-edge/coaching-skills";
import { SkillUniverseView } from "@/components/apprenant/profil-edge/skill-universe-view";
import { missionHref } from "@/lib/apprenant/edge-mission-types";
import { ProfilEdgeHubCard, ProfilEdgeHubSection } from "./profil-edge-hub-card";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";

type Props = {
  matching: CareerMatchingResult;
  objectiveLabel: string;
};

export function ProfilEdgeHubGaps({ matching, objectiveLabel }: Props) {
  const [selected, setSelected] = useState<CoachingSkill | null>(null);
  const [showLater, setShowLater] = useState(false);

  const { forces, priorities, laterSkills } = useMemo(
    () => buildCoachingSkillsFromMatching(matching, objectiveLabel),
    [matching, objectiveLabel],
  );

  const firstAction = priorities[0] ?? forces[0] ?? null;

  return (
    <>
      <ProfilEdgeHubSection
        title="Mon plan d'action"
        subtitle="Vos forces d'abord, puis une priorité claire — sans tout traiter en même temps."
      >
        {firstAction ? (
          <ProfilEdgeHubCard variant="accent" className="gap-5">
            <div className="flex items-center gap-2 text-white/80">
              <Sparkles className="h-4 w-4" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">Prochaine action</span>
            </div>
            <p className="text-[1.85rem] font-bold tracking-[-0.035em] text-white">{firstAction.name}</p>
            <p className="text-[15px] leading-relaxed text-white/80">{firstAction.whyUseful}</p>
            <button
              type="button"
              onClick={() => setSelected(firstAction)}
              className={`${CONNECT_BTN_PRIMARY} inline-flex w-full items-center justify-center gap-2 sm:w-auto`}
            >
              <Play className="h-4 w-4" />
              Commencer ma prochaine action
            </button>
          </ProfilEdgeHubCard>
        ) : null}

        {forces.length ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/55">Vos forces</p>
            <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 px-1 snap-x snap-mandatory">
              {forces.map((skill) => (
                <ProfilEdgeHubCard
                  key={skill.name}
                  variant="success"
                  onClick={() => setSelected(skill)}
                  className="min-h-[180px] min-w-[240px] max-w-[280px] shrink-0 snap-start justify-between gap-4"
                >
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/75">
                    Force
                  </p>
                  <p className="text-lg font-bold text-white">{skill.name}</p>
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-white/75">{skill.whyUseful}</p>
                </ProfilEdgeHubCard>
              ))}
            </div>
          </div>
        ) : null}

        {priorities.length ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/55">Priorités actuelles</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {priorities.map((skill) => (
                <ProfilEdgeHubCard
                  key={skill.name}
                  variant="accent"
                  onClick={() => setSelected(skill)}
                  className="min-h-[180px] justify-between gap-4"
                >
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/75">
                    Priorité
                  </p>
                  <p className="text-lg font-bold leading-snug text-white">{skill.name}</p>
                  <p className="line-clamp-2 text-[13px] text-white/75">{skill.nextAction}</p>
                </ProfilEdgeHubCard>
              ))}
            </div>
          </div>
        ) : null}

        {laterSkills.length ? (
          <ProfilEdgeHubCard variant="muted" className="gap-4">
            <button
              type="button"
              onClick={() => setShowLater((v) => !v)}
              className="flex w-full items-start justify-between gap-4 text-left"
              aria-expanded={showLater}
            >
              <div>
                <p className="text-[16px] font-semibold text-white">À explorer plus tard</p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/45">
                  {laterSkills.length} compétence{laterSkills.length > 1 ? "s" : ""} — évaluées si elles deviennent
                  utiles pour votre objectif.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/60">
                {showLater ? "Masquer" : "Voir"}
                <ChevronDown className={`h-4 w-4 transition-transform ${showLater ? "rotate-180" : ""}`} />
              </span>
            </button>

            {showLater ? (
              <ul className="space-y-2 border-t border-white/[0.06] pt-4">
                {laterSkills.map((skill) => (
                  <li
                    key={skill}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <span className="text-sm text-white/75">{skill}</span>
                    <Link
                      href={missionHref(skill, { objective: objectiveLabel })}
                      className="text-xs font-medium text-[#8BB4FF] hover:underline"
                    >
                      Évaluer si nécessaire
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </ProfilEdgeHubCard>
        ) : null}
      </ProfilEdgeHubSection>

      {selected ? (
        <div className="fixed inset-0 z-[160] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setSelected(null)}
            aria-label="Fermer"
          />
          <aside className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#12141C] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Compétence</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{selected.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-white/10 p-2 text-white/50 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <SkillUniverseView
                skill={selected}
                objectiveLabel={objectiveLabel}
                onBack={() => setSelected(null)}
              />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
