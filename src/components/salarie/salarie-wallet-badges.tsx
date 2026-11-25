"use client";

import { Award } from "lucide-react";
import type { LearnerEarnedOpenBadge } from "@/lib/openbadges/learner-visible-badges";
import { LinkedInBadgeShareButton } from "@/components/apprenant/linkedin-badge-share-button";

export function SalarieWalletBadges({ badges }: { badges: LearnerEarnedOpenBadge[] }) {
  if (badges.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-10 text-center">
        <p className="text-sm text-white/60">
          Aucun badge obtenu pour le moment. Passez vos 3 tests pour débloquer Connaissance de soi.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-10 flex flex-wrap justify-center gap-10">
      {badges.map((badge) => (
        <li key={badge.id} className="flex w-full max-w-[280px] flex-col items-center gap-5 text-center">
          {badge.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={badge.imageUrl}
              alt={badge.name}
              className="h-44 w-44 object-contain drop-shadow-[0_18px_40px_rgba(212,175,55,0.28)] sm:h-52 sm:w-52"
            />
          ) : (
            <div className="flex h-44 w-44 items-center justify-center rounded-full bg-white/[0.06] sm:h-52 sm:w-52">
              <Award className="h-16 w-16 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
          )}
          <div className="space-y-1">
            <p className="text-lg font-semibold text-white">{badge.name}</p>
            <p className="text-xs text-white/50">
              Obtenu le{" "}
              {new Date(badge.awardedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <LinkedInBadgeShareButton
            badgeName={badge.name}
            level={badge.level}
            shareUrl={badge.shareUrl}
            variant="completion"
          />
        </li>
      ))}
    </ul>
  );
}
