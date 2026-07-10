"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";

type Props = {
  matching: CareerMatchingResult;
};

export function ProfilEdgeHubActionPlan({ matching }: Props) {
  const priorities = [
    ...matching.develop,
    ...matching.consolidate.filter((s) => !matching.develop.includes(s)),
  ].slice(0, 5);

  if (!priorities.length) return null;

  return (
    <section className="rounded-2xl border border-[#3D7BFF]/25 bg-gradient-to-br from-[#3D7BFF]/10 to-transparent p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
        4. Mon plan d&apos;action
      </p>
      <p className="mt-2 text-sm text-white/55">Vos prochaines progressions, par ordre de priorité.</p>

      <ol className="mt-5 space-y-2">
        {priorities.map((skill, index) => (
          <li
            key={skill}
            className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3D7BFF]/20 text-xs font-bold text-[#8BB4FF]">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-white">{skill}</span>
          </li>
        ))}
      </ol>

      <Link
        href={getCoachingBookingHref("progression")}
        className={`${CONNECT_BTN_PRIMARY} mt-6 inline-flex w-full items-center justify-center gap-2 sm:w-auto`}
      >
        Construire mon parcours avec un expert
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
