"use client";

import { useEffect } from "react";
import { Award, Calendar, ExternalLink, X } from "lucide-react";
import type { PublicProfileEarnedBadge } from "@/lib/openbadges/public-profile-earned-badges";

function formatAwardedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PublicProfileBadgeOverlay({
  badge,
  onClose,
}: {
  badge: PublicProfileEarnedBadge;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-badge-overlay-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/[0.08] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/50 hover:bg-black/[0.04]"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-black/[0.06] p-6 pr-14">
          <div className="flex items-start gap-4">
            {badge.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={badge.imageUrl}
                alt=""
                className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-black/10"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#FF3B30]/10">
                <Award className="h-9 w-9 text-[#FF3B30]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#FF3B30]">
                Open Badge EDGE
                {badge.level != null ? ` · Niveau ${badge.level}` : ""}
              </p>
              <h2 id="public-badge-overlay-title" className="mt-1 text-xl font-semibold text-[#0a0a0a]">
                {badge.name}
              </h2>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-black/50">
                <Calendar className="h-3.5 w-3.5" />
                Obtenu le {formatAwardedDate(badge.awardedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {badge.description ? (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/45">
                Description
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-black/70">{badge.description}</p>
            </div>
          ) : null}

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/45">
              Critères d&apos;obtention
            </h3>
            {badge.criteria.length > 0 ? (
              <ol className="mt-3 space-y-3">
                {badge.criteria.map((criterion, index) => (
                  <li key={`${criterion.label}-${index}`} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF3B30]/10 text-xs font-semibold text-[#FF3B30]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-[#0a0a0a]">{criterion.label}</p>
                      {criterion.description ? (
                        <p className="mt-0.5 text-black/60">{criterion.description}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : badge.criteriaMarkdown ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-black/70">
                {badge.criteriaMarkdown}
              </p>
            ) : (
              <p className="mt-3 text-sm text-black/50">
                Critères détaillés disponibles sur la page publique du badge.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-black/[0.06] pt-4">
            <a
              href={badge.criteriaUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3.5 py-2 text-xs font-medium text-black/70 hover:border-[#FF3B30]/35"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Page critères
            </a>
            <a
              href={badge.openBadgeClassJsonUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3.5 py-2 text-xs font-medium text-black/70 hover:border-[#FF3B30]/35"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              JSON Open Badges (IMS)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
