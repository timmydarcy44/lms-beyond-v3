import Link from "next/link";
import { Award } from "lucide-react";
import type { LearnerVisibleOpenBadge } from "@/lib/openbadges/learner-visible-badges";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_TITLE,
  APPRENANT_PAGE_KICKER,
  CONNECT_BTN_PRIMARY,
  CONNECT_SECTION_SUBTITLE,
} from "@/lib/apprenant/connect-nav";

export function ApprenantAvailableOpenBadges({
  badges,
}: {
  badges: LearnerVisibleOpenBadge[];
}) {
  if (badges.length === 0) return null;

  return (
    <section className={`${APPRENANT_CARD_BODY} mb-6`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-edge-red/25 bg-edge-red/10 text-edge-red">
          <Award className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className={APPRENANT_PAGE_KICKER}>Open Badges</p>
          <h2 className={APPRENANT_CARD_TITLE}>Certifications à passer</h2>
          <p className={`mt-1 ${CONNECT_SECTION_SUBTITLE}`}>
            Badges mis à votre disposition par votre organisation.
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {badge.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={badge.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{badge.name}</p>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    Disponible pour vous
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-white/55">{badge.description}</p>
              </div>
            </div>
            {badge.eligible ? (
              <Link
                href={badge.submitHref}
                className={`${CONNECT_BTN_PRIMARY} shrink-0 text-xs uppercase tracking-[0.12em]`}
              >
                Commencer
              </Link>
            ) : (
              <span className="text-xs font-medium text-amber-300/90">
                Formation requise avant de postuler
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
