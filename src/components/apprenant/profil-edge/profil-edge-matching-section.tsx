"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CareerNextPriority, CareerMatchingResult, CareerSkillRow } from "@/lib/career-profiles/career-profile-matching";
import {
  EDGE_CTA_START_PARCOURS,
  PARCOURS_EDGE_INCLUDES,
  premiumSkillTitle,
  skillProgressionCta,
} from "@/lib/edge-skill-progression-copy";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";

const TONE_CLASS: Record<CareerSkillRow["tone"], string> = {
  green: "text-emerald-400",
  orange: "text-amber-300",
  red: "text-red-400",
  gray: "text-white/45",
};

const FUTURE_PROGRESSION_TYPES = [...PARCOURS_EDGE_INCLUDES] as const;

function SkillList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) {
    return <p className="mt-2 text-sm text-white/40">{emptyLabel}</p>;
  }
  return (
    <ul className="mt-2 space-y-1">
      {items.map((s) => (
        <li key={s} className="text-sm text-white/80">
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </li>
      ))}
    </ul>
  );
}

function priorityActionHref(actionType: CareerNextPriority["actionType"]): string {
  if (actionType === "evaluation" || actionType === "proof") return PROFIL_EDGE_SECTION_HREFS.hard_skills;
  return "/dashboard/apprenant/parcours";
}

type Props = {
  careerTitle: string;
  matching: CareerMatchingResult;
  actionPlan: string;
};

export function ProfilEdgeMatchingSection({ careerTitle, matching, actionPlan }: Props) {
  const planLines = actionPlan.split("\n").filter(Boolean);
  const prioritySkills = [...matching.develop, ...matching.consolidate].slice(0, 3);
  const next = matching.nextPriority;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Compatibilité métier</p>
        <p className="mt-1 text-2xl font-bold text-white">{matching.compatibilityScore} %</p>
        <p className="mt-2 text-sm text-white/60">{careerTitle}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">Forces</p>
            <SkillList items={matching.strengths} emptyLabel="Évaluation en cours." />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-300/80">À consolider</p>
            <SkillList items={matching.consolidate} emptyLabel="Profil déjà solide sur ce volet." />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">Non évaluées</p>
            <SkillList items={matching.unevaluated} emptyLabel="Toutes les compétences sont évaluées." />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400/80">À développer</p>
            <SkillList items={matching.develop} emptyLabel="Aucune lacune critique identifiée." />
          </div>
        </div>
      </section>

      {next ? (
        <section className="rounded-2xl border border-[#FF3B30]/25 bg-gradient-to-br from-[#FF3B30]/10 via-white/[0.03] to-transparent p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF3B30]/80">Votre prochaine priorité</p>
          <p className="mt-2 text-xl font-bold text-white">{premiumSkillTitle(next.skill)}</p>
          <p className="mt-1 text-sm text-white/55">
            Impact estimé sur votre compatibilité métier :{" "}
            <span className="font-semibold text-emerald-400">+{next.impactPercent} %</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={priorityActionHref(next.actionType)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-950 hover:bg-white/90"
            >
              {next.actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {next.actionType !== "evaluation" ? (
              <Link
                href={PROFIL_EDGE_SECTION_HREFS.hard_skills}
                className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/[0.06]"
              >
                Passer une nouvelle évaluation
              </Link>
            ) : null}
            {next.actionType !== "proof" ? (
              <Link
                href={PROFIL_EDGE_SECTION_HREFS.hard_skills}
                className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/[0.06]"
              >
                Déposer une preuve
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Tableau de compétences</p>
        <table className="mt-4 w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="pb-2 pr-4 font-semibold">Compétence</th>
              <th className="pb-2 font-semibold">Votre niveau</th>
            </tr>
          </thead>
          <tbody>
            {matching.skillTable.map((row) => (
              <tr key={row.skill} className="border-b border-white/5">
                <td className="py-2.5 pr-4 text-white/85">{row.skill}</td>
                <td className={`py-2.5 font-medium ${TONE_CLASS[row.tone]}`}>{row.userLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {prioritySkills.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Accompagnement personnalisé</p>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Chaque compétence identifiée ouvre un parcours EDGE structuré — pas une simple liste de contenus.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {prioritySkills.map((skill) => (
              <article
                key={skill}
                className="flex flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-6"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Progression EDGE</p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">{premiumSkillTitle(skill)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  Cette compétence limite actuellement votre compatibilité avec le métier visé.
                </p>
                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Parcours EDGE</p>
                <ul className="mt-3 space-y-2">
                  {FUTURE_PROGRESSION_TYPES.map((type) => (
                    <li key={type} className="flex items-center gap-2.5 text-sm text-white/75">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-[10px] text-emerald-400">
                        ✓
                      </span>
                      {type}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/apprenant/parcours"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-gray-950 transition hover:bg-white/90"
                >
                  {EDGE_CTA_START_PARCOURS}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Plan d&apos;action personnalisé</p>
        {prioritySkills.length > 0 ? (
          <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
            <p className="text-sm font-semibold text-white">Votre prochaine étape</p>
            <p className="mt-2 text-sm text-white/70">
              Vous pourriez augmenter votre compatibilité de{" "}
              <span className="font-semibold text-emerald-400">
                +{next?.impactPercent ?? 6} %
              </span>{" "}
              en travaillant :
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-white/75">
              {prioritySkills.map((s) => (
                <li key={s}>{premiumSkillTitle(s)}</li>
              ))}
            </ul>
            <Link
              href="/dashboard/apprenant/parcours"
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-violet-200 hover:text-white"
            >
              {skillProgressionCta("parcours")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : null}
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
          {planLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
