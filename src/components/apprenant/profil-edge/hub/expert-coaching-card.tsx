"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import { HubPillCta, HubSurface } from "./hub-ui";

export function ExpertCoachingCard() {
  return (
    <HubSurface tone="rose" className="min-h-[280px] flex flex-col justify-between gap-6 text-center">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/70">
          Accompagnement
        </p>
        <h2 className="mx-auto mt-4 max-w-md text-[1.85rem] font-bold leading-[1.15] tracking-[-0.035em] text-white sm:text-[2.1rem]">
          Besoin d&apos;un plan plus précis&nbsp;?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/80">
          Un spécialiste EDGE analyse vos priorités, valide votre diagnostic et construit avec vous une
          feuille de route personnalisée.
        </p>
      </div>

      <div className="space-y-3">
        <Link href={getCoachingBookingHref("progression")}>
          <HubPillCta>
            Réserver ma séance stratégique
            <ArrowRight className="h-4 w-4" />
          </HubPillCta>
        </Link>
        <p className="text-[14px] font-medium text-white/70">60 min · 49 €</p>
      </div>
    </HubSurface>
  );
}
