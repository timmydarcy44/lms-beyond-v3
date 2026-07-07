"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, X, Play, FileCheck2, GraduationCap, MessageCircle } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import {
  getSkillGapTips,
  getSkillGapWhyImportant,
  getSkillWhatToDevelop,
  getSkillProgressionPlan,
} from "@/lib/particulier/edge-skill-gap-tips";
import {
  coachingImportanceLabel,
  coachingLevelDisplay,
  coachingNextAction,
  coachingStatusDisplay,
  expectedLevelForObjective,
  isUnevaluatedLevel,
} from "@/lib/apprenant/edge-coaching-copy";
import type { SkillGapStatus } from "@/lib/apprenant/edge-progression-gps";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

type Props = {
  matching: CareerMatchingResult;
  objectiveLabel: string;
};

type CoachingSkill = {
  name: string;
  level: string;
  isUnevaluated: boolean;
  status: SkillGapStatus;
  importance: "Très importante" | "Importante" | "Utile";
  nextAction: string;
  statusLabel: string;
  expectedLevel: string;
};

function statusFor(skill: string, matching: CareerMatchingResult): SkillGapStatus {
  const lower = skill.toLowerCase();
  if (matching.strengths.some((s) => s.toLowerCase() === lower)) return "validated";
  if (matching.develop.some((s) => s.toLowerCase() === lower)) return "priority";
  if (matching.consolidate.some((s) => s.toLowerCase() === lower)) return "to_develop";
  return "to_develop";
}

const STATUS_PILL: Record<string, string> = {
  Alignée: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  "En progression": "bg-cyan-500/12 text-cyan-200 ring-1 ring-cyan-500/20",
  "Priorité EDGE": "bg-[#3D7BFF]/20 text-[#8BB4FF] ring-1 ring-[#3D7BFF]/35",
  "À consolider": "bg-amber-500/12 text-amber-200/90 ring-1 ring-amber-500/20",
  "À évaluer": "bg-white/[0.06] text-white/50 ring-1 ring-white/10",
  "Badge disponible": "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25",
};

const IMPORTANCE_PILL: Record<string, string> = {
  "Très importante": "text-[#8BB4FF]",
  Importante: "text-white/70",
  Utile: "text-white/45",
};

export function ProfilEdgeHubGaps({ matching, objectiveLabel }: Props) {
  const [selected, setSelected] = useState<CoachingSkill | null>(null);

  const skills = useMemo<CoachingSkill[]>(() => {
    const rows = matching.skillTable.length
      ? matching.skillTable.map((r) => ({ name: r.skill, level: r.userLevel }))
      : [
          ...matching.develop.map((s) => ({ name: s, level: "À renforcer" })),
          ...matching.consolidate.map((s) => ({ name: s, level: "Moyen" })),
          ...matching.unevaluated.map((s) => ({ name: s, level: "Non évaluée" })),
        ];

    return rows.map(({ name, level }) => {
      const unevaluated = isUnevaluatedLevel(level);
      const status = unevaluated ? "to_develop" : statusFor(name, matching);
      return {
        name,
        level: coachingLevelDisplay(level),
        isUnevaluated: unevaluated,
        status,
        importance: coachingImportanceLabel(status, unevaluated),
        nextAction: coachingNextAction(name, status, unevaluated),
        statusLabel: coachingStatusDisplay(status, unevaluated),
        expectedLevel: expectedLevelForObjective(status),
      };
    });
  }, [matching]);

  if (!skills.length) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">3. Vos écarts</p>
        <p className="mt-3 text-sm text-white/55">Vos compétences apparaîtront ici après vos évaluations.</p>
      </section>
    );
  }

  const tips = selected ? getSkillGapTips(selected.name) : [];
  const whatToDevelop = selected ? getSkillWhatToDevelop(selected.name) : [];
  const plan = selected ? getSkillProgressionPlan(selected.name) : [];

  return (
    <>
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">3. Vos écarts</p>
        <p className="mt-2 text-sm text-white/50">
          Pour chaque compétence, EDGE vous indique où vous en êtes et la prochaine action utile.
        </p>

        {/* En-têtes (desktop) */}
        <div className="mt-4 hidden grid-cols-[1.4fr_0.8fr_0.9fr_1.3fr_0.9fr] gap-3 border-b border-white/[0.06] pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/35 md:grid">
          <span>Compétence</span>
          <span>Niveau actuel</span>
          <span>Importance</span>
          <span>Prochaine action</span>
          <span>Statut EDGE</span>
        </div>

        <ul className="divide-y divide-white/[0.06]">
          {skills.map((skill) => (
            <li key={skill.name}>
              <button
                type="button"
                onClick={() => setSelected(skill)}
                className="w-full py-3 text-left transition hover:bg-white/[0.03] md:grid md:grid-cols-[1.4fr_0.8fr_0.9fr_1.3fr_0.9fr] md:items-center md:gap-3"
              >
                <span className="flex items-center justify-between gap-2 md:block">
                  <span className="text-sm font-medium text-white">{skill.name}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/30 md:hidden" />
                </span>
                <span className="mt-1 block text-xs text-white/60 md:mt-0 md:text-sm">{skill.level}</span>
                <span className={`mt-1 block text-xs md:mt-0 ${IMPORTANCE_PILL[skill.importance]}`}>
                  {skill.importance}
                </span>
                <span className="mt-1 block text-xs text-white/55 md:mt-0">{skill.nextAction}</span>
                <span className="mt-2 flex items-center gap-2 md:mt-0">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      STATUS_PILL[skill.statusLabel] ?? "bg-white/[0.06] text-white/50 ring-1 ring-white/10"
                    }`}
                  >
                    {skill.statusLabel}
                  </span>
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-white/30 md:block" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

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
              {/* Bloc 1 — Votre niveau actuel */}
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
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Écart</p>
                  <p className="mt-1 text-sm font-semibold text-white">{selected.statusLabel}</p>
                </div>
              </div>

              {/* Bloc 2 — Pourquoi cette compétence compte */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Pourquoi cette compétence compte
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {getSkillGapWhyImportant(selected.name, objectiveLabel)}
                </p>
              </div>

              {/* Bloc 3 — Ce qu'il faut développer */}
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

              {/* Bloc 4 — Comment progresser */}
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

              {/* Bloc 5 — Prochaine action recommandée */}
              <div className="space-y-2 border-t border-white/[0.08] pt-4">
                <Link
                  href="/dashboard/apprenant?premiers-pas=1"
                  className={`${CONNECT_BTN_PRIMARY} flex w-full items-center justify-center py-3`}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Commencer ma progression
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard/apprenant?premiers-pas=1"
                    className={`${CONNECT_BTN_SECONDARY} flex items-center justify-center gap-1.5 py-2 text-xs`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Simulation IA
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
                    href={getCoachingBookingHref("progression")}
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
