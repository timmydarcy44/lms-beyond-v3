"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CareerNextPriority, CareerSkillRow } from "@/lib/career-profiles/career-profile-matching";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";

const TONE_CLASS: Record<CareerSkillRow["tone"], string> = {
  green: "text-emerald-400",
  orange: "text-amber-300",
  red: "text-red-400",
  gray: "text-white/45",
};

const FUTURE_PROGRESSION_TYPES = ["Micro-formation", "Coaching", "Exercice pratique", "Open Badge"] as const;

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
  return "/dashboard/apprenant/formations";
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
          <p className="mt-2 text-xl font-bold text-white">{next.skill.charAt(0).toUpperCase() + next.skill.slice(1)}</p>
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
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Compétences à développer</p>
          <p className="mt-2 text-sm text-white/55">
            Des parcours de progression seront proposés pour chaque compétence identifiée.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {prioritySkills.map((skill) => (
              <div key={skill} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="font-semibold text-white">Développer {skill.charAt(0).toUpperCase() + skill.slice(1)}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-amber-300/80">Bientôt disponible</p>
                <ul className="mt-3 space-y-1 text-xs text-white/45">
                  {FUTURE_PROGRESSION_TYPES.map((type) => (
                    <li key={type}>· {type}</li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/apprenant/formations"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/[0.08]"
                >
                  Explorer les micro-formations
                </Link>
              </div>
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
                <li key={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</li>
              ))}
            </ul>
            <Link
              href="/dashboard/apprenant/formations"
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-violet-200 hover:text-white"
            >
              Voir les micro-formations recommandées
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
