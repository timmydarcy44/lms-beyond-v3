"use client";

import Link from "next/link";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import {
  EDGE_ANNUAL_DISCOUNT,
  EDGE_PLANS,
  EDGE_SEATS_DEFAULT,
  edgeUnitPrice,
  type EdgeBilling,
} from "@/lib/edge-site/beyond-pricing";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Check } from "lucide-react";

export default function EntrepriseAbonnementPage() {
  const [billing, setBilling] = useState<EdgeBilling>("annual");
  const seats = EDGE_SEATS_DEFAULT;

  return (
    <div className="flex min-h-screen bg-[#f7f5fb] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8 max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            Abonnement
          </p>
          <h1 className={`mt-2 text-left ${ENTREPRISE_H1_CLASS}`}>Tarifs & abonnement</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Offres EDGE pour piloter compétences, diagnostics et formations — facturation par
            collaborateur.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            {(
              [
                { id: "monthly" as const, label: "Mensuel" },
                { id: "annual" as const, label: `Annuel (−${Math.round(EDGE_ANNUAL_DISCOUNT * 100)} %)` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setBilling(opt.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  billing === opt.id
                    ? "bg-violet-600 text-white"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500">Exemple pour {seats} collaborateurs</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {EDGE_PLANS.map((plan) => {
            const unit = edgeUnitPrice(plan.unitMonthly, billing);
            const monthlyTotal = unit * seats;
            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-[28px] border bg-white p-6 shadow-sm",
                  plan.popular ? "border-violet-300 ring-2 ring-violet-200" : "border-gray-100",
                )}
              >
                {plan.popular ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    Populaire
                  </span>
                ) : null}
                <h2 className="text-xl font-bold text-gray-950">{plan.name}</h2>
                <p className="mt-2 text-sm text-gray-500">{plan.tagline}</p>
                <p className="mt-6">
                  <span className="text-4xl font-black tracking-tight text-gray-950">
                    {unit.toFixed(0)} €
                  </span>
                  <span className="text-sm text-gray-400"> HT / collab. / mois</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  ≈ {Math.round(monthlyTotal)} € HT / mois pour {seats} sièges
                  {billing === "annual" ? " (équivalent annuel)" : ""}
                </p>
                <p className="mt-4 text-sm font-medium text-gray-700">{plan.promise}</p>
                <ul className="mt-5 flex-1 space-y-2">
                  {plan.includes.slice(0, 7).map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:contact@edgebs.fr?subject=Abonnement%20EDGE%20Entreprise"
                  className={cn(
                    "mt-6 inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition",
                    plan.popular
                      ? "bg-violet-600 text-white hover:bg-violet-500"
                      : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50",
                  )}
                >
                  Parler à un expert
                </a>
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Besoin d’un devis sur mesure ?{" "}
          <Link href="/dashboard/entreprise/aide" className="font-semibold text-violet-600">
            Consulter l’aide
          </Link>{" "}
          ou écrire à{" "}
          <a href="mailto:contact@edgebs.fr" className="font-semibold text-violet-600">
            contact@edgebs.fr
          </a>
          .
        </p>
      </main>
    </div>
  );
}
