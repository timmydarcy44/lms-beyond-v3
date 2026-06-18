"use client";

import { useEffect, useState } from "react";
import { ApprenantOpenBadgesSection } from "@/components/apprenant/apprenant-open-badges-section";
import { ApprenantWalletBadgesGrid } from "@/components/apprenant/apprenant-wallet-badges-grid";
import type {
  LearnerEarnedOpenBadge,
  LearnerVisibleOpenBadge,
} from "@/lib/openbadges/learner-visible-badges";
import {
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

export default function SalarieWalletPage() {
  const [loading, setLoading] = useState(true);
  const [earnedOpenBadges, setEarnedOpenBadges] = useState<LearnerEarnedOpenBadge[]>([]);
  const [visibleOpenBadges, setVisibleOpenBadges] = useState<LearnerVisibleOpenBadge[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/learner-wallet", { credentials: "include" });
        const json = (await res.json()) as {
          earnedOpenBadges?: LearnerEarnedOpenBadge[];
          visibleOpenBadges?: LearnerVisibleOpenBadge[];
        };
        if (!cancelled) {
          setEarnedOpenBadges(json.earnedOpenBadges ?? []);
          setVisibleOpenBadges(json.visibleOpenBadges ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="space-y-2">
        <p className={SALARIE_PAGE_KICKER}>Wallet</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mes Open Badges</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Retrouvez vos badges EDGE validés et découvrez ceux que vous pouvez obtenir.
        </p>
      </section>

      {loading ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
      ) : (
        <>
          <ApprenantWalletBadgesGrid badges={earnedOpenBadges} />
          {visibleOpenBadges.length > 0 ? (
            <section className="space-y-4 pt-4">
              <div className="space-y-1">
                <p className={SALARIE_PAGE_KICKER}>À obtenir</p>
                <h2 className="text-lg font-medium text-white">Badges disponibles</h2>
              </div>
              <ApprenantOpenBadgesSection badges={visibleOpenBadges} />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
