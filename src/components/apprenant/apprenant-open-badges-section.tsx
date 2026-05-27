"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Award, ChevronRight } from "lucide-react";
import type { LearnerVisibleOpenBadge } from "@/lib/openbadges/learner-visible-badges";
import { OpenBadgeCinematicTransition } from "@/components/apprenant/open-badge-cinematic-transition";
import { APPRENANT_CARD_BODY, APPRENANT_CARD_KICKER } from "@/lib/apprenant/connect-nav";

export function ApprenantOpenBadgesSection({ badges }: { badges: LearnerVisibleOpenBadge[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const pendingHrefRef = useRef<string | null>(null);
  const [transition, setTransition] = useState<{
    active: boolean;
    badgeName: string;
    badgeImageUrl: string | null;
  } | null>(null);

  const completeTransition = useCallback(() => {
    const href = pendingHrefRef.current;
    if (!href) return;
    router.push(href);
  }, [router]);

  useEffect(() => {
    if (!transition?.active) return;
    if (pathname?.includes("/open-badges/") && pathname.includes("/epreuve")) {
      setTransition(null);
      pendingHrefRef.current = null;
    }
  }, [pathname, transition?.active]);

  const openBadge = (badge: LearnerVisibleOpenBadge) => {
    if (!badge.eligible) return;
    pendingHrefRef.current = badge.epreuveHref;
    setTransition({
      active: true,
      badgeName: badge.name,
      badgeImageUrl: badge.imageUrl,
    });
  };

  if (badges.length === 0) return null;

  return (
    <>
      <OpenBadgeCinematicTransition
        active={Boolean(transition?.active)}
        badgeName={transition?.badgeName}
        badgeImageUrl={transition?.badgeImageUrl}
        onComplete={completeTransition}
      />

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
          {badges.map((badge) => (
            <li key={badge.id} className="shrink-0">
              <button
                type="button"
                disabled={!badge.eligible}
                onClick={() => openBadge(badge)}
                className={`group flex w-[min(100%,220px)] items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition sm:w-[220px] ${
                  badge.eligible
                    ? "border-white/12 bg-white/[0.04] hover:border-[#FF3B30]/35"
                    : "cursor-not-allowed border-white/6 opacity-55"
                }`}
              >
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
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
