"use client";

import Link from "next/link";
import { Award, Lock } from "lucide-react";
import { CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { HubSectionHeader, HubSurface } from "./hub-ui";

type Props = {
  testsComplete: boolean;
  badgeAwarded: boolean;
  badgeName: string;
};

export function AchievementsCard({ testsComplete, badgeAwarded, badgeName }: Props) {
  return (
    <section>
      <HubSectionHeader title="Mes réussites" />
      <HubSurface tone="quiet" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05]">
            {testsComplete && badgeAwarded ? (
              <Award className="h-5 w-5 text-[#FF3B30]" />
            ) : (
              <Lock className="h-5 w-5 text-white/35" />
            )}
          </div>
          <div>
            {!testsComplete ? (
              <>
                <p className="text-[16px] font-medium text-white">Profil EDGE en cours</p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/45">
                  Badge délivré après les 3 tests EDGE.
                </p>
              </>
            ) : badgeAwarded ? (
              <>
                <p className="text-[16px] font-medium text-white">Votre profil comportemental EDGE est validé.</p>
                <p className="mt-1 text-[13px] text-white/45">{badgeName}</p>
              </>
            ) : (
              <>
                <p className="text-[16px] font-medium text-white">Aucun badge disponible pour le moment</p>
                <p className="mt-1 text-[13px] text-white/45">Terminez les explorations pour le débloquer.</p>
              </>
            )}
          </div>
        </div>
        {badgeAwarded ? (
          <Link href="/dashboard/apprenant/badges" className={`${CONNECT_BTN_SECONDARY} shrink-0 justify-center`}>
            Voir mon Wallet
          </Link>
        ) : (
          <Link
            href="/dashboard/apprenant/profil-comportemental/tests"
            className={`${CONNECT_BTN_SECONDARY} shrink-0 justify-center`}
          >
            Voir mes tests
          </Link>
        )}
      </HubSurface>
    </section>
  );
}
