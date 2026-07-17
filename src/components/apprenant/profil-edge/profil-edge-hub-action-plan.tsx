"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import { ProfilEdgeHubCard, ProfilEdgeHubSection } from "./profil-edge-hub-card";
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
    <ProfilEdgeHubSection
      title="Vos prochaines étapes"
      subtitle="EDGE ordonne vos progressions — une compétence à la fois."
    >
      <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 px-1 snap-x snap-mandatory">
        {priorities.map((skill, index) => (
          <ProfilEdgeHubCard
            key={skill}
            variant="muted"
            className="min-w-[220px] max-w-[260px] shrink-0 snap-start justify-between gap-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
              Étape {index + 1}
            </p>
            <p className="text-[17px] font-semibold leading-snug text-white">{skill}</p>
            <p className="text-[13px] text-white/45">Prochaine compétence à renforcer</p>
          </ProfilEdgeHubCard>
        ))}
      </div>

      <Link
        href={getCoachingBookingHref("progression")}
        className={`${CONNECT_BTN_PRIMARY} inline-flex w-full items-center justify-center gap-2 sm:w-auto`}
      >
        Construire mon parcours avec un expert
        <ArrowRight className="h-4 w-4" />
      </Link>
    </ProfilEdgeHubSection>
  );
}
