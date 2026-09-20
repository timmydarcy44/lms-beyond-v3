"use client";

import Link from "next/link";
import { HeartPulse } from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";

/**
 * Accueil temporaire EDGE Care — shell + switcher prêts,
 * fonctionnalités détaillées à venir.
 */
export default function ApprenantCarePage() {
  return (
    <EdgePageAmbiance ambiance="care">
      <div className={`${APPRENANT_PAGE_SHELL} max-w-3xl pb-16`}>
        <header className="space-y-2">
          <p className={APPRENANT_CARD_KICKER}>EDGE Care</p>
          <h1 className={APPRENANT_PAGE_TITLE}>Votre espace bien-être</h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-white/45">
            Accompagnement, questionnaires et ressources Care — bientôt disponibles dans cet
            environnement EDGE.
          </p>
        </header>

        <div className={`${APPRENANT_CARD_BODY} mt-8`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3D7BFF]/15 text-[#3D7BFF]">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-white">Bientôt disponible</p>
              <p className={APPRENANT_CARD_MUTED}>
                Le module Care est en préparation. Votre navigation reste synchronisée avec le
                switcher d&apos;applications.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard/apprenant/profil-comportemental"
              className="rounded-full border border-white/[0.08] px-4 py-2 text-[13px] font-semibold text-white/70 transition hover:border-[#3D7BFF]/30 hover:text-white"
            >
              Retour à EDGE Profil
            </Link>
          </div>
        </div>
      </div>
    </EdgePageAmbiance>
  );
}
