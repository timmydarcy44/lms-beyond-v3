"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import {
  getSkillGapTips,
  getSkillGapWhyImportant,
} from "@/lib/particulier/edge-skill-gap-tips";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";

type Props = {
  matching: CareerMatchingResult;
  objectiveLabel: string;
};

export function ProfilEdgeHubGaps({ matching, objectiveLabel }: Props) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const skillsToWork = [
    ...matching.develop,
    ...matching.consolidate.filter((s) => !matching.develop.includes(s)),
  ];

  if (!skillsToWork.length) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
          3. Vos écarts
        </p>
        <p className="mt-3 text-sm text-white/55">Aucun écart prioritaire identifié pour le moment.</p>
      </section>
    );
  }

  const tips = selectedSkill ? getSkillGapTips(selectedSkill) : [];

  return (
    <>
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
          3. Vos écarts
        </p>
        <p className="mt-2 text-sm text-white/50">Compétences à travailler en priorité.</p>

        <ul className="mt-4 divide-y divide-white/[0.06]">
          {skillsToWork.map((skill) => (
            <li key={skill}>
              <button
                type="button"
                onClick={() => setSelectedSkill(skill)}
                className="flex w-full items-center justify-between gap-3 py-3.5 text-left transition hover:bg-white/[0.03]"
              >
                <span className="text-sm font-medium text-white">{skill}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedSkill ? (
        <div className="fixed inset-0 z-[160] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setSelectedSkill(null)}
            aria-label="Fermer"
          />
          <aside className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#12141C] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Compétence</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{selectedSkill}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSkill(null)}
                className="rounded-full border border-white/10 p-2 text-white/50 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Pourquoi est-elle importante ?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {getSkillGapWhyImportant(selectedSkill, objectiveLabel)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Conseils concrets
                </p>
                <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-white/75">
                  {tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ol>
              </div>

              <Link
                href={getCoachingBookingHref("progression")}
                className={`${CONNECT_BTN_PRIMARY} flex w-full items-center justify-center py-3`}
              >
                Être accompagné par un spécialiste EDGE
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
