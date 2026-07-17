"use client";

import Link from "next/link";
import { Award, Lock } from "lucide-react";
import { HubPillCta, HubSectionHeader, HubSurface } from "./hub-ui";

type Props = {
  testsComplete: boolean;
  badgeAwarded: boolean;
  badgeName: string;
};

export function AchievementsCard({ testsComplete, badgeAwarded, badgeName }: Props) {
  const unlocked = testsComplete && badgeAwarded;

  return (
    <section>
      <HubSectionHeader title="Mes réussites" subtitle="Badges, validations et Wallet." />
      <HubSurface
        tone={unlocked ? "gold" : "slate"}
        className="flex min-h-[220px] flex-col justify-between gap-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-white/15 backdrop-blur-sm">
            {unlocked ? (
              <Award className="h-7 w-7 text-white" />
            ) : (
              <Lock className="h-7 w-7 text-white/70" />
            )}
          </div>
          <div>
            {!testsComplete ? (
              <>
                <p className="text-[1.35rem] font-bold tracking-[-0.02em] text-white">
                  Profil EDGE en cours
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-white/75">
                  Badge délivré après les 3 tests EDGE.
                </p>
              </>
            ) : unlocked ? (
              <>
                <p className="text-[1.35rem] font-bold tracking-[-0.02em] text-white">
                  Votre profil comportemental EDGE est validé.
                </p>
                <p className="mt-2 text-[15px] text-white/75">{badgeName}</p>
              </>
            ) : (
              <>
                <p className="text-[1.35rem] font-bold tracking-[-0.02em] text-white">
                  Badge bientôt disponible
                </p>
                <p className="mt-2 text-[15px] text-white/75">
                  Terminez les explorations pour le débloquer.
                </p>
              </>
            )}
          </div>
        </div>

        <Link
          href={
            unlocked
              ? "/dashboard/apprenant/badges"
              : "/dashboard/apprenant/profil-comportemental/tests"
          }
        >
          <HubPillCta>{unlocked ? "Voir mon Wallet" : "Voir mes tests"}</HubPillCta>
        </Link>
      </HubSurface>
    </section>
  );
}
