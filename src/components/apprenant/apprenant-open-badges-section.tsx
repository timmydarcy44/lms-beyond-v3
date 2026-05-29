import Link from "next/link";
import { Award, ChevronRight } from "lucide-react";
import type { LearnerVisibleOpenBadge } from "@/lib/openbadges/learner-visible-badges";
import { APPRENANT_CARD_BODY, APPRENANT_CARD_KICKER } from "@/lib/apprenant/connect-nav";

export function ApprenantOpenBadgesSection({ badges }: { badges: LearnerVisibleOpenBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <section className={APPRENANT_CARD_BODY}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={APPRENANT_CARD_KICKER}>Open Badges EDGE</p>
          <h2 className="text-base font-semibold text-white sm:text-lg">Certifications à obtenir</h2>
        </div>
        <span className="text-[10px] text-white/40">
          {badges.length} badge{badges.length > 1 ? "s" : ""}
        </span>
      </div>

      <ul className="relative mt-3 flex gap-3 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {badges.map((badge) => {
          const cardClass = `group flex w-[min(100%,220px)] items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition sm:w-[220px] ${
            badge.eligible
              ? "border-white/12 bg-white/[0.04] hover:border-[#FF3B30]/35"
              : "cursor-not-allowed border-white/6 opacity-55"
          }`;

          const inner = (
            <>
              {badge.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={badge.imageUrl}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-md object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/5">
                  <Award className="h-5 w-5 text-[#FF3B30]/80" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium !text-white group-hover:!text-[#FF3B30]">
                  {badge.name}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-amber-300/95">
                  {!badge.eligible
                    ? "Formation requise"
                    : badge.attemptsCount > 0
                      ? `${badge.attemptsCount} essai${badge.attemptsCount > 1 ? "s" : ""} effectué${badge.attemptsCount > 1 ? "s" : ""}`
                      : "Disponible"}
                </p>
              </div>
              {badge.eligible ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-white/25 group-hover:text-[#FF3B30]" />
              ) : null}
            </>
          );

          return (
            <li key={badge.id} className="shrink-0">
              {badge.eligible ? (
                <Link href={badge.presentationHref} className={cardClass}>
                  {inner}
                </Link>
              ) : (
                <div className={cardClass} aria-disabled>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
