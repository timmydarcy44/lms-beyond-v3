import Link from "next/link";
import { Award } from "lucide-react";
import type { LearnerEarnedOpenBadge } from "@/lib/openbadges/learner-visible-badges";
import { LinkedInBadgeShareButton } from "@/components/apprenant/linkedin-badge-share-button";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_CARD_TITLE,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";

export function ApprenantWalletBadgesGrid({
  badges,
  emptyHintHref,
}: {
  badges: LearnerEarnedOpenBadge[];
  emptyHintHref?: string;
}) {
  if (badges.length === 0) {
    return (
      <div className={`${APPRENANT_CARD_BODY} text-center`}>
        <p className="text-sm text-white/60">
          Aucun badge obtenu pour le moment. Passez une épreuve Open Badge depuis votre dashboard
          pour la voir apparaître ici.
        </p>
        {emptyHintHref ? (
          <Link href={emptyHintHref} className={`${CONNECT_BTN_SECONDARY} mt-4 inline-flex`}>
            Voir les badges disponibles
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {badges.map((badge) => (
        <article key={badge.id} className={`${APPRENANT_CARD_BODY} gap-4`}>
          <div className="flex items-start gap-4">
            {badge.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={badge.imageUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-black/10"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[rgba(255,59,48,0.08)]">
                <Award className="h-7 w-7 text-[#FF3B30]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className={APPRENANT_CARD_TITLE}>{badge.name}</p>
              {badge.level != null ? (
                <p className="mt-0.5 text-xs text-edge-red/90">Niveau {badge.level}</p>
              ) : null}
              <p className={`mt-1 ${APPRENANT_CARD_MUTED}`}>
                Obtenu le{" "}
                {new Date(badge.awardedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <LinkedInBadgeShareButton
            badgeName={badge.name}
            level={badge.level}
            shareUrl={badge.shareUrl}
            variant="wallet-light"
          />
        </article>
      ))}
    </div>
  );
}
