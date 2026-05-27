"use client";

import Link from "next/link";
import { Award } from "lucide-react";
import type { LearnerEarnedOpenBadge } from "@/lib/openbadges/learner-visible-badges";
import { LinkedInBadgeShareButton } from "@/components/apprenant/linkedin-badge-share-button";
import { APPRENANT_CARD_BODY, APPRENANT_CARD_KICKER } from "@/lib/apprenant/connect-nav";

export function ApprenantEdgeWalletSection({ badges }: { badges: LearnerEarnedOpenBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <section className={APPRENANT_CARD_BODY}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={APPRENANT_CARD_KICKER}>EDGE Wallet</p>
          <h2 className="text-base font-semibold text-white sm:text-lg">Badges obtenus</h2>
        </div>
        <Link
          href="/dashboard/apprenant/badges"
          className="text-[10px] font-medium uppercase tracking-wide text-white/45 hover:text-white"
        >
          Voir tout
        </Link>
      </div>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {badges.map((badge) => (
          <li key={badge.id} className="shrink-0">
            <div className="flex w-[min(100%,260px)] flex-col gap-2 rounded-lg border border-[rgba(255,59,48,0.28)] bg-[rgba(255,59,48,0.06)] px-3 py-2.5 sm:w-[260px]">
              <div className="flex items-center gap-3">
                {badge.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={badge.imageUrl}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-md object-cover ring-1 ring-[rgba(255,59,48,0.35)]"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[rgba(255,59,48,0.12)]">
                    <Award className="h-5 w-5 text-[#FF3B30]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold !text-white">{badge.name}</p>
                  <p className="mt-0.5 text-[10px] !text-white/60">
                    Obtenu le{" "}
                    {new Date(badge.awardedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
              <LinkedInBadgeShareButton
                badgeName={badge.name}
                level={badge.level}
                shareUrl={badge.shareUrl}
                variant="wallet-dark"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
