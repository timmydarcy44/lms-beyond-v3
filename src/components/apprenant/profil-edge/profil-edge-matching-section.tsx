"use client";

import type { CareerMatchingResult, CareerSkillRow } from "@/lib/career-profiles/career-profile-matching";

const TONE_CLASS: Record<CareerSkillRow["tone"], string> = {
  green: "text-emerald-400",
  orange: "text-amber-300",
  red: "text-red-400",
  gray: "text-white/45",
};

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

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">Vos forces</p>
            <ul className="mt-2 space-y-1">
              {matching.strengths.map((s) => (
                <li key={s} className="text-sm text-white/80">
                  ✔ {s.charAt(0).toUpperCase() + s.slice(1)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">À renforcer</p>
            <ul className="mt-2 space-y-1">
              {matching.gaps.map((s) => (
                <li key={s} className="text-sm text-white/75">
                  · {s.charAt(0).toUpperCase() + s.slice(1)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 overflow-x-auto">
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

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Plan d&apos;action personnalisé</p>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
          {planLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-sm leading-relaxed text-white/55">
          Votre espace EDGE est en cours d&apos;évolution. Votre plan personnalisé sera enrichi progressivement à mesure
          que de nouveaux contenus seront disponibles.
        </p>
      </section>
    </div>
  );
}
