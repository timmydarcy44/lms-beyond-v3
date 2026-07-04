"use client";

import Link from "next/link";
import { EDGE_PARTICULIER_COACHING } from "@/lib/particulier/coaching-config";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  CONNECT_BTN_PRIMARY,
} from "@/lib/apprenant/connect-nav";

export default function ParticulierAccompagnementPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className={APPRENANT_CARD_KICKER}>Accompagnement</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Mon accompagnement</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">
          Un coach EDGE vous aide à interpréter votre Profil, comprendre vos écarts de compétences et construire un plan
          d&apos;action adapté à votre métier cible.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {[EDGE_PARTICULIER_COACHING.restitution, EDGE_PARTICULIER_COACHING.accompagnement].map((offer) => (
          <article key={offer.title} className={APPRENANT_CARD_BODY}>
            <h2 className="text-lg font-semibold text-white">{offer.title}</h2>
            <p className="mt-1 text-xs text-white/45">{offer.duration}</p>
            <ul className="mt-4 space-y-2">
              {offer.features.map((f) => (
                <li key={f} className="text-sm text-white/70">
                  · {f}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-base font-semibold text-white">{offer.priceLabel}</p>
            <Link href={offer.href} className={`${CONNECT_BTN_PRIMARY} mt-4 inline-flex`}>
              {offer.ctaLabel}
            </Link>
          </article>
        ))}
      </div>

      <p className="text-sm text-white/45">
        <Link
          href="/dashboard/apprenant/profil-comportemental"
          className="underline underline-offset-2 hover:text-white/70"
        >
          Sélectionnez d&apos;abord votre métier cible dans Mon Profil EDGE
        </Link>
      </p>
    </div>
  );
}
