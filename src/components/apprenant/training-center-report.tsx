"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, Dumbbell, FileCheck2, Play } from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import {
  buildCoachingSkillsFromMatching,
  buildTrainingCenterSkillRows,
  type CoachingSkill,
  type TrainingCenterSkillRow,
} from "@/components/apprenant/profil-edge/coaching-skills";
import { TrainingCenterSkillsCockpit } from "@/components/apprenant/profil-edge/training-center-skills-cockpit";
import { SkillUniverseView } from "@/components/apprenant/profil-edge/skill-universe-view";
import { useProfilEdgeHub } from "@/components/apprenant/profil-edge/profil-edge-hub-provider";
import { APPRENANT_PAGE_SHELL, CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { encodeSkillParam } from "@/lib/apprenant/edge-skills-center";

const QUICK_ACTIONS = [
  { label: "Exercices", href: "/dashboard/apprenant/skills/entrainement", icon: Dumbbell },
  { label: "Open badges", href: "/dashboard/apprenant/skills/badges", icon: Award },
  { label: "Preuves", href: "/dashboard/apprenant/skills/prove", icon: FileCheck2 },
] as const;

const SHELL = `${APPRENANT_PAGE_SHELL} mx-auto w-full max-w-6xl`;

export function TrainingCenterReport() {
  const data = useProfilEdgeHub();
  const [selected, setSelected] = useState<CoachingSkill | null>(null);

  const coaching = useMemo(() => {
    if (!data.matching) return null;
    return buildCoachingSkillsFromMatching(data.matching, data.objectiveLabel);
  }, [data.matching, data.objectiveLabel]);

  const skillRows = useMemo(() => {
    if (!data.matching) return [];
    return buildTrainingCenterSkillRows(data.matching, data.objectiveLabel);
  }, [data.matching, data.objectiveLabel]);

  const matching = data.matching;
  const score = matching?.compatibilityScore;
  const referentialTitle = data.selectedCareer?.title ?? data.objectiveLabel;

  const handleSelectRow = (item: TrainingCenterSkillRow) => {
    setSelected(item.coaching);
  };

  if (data.loading && !data.discScores) {
    return (
      <EdgePageAmbiance ambiance="evolution">
        <div className={`${SHELL} space-y-4 pb-20`}>
          <div className="h-20 animate-pulse rounded-2xl bg-white/[0.06]" />
          <div className="h-64 animate-pulse rounded-2xl bg-white/[0.05]" />
        </div>
      </EdgePageAmbiance>
    );
  }

  if (!data.discScores) {
    return (
      <EdgePageAmbiance ambiance="evolution">
        <div className={`${SHELL} space-y-6 pb-20`}>
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Training center
            </p>
            <h1 className="mt-1 text-[1.65rem] font-bold tracking-[-0.03em] text-white">
              Passez d&apos;abord vos diagnostics
            </h1>
          </header>
          <Link href="/dashboard/apprenant/test-comportemental-intro" className={`${CONNECT_BTN_PRIMARY} w-fit`}>
            Commencer DISC
          </Link>
        </div>
      </EdgePageAmbiance>
    );
  }

  if (selected) {
    return (
      <EdgePageAmbiance ambiance="evolution">
        <div className={`${SHELL} max-w-4xl pb-24 pt-2`}>
          <SkillUniverseView
            skill={selected}
            objectiveLabel={data.objectiveLabel}
            onBack={() => setSelected(null)}
          />
        </div>
      </EdgePageAmbiance>
    );
  }

  return (
    <EdgePageAmbiance ambiance="evolution">
      <div className={`${SHELL} space-y-8 pb-24 pt-1`}>
        <header className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Training center
              </p>
              <h1 className="mt-1 text-[1.35rem] font-bold tracking-[-0.03em] text-white sm:text-[1.5rem]">
                Centre de pilotage compétences
              </h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/50">
                {data.hasProject ? (
                  <>
                    Objectif&nbsp;: <span className="font-medium text-white/80">{data.objectiveLabel}</span>
                    {referentialTitle && referentialTitle !== data.objectiveLabel ? (
                      <span className="text-white/40"> · référentiel {referentialTitle}</span>
                    ) : null}
                  </>
                ) : (
                  "Définissez votre objectif pour afficher le référentiel complet."
                )}
              </p>
            </div>

            {score != null ? (
              <div className="flex shrink-0 items-end gap-6">
                <div className="text-right">
                  <p className="text-[2.35rem] font-bold leading-none tracking-[-0.04em] text-white tabular-nums">
                    {score}
                    <span className="text-[1rem] font-semibold text-white/45">%</span>
                  </p>
                  <p className="text-[11px] text-white/45">alignement métier global</p>
                </div>
              </div>
            ) : (
              <Link
                href={PROFIL_EDGE_SECTION_HREFS.projet}
                className="text-[13px] font-semibold text-[#9EC0FF] hover:underline"
              >
                Définir l&apos;objectif
              </Link>
            )}
          </div>

          {matching ? (
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-5 sm:grid-cols-4">
              {[
                { n: matching.develop.length, label: "À développer" },
                { n: matching.consolidate.length, label: "À consolider" },
                { n: matching.unevaluated.length, label: "À évaluer" },
                { n: matching.strengths.length, label: "Forces" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5"
                >
                  <p className="text-[1.25rem] font-bold tabular-nums text-white">{stat.n}</p>
                  <p className="text-[11px] text-white/45">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </header>

        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-white/85 transition hover:bg-white/[0.08]"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {!matching || !skillRows.length ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-[14px] text-white/50">
            Enregistrez votre{" "}
            <Link href={PROFIL_EDGE_SECTION_HREFS.projet} className="font-semibold text-[#9EC0FF]">
              objectif professionnel
            </Link>{" "}
            pour afficher l&apos;ensemble des compétences du référentiel métier.
          </div>
        ) : (
          <>
            <TrainingCenterSkillsCockpit rows={skillRows} onSelect={handleSelectRow} />

            {coaching?.priorities[0] ? (
              <Link
                href={`/dashboard/apprenant/skills/develop?skill=${encodeSkillParam(coaching.priorities[0].name)}`}
                className={`${CONNECT_BTN_PRIMARY} inline-flex w-full items-center justify-center gap-2 py-3.5 sm:w-auto sm:min-w-[280px]`}
              >
                <Play className="h-4 w-4" />
                Prochain exercice · {coaching.priorities[0].name}
              </Link>
            ) : null}
          </>
        )}
      </div>
    </EdgePageAmbiance>
  );
}
