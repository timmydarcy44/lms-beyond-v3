"use client";

import { Check } from "lucide-react";

const BADGES = [
  "Cabinet à Bretteville-sur-Odon",
  "Enfants • Adolescents • Étudiants",
  "Consultations sur rendez-vous",
] as const;

/** Bandeau de réassurance sous le hero. */
export function JessicaHeroTrustBadges() {
  return (
    <section className="border-b border-[#E6D9C6]/70 bg-[#FFFCF9]" aria-label="Informations pratiques">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-10 sm:gap-y-3 md:px-8 md:py-8">
        {BADGES.map((label) => (
          <p key={label} className="flex items-center gap-2 text-sm text-[#2F2A25] md:text-[0.95rem]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C6A664]/15 text-[#8B6F47]">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span className="font-medium">{label}</span>
          </p>
        ))}
      </div>
    </section>
  );
}
