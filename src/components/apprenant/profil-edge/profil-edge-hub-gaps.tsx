"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  FileCheck2,
  GraduationCap,
  MessageCircle,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import {
  getSkillGapTips,
  getSkillGapWhyImportant,
  getSkillWhatToDevelop,
  getSkillProgressionPlan,
} from "@/lib/particulier/edge-skill-gap-tips";
import {
  coachingForceAction,
  coachingLevelDisplay,
  coachingWhyUseful,
  expectedLevelForObjective,
} from "@/lib/apprenant/edge-coaching-copy";
import { getSkillEvidence } from "@/lib/apprenant/edge-skill-evidence";
import { missionHref } from "@/lib/apprenant/edge-mission-types";
import { EDGE_MISSION_LABEL } from "@/lib/apprenant/edge-missions";
import type { SkillGapStatus } from "@/lib/apprenant/edge-progression-gps";
import { ProfilEdgeHubCard, ProfilEdgeHubSection } from "./profil-edge-hub-card";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

type Props = {
  matching: CareerMatchingResult;
  objectiveLabel: string;
};

type CoachingSkill = {
  name: string;
  level: string;
  situation: string;
  whyUseful: string;
  nextAction: string;
  status: SkillGapStatus;
  expectedLevel: string;
  kind: "force" | "priority";
};

function levelFromTable(skill: string, matching: CareerMatchingResult): string {
  const row = matching.skillTable.find((r) => r.skill.toLowerCase() === skill.toLowerCase());
  return row?.userLevel ?? "Bon";
}

const RESERVATION_HREF = getCoachingBookingHref("progression");

export function ProfilEdgeHubGaps({ matching, objectiveLabel }: Props) {
  const [selected, setSelected] = useState<CoachingSkill | null>(null);
  const [showLater, setShowLater] = useState(false);

  const { forces, priorities, laterSkills } = useMemo(() => {
    const forces: CoachingSkill[] = matching.strengths.map((name, index) => ({
      name,
      level: coachingLevelDisplay(levelFromTable(name, matching)),
      situation: "Force identifiée",
      whyUseful: coachingWhyUseful(name, objectiveLabel),
      nextAction: coachingForceAction(index),
      status: "validated" as SkillGapStatus,
      expectedLevel: expectedLevelForObjective("validated"),
      kind: "force" as const,
    }));

    const priorityNames = [
      ...matching.develop,
      ...matching.consolidate.filter((s) => !matching.develop.includes(s)),
    ].slice(0, 3);

    const priorities: CoachingSkill[] = priorityNames.map((name) => ({
      name,
      level: coachingLevelDisplay(levelFromTable(name, matching)),
      situation: "Priorité actuelle",
      whyUseful: coachingWhyUseful(name, objectiveLabel),
      nextAction: "Faire l'exercice guidé",
      status: "priority" as SkillGapStatus,
      expectedLevel: expectedLevelForObjective("priority"),
      kind: "priority" as const,
    }));

    const laterSkills = matching.unevaluated;

    return { forces, priorities, laterSkills };
  }, [matching, objectiveLabel]);

  const tips = selected ? getSkillGapTips(selected.name) : [];
  const whatToDevelop = selected ? getSkillWhatToDevelop(selected.name) : [];
  const plan = selected ? getSkillProgressionPlan(selected.name) : [];
  const evidence = selected ? getSkillEvidence(selected.name, selected.status) : null;

  const firstAction = priorities[0] ?? forces[0] ?? null;

  return (
    <>
      <ProfilEdgeHubSection
        title="Ce sur quoi vous progressez"
        subtitle="Vos forces d'abord, puis une priorité claire — sans tout traiter en même temps."
      >
        {firstAction ? (
          <ProfilEdgeHubCard variant="accent" className="gap-5">
            <div className="flex items-center gap-2 text-[#8BB4FF]">
              <Sparkles className="h-4 w-4" />
              <span className="text-[11px] font-medium uppercase tracking-[0.16em]">Prochaine action</span>
            </div>
            <p className="text-2xl font-semibold tracking-[-0.02em] text-white">{firstAction.name}</p>
            <p className="text-[15px] leading-relaxed text-white/55">{firstAction.whyUseful}</p>
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
            <p className="text-sm font-medium text-white/60">Vos forces</p>
            <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 px-1 snap-x snap-mandatory">
              {forces.map((skill) => (
                <ProfilEdgeHubCard
                  key={skill.name}
                  variant="success"
                  onClick={() => setSelected(skill)}
                  className="min-w-[240px] max-w-[280px] shrink-0 snap-start justify-between gap-4"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-300/80">
                    Force
                  </p>
                  <p className="text-lg font-semibold text-white">{skill.name}</p>
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-white/50">{skill.whyUseful}</p>
                </ProfilEdgeHubCard>
              ))}
            </div>
          </div>
        ) : null}

        {priorities.length ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/60">Priorités actuelles</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {priorities.map((skill) => (
                <ProfilEdgeHubCard
                  key={skill.name}
                  variant="accent"
                  onClick={() => setSelected(skill)}
                  className="min-h-[160px] justify-between gap-4"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8BB4FF]">
                    Priorité
                  </p>
                  <p className="text-lg font-semibold leading-snug text-white">{skill.name}</p>
                  <p className="line-clamp-2 text-[13px] text-white/50">{skill.nextAction}</p>
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

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Niveau actuel</p>
                  <p className="mt-1 text-sm font-semibold text-white">{selected.level}</p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Attendu</p>
                  <p className="mt-1 text-sm font-semibold text-white">{selected.expectedLevel}</p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Situation</p>
                  <p className="mt-1 text-sm font-semibold text-white">{selected.situation}</p>
                </div>
              </div>

              {evidence ? (
                <div className="rounded-xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/[0.06] p-4">
                  <p className="text-sm font-semibold text-white">{evidence.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{evidence.intro}</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-white/75">
                    {evidence.behaviors.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8BB4FF]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-white/50">
                    Ces éléments correspondent aux attendus de cette compétence.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#3D7BFF]"
                        style={{ width: `${evidence.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#8BB4FF]">
                      Confiance {evidence.confidence} %
                    </span>
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Pourquoi cette compétence compte
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {getSkillGapWhyImportant(selected.name, objectiveLabel)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Ce qu&apos;il faut développer
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-white/70">
                  {whatToDevelop.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8BB4FF]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[#3D7BFF]/25 bg-[#3D7BFF]/[0.06] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8BB4FF]">
                  {EDGE_MISSION_LABEL}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Le Coach EDGE prépare une mission contextualisée pour développer « {selected.name} » : mise en
                  situation, personnages, objectif pédagogique. Chaque mission est unique.
                </p>
                <Link
                  href={missionHref(selected.name, {
                    objective: objectiveLabel,
                    target: selected.expectedLevel,
                    level: selected.level,
                  })}
                  className={`${CONNECT_BTN_PRIMARY} mt-4 inline-flex w-full items-center justify-center gap-2 py-2.5 text-sm`}
                >
                  <Play className="h-4 w-4" />
                  Lancer une mission
                </Link>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Comment progresser</p>
                <ol className="mt-3 space-y-2">
                  {plan.map((step, index) => (
                    <li
                      key={step.label}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3D7BFF]/20 text-[11px] font-bold text-[#8BB4FF]">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm text-white/75">{step.label}</span>
                      {step.meta ? <span className="text-[11px] text-white/40">{step.meta}</span> : null}
                    </li>
                  ))}
                </ol>
                {tips.length ? (
                  <p className="mt-3 text-xs leading-relaxed text-white/45">Conseil : {tips[0]}</p>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-white/[0.08] pt-4">
                <Link
                  href={missionHref(selected.name, {
                    objective: objectiveLabel,
                    target: selected.expectedLevel,
                    level: selected.level,
                  })}
                  className={`${CONNECT_BTN_PRIMARY} flex w-full items-center justify-center py-3`}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Commencer ma progression
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={missionHref(selected.name, { objective: objectiveLabel, target: selected.expectedLevel })}
                    className={`${CONNECT_BTN_SECONDARY} flex items-center justify-center gap-1.5 py-2 text-xs`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {EDGE_MISSION_LABEL}
                  </Link>
                  <Link
                    href="/dashboard/apprenant/profil"
                    className={`${CONNECT_BTN_SECONDARY} flex items-center justify-center gap-1.5 py-2 text-xs`}
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Déposer une preuve
                  </Link>
                  <Link
                    href="/dashboard/apprenant/coaching"
                    className={`${CONNECT_BTN_SECONDARY} flex items-center justify-center gap-1.5 py-2 text-xs`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Formations
                  </Link>
                  <Link
                    href={RESERVATION_HREF}
                    className={`${CONNECT_BTN_SECONDARY} flex items-center justify-center gap-1.5 py-2 text-xs`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Coaching
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
