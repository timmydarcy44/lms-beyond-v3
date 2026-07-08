"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  X,
  Play,
  FileCheck2,
  GraduationCap,
  MessageCircle,
  Sparkles,
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
  isUnevaluatedLevel,
} from "@/lib/apprenant/edge-coaching-copy";
import { getSkillEvidence } from "@/lib/apprenant/edge-skill-evidence";
import { missionHref } from "@/lib/apprenant/edge-mission-types";
import { EDGE_MISSION_LABEL } from "@/lib/apprenant/edge-missions";
import type { SkillGapStatus } from "@/lib/apprenant/edge-progression-gps";
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

  const firstPriority = priorities[0]?.name ?? "à définir";

  return (
    <>
      {/* Bloc résumé — hiérarchie de lecture positive */}
      <section className="rounded-2xl border border-[#3D7BFF]/25 bg-gradient-to-br from-[#3D7BFF]/[0.12] to-transparent p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[#8BB4FF]">
          <Sparkles className="h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Votre progression</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-white">Votre parcours commence déjà</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
          EDGE a identifié vos premières forces et vous propose de progresser étape par étape, sans tout
          travailler en même temps.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center">
            <p className="text-2xl font-bold tabular-nums text-emerald-300">{forces.length}</p>
            <p className="mt-1 text-[11px] text-white/55">Forces identifiées</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center">
            <p className="truncate text-sm font-semibold text-[#8BB4FF]">{firstPriority}</p>
            <p className="mt-1 text-[11px] text-white/55">Priorité actuelle</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center">
            <p className="text-2xl font-bold tabular-nums text-white/70">{laterSkills.length}</p>
            <p className="mt-1 text-[11px] text-white/55">À explorer plus tard</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setSelected(priorities[0] ?? forces[0] ?? null)}
            className={`${CONNECT_BTN_PRIMARY} inline-flex items-center justify-center gap-2`}
            disabled={!priorities.length && !forces.length}
          >
            <Play className="h-4 w-4" />
            Commencer ma prochaine action
          </button>
          <Link
            href={RESERVATION_HREF}
            className={`${CONNECT_BTN_SECONDARY} inline-flex items-center justify-center gap-2`}
          >
            Construire mon parcours EDGE avec un expert
          </Link>
        </div>
      </section>

      {/* Tableau principal : forces + priorités uniquement */}
      {forces.length || priorities.length ? (
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">Vos forces &amp; priorités</p>

          <div className="mt-4 hidden grid-cols-[1.1fr_1fr_1.4fr_1.2fr] gap-3 border-b border-white/[0.06] pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/35 md:grid">
            <span>Compétence</span>
            <span>Situation actuelle</span>
            <span>Pourquoi c&apos;est utile</span>
            <span>Prochaine action</span>
          </div>

          <ul className="divide-y divide-white/[0.06]">
            {[...forces, ...priorities].map((skill) => (
              <li key={`${skill.kind}-${skill.name}`}>
                <button
                  type="button"
                  onClick={() => setSelected(skill)}
                  className="w-full py-3 text-left transition hover:bg-white/[0.03] md:grid md:grid-cols-[1.1fr_1fr_1.4fr_1.2fr] md:items-center md:gap-3"
                >
                  <span className="flex items-center justify-between gap-2 md:block">
                    <span className="text-sm font-medium text-white">{skill.name}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/30 md:hidden" />
                  </span>
                  <span className="mt-1 block md:mt-0">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        skill.kind === "force"
                          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
                          : "bg-[#3D7BFF]/20 text-[#8BB4FF] ring-1 ring-[#3D7BFF]/35"
                      }`}
                    >
                      {skill.situation}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-white/55 md:mt-0">{skill.whyUseful}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-white/70 md:mt-0">
                    {skill.nextAction}
                    <ChevronRight className="hidden h-4 w-4 shrink-0 text-white/30 md:block" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Bloc replié : compétences à explorer plus tard */}
      {laterSkills.length ? (
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
          <button
            type="button"
            onClick={() => setShowLater((v) => !v)}
            className="flex w-full items-center justify-between gap-4 text-left"
            aria-expanded={showLater}
          >
            <div>
              <h3 className="text-sm font-semibold text-white">Compétences à explorer plus tard</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                Ces compétences ne sont pas des lacunes. Elles seront évaluées progressivement si elles
                deviennent utiles pour votre objectif professionnel.
              </p>
              <p className="mt-2 text-xs font-medium text-white/60">
                {laterSkills.length} compétence{laterSkills.length > 1 ? "s" : ""} disponible
                {laterSkills.length > 1 ? "s" : ""}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70">
              {showLater ? "Masquer" : "Afficher"}
              <ChevronDown className={`h-4 w-4 transition-transform ${showLater ? "rotate-180" : ""}`} />
            </span>
          </button>

          {showLater ? (
            <ul className="mt-4 divide-y divide-white/[0.06]">
              {laterSkills.map((skill) => (
                <li key={skill} className="flex items-center justify-between gap-3 py-2.5">
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
        </section>
      ) : null}

      {/* Drawer coaching (5 blocs) */}
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

              {/* Pourquoi EDGE pense cela ? + niveau de confiance */}
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

              {/* Mission EDGE — scénario personnalisé par le coach */}
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
