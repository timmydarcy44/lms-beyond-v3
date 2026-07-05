"use client";

import type { CareerMatchingResult, CareerSkillRow } from "@/lib/career-profiles/career-profile-matching";

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

type Props = {
  careerTitle: string;
  matching: CareerMatchingResult;
  actionPlan: string;
};

export function ProfilEdgeMatchingSection({ careerTitle, matching, actionPlan }: Props) {
  const planLines = actionPlan.split("\n").filter(Boolean);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Compatibilité métier</p>
        <p className="mt-1 text-2xl font-bold text-white">{matching.compatibilityScore} %</p>
        <p className="mt-2 text-sm text-white/60">{careerTitle}</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">Vos forces</p>
            <SkillList items={matching.strengths} emptyLabel="Aucune force identifiée pour le moment." />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">À renforcer</p>
            <SkillList items={matching.gaps} emptyLabel="Aucun axe prioritaire identifié." />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Non évalué</p>
            <SkillList items={matching.unevaluated} emptyLabel="Toutes les compétences sont évaluées." />
          </div>
        </div>
      </section>

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

      {matching.gaps.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Compétences à développer</p>
          <p className="mt-2 text-sm text-white/55">
            Des parcours de progression seront proposés pour chaque compétence à renforcer.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {matching.gaps.map((skill) => (
              <div key={skill} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="font-semibold text-white">Développer {skill.charAt(0).toUpperCase() + skill.slice(1)}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-amber-300/80">Bientôt disponible</p>
                <ul className="mt-3 space-y-1 text-xs text-white/45">
                  {FUTURE_PROGRESSION_TYPES.map((type) => (
                    <li key={type}>· {type}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled
                  className="mt-4 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/35"
                >
                  Disponible prochainement
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Plan d&apos;action personnalisé</p>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
          {planLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
