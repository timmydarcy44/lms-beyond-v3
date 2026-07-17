"use client";

import Link from "next/link";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { HubSurface } from "./hub-ui";

export function ExpertCoachingCard() {
  return (
    <HubSurface tone="action" className="space-y-4">
      <p className="text-[12px] font-medium text-white/40">Accompagnement</p>
      <h2 className="text-[1.35rem] font-semibold tracking-[-0.02em] text-white">
        Besoin d&apos;un plan plus précis&nbsp;?
      </h2>
      <p className="max-w-xl text-[14px] leading-relaxed text-white/55">
        Un spécialiste EDGE peut analyser vos priorités, valider votre diagnostic et construire avec vous une
        feuille de route personnalisée.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={getCoachingBookingHref("progression")}
          className={`${CONNECT_BTN_PRIMARY} w-full justify-center sm:w-auto`}
        >
          Réserver ma séance stratégique
        </Link>
        <p className="text-center text-[13px] text-white/40 sm:text-right">60 min · 49 €</p>
      </div>
    </HubSurface>
  );
}
