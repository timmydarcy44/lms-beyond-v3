"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import { HubPillCta, HubSurface } from "./hub-ui";

export function ExpertCoachingCard() {
  return (
    <HubSurface tone="violet" className="space-y-6">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/65">
          Accompagnement EDGE
        </p>
        <h2 className="mt-3 text-[1.65rem] font-bold leading-[1.15] tracking-[-0.035em] text-white sm:text-[1.9rem]">
          Construisez votre parcours avec un spécialiste EDGE
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/80">
          Pendant un entretien individuel de 60 minutes, un expert EDGE :
        </p>
        <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-white/85">
          <li className="flex gap-2">
            <span className="text-white/50">•</span>
            <span>analyse votre objectif professionnel</span>
          </li>
          <li className="flex gap-2">
            <span className="text-white/50">•</span>
            <span>relit vos résultats EDGE</span>
          </li>
          <li className="flex gap-2">
            <span className="text-white/50">•</span>
            <span>identifie vos forces et vos écarts</span>
          </li>
          <li className="flex gap-2">
            <span className="text-white/50">•</span>
            <span>construit avec vous un parcours personnalisé de développement des compétences</span>
          </li>
        </ul>
      </div>

      <div className="rounded-2xl bg-black/25 px-4 py-4 backdrop-blur-sm">
        <p className="text-[14px] font-medium text-white/70">À l&apos;issue de l&apos;entretien, vous repartez avec :</p>
        <ul className="mt-3 space-y-2 text-[15px] text-white">
          <li className="flex gap-2">
            <span className="text-emerald-300">✓</span>
            <span>une feuille de route claire</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-300">✓</span>
            <span>vos compétences prioritaires</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-300">✓</span>
            <span>votre plan de progression personnalisé</span>
          </li>
        </ul>
      </div>

      <p className="text-[16px] font-semibold text-white">49 € · 60 min</p>

      <Link href={getCoachingBookingHref("progression")}>
        <HubPillCta>
          Réserver mon entretien stratégique
          <ArrowRight className="h-4 w-4" />
        </HubPillCta>
      </Link>
    </HubSurface>
  );
}
