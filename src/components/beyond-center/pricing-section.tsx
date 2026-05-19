"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Phone } from "lucide-react";
import { cn, GlassLight } from "@/components/beyond-center/beyond-center-shared";

type Billing = "monthly" | "yearly";
type PlanKey = "essentiel" | "avance";

const PRICING = {
  monthly: { essentiel: 9, avance: 17 },
  yearly: { essentiel: 7, avance: 13 },
} as const;

const COLLAB_PRESETS = [10, 25, 50, 100] as const;

function formatEuros(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function BeyondCenterPricingSection({
  id = "pricing",
  variant = "light",
}: {
  id?: string;
  variant?: "light" | "dark";
}) {
  const [billing, setBilling] = useState<Billing>("yearly");
  const [collabs, setCollabs] = useState<number>(25);

  const prices = PRICING[billing];

  const total = useMemo(() => {
    const perSeat = {
      essentiel: prices.essentiel,
      avance: prices.avance,
    } satisfies Record<PlanKey, number>;
    const months = billing === "yearly" ? 12 : 1;
    return {
      essentiel: perSeat.essentiel * collabs * months,
      avance: perSeat.avance * collabs * months,
    };
  }, [billing, collabs, prices.avance, prices.essentiel]);

  const shell =
    variant === "dark"
      ? "border-t border-white/[0.06] bg-[#030712] text-white"
      : "border-t border-slate-100 bg-white text-slate-900";

  const subtle =
    variant === "dark" ? "text-slate-400" : "text-slate-600";

  return (
    <section id={id} className={cn("relative scroll-mt-24 py-24 md:py-32", shell)}>
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.28em]", variant === "dark" ? "text-cyan-300/70" : "text-slate-400")}>
              Tarification
            </p>
            <h2 className={cn("mt-4 max-w-2xl text-[clamp(1.85rem,3.2vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.04em]", variant === "dark" ? "text-white" : "text-slate-900")}>
              Une tarification claire, scalable, prête à lancer un pilote.
            </h2>
            <p className={cn("mt-6 max-w-2xl text-[16px] leading-relaxed", subtle)}>
              Choisissez une base simple. Ajustez le nombre de collaborateurs. Lancez l’activation immédiatement.
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 md:w-auto md:items-end">
            <div className={cn("inline-flex rounded-full p-1", variant === "dark" ? "bg-white/10" : "bg-slate-100")}>
              <button
                type="button"
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
                  billing === "monthly"
                    ? variant === "dark"
                      ? "bg-white text-slate-950"
                      : "bg-white text-slate-900"
                    : variant === "dark"
                      ? "text-slate-300 hover:text-white"
                      : "text-slate-500 hover:text-slate-900",
                )}
                onClick={() => setBilling("monthly")}
              >
                Mensuel
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
                  billing === "yearly"
                    ? variant === "dark"
                      ? "bg-white text-slate-950"
                      : "bg-white text-slate-900"
                    : variant === "dark"
                      ? "text-slate-300 hover:text-white"
                      : "text-slate-500 hover:text-slate-900",
                )}
                onClick={() => setBilling("yearly")}
              >
                Annuel <span className={cn("ml-1 text-[11px]", variant === "dark" ? "text-emerald-300/80" : "text-emerald-700/80")}>(-20%)</span>
              </button>
            </div>

            <div className={cn("flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 md:w-[360px]", variant === "dark" ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white")}>
              <div>
                <p className={cn("text-[12px] font-semibold", variant === "dark" ? "text-slate-200" : "text-slate-800")}>Collaborateurs</p>
                <p className={cn("text-[12px]", subtle)}>Dimensionnez votre pilote</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={cn("h-9 w-9 rounded-xl border text-[16px] font-semibold transition-colors", variant === "dark" ? "border-white/10 text-white hover:bg-white/10" : "border-slate-200 text-slate-900 hover:bg-slate-50")}
                  onClick={() => setCollabs((v) => Math.max(1, v - 1))}
                  aria-label="Diminuer"
                >
                  −
                </button>
                <input
                  type="number"
                  value={collabs}
                  min={1}
                  onChange={(e) => setCollabs(Math.max(1, Number(e.target.value || 1)))}
                  className={cn("w-24 rounded-xl border px-3 py-2 text-right text-[14px] font-semibold outline-none", variant === "dark" ? "border-white/10 bg-white/5 text-white" : "border-slate-200 bg-white text-slate-900")}
                />
                <button
                  type="button"
                  className={cn("h-9 w-9 rounded-xl border text-[16px] font-semibold transition-colors", variant === "dark" ? "border-white/10 text-white hover:bg-white/10" : "border-slate-200 text-slate-900 hover:bg-slate-50")}
                  onClick={() => setCollabs((v) => v + 1)}
                  aria-label="Augmenter"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {COLLAB_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCollabs(p)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    collabs === p
                      ? variant === "dark"
                        ? "border-cyan-300/40 bg-cyan-300/10 text-white"
                        : "border-violet-300/60 bg-violet-50 text-slate-900"
                      : variant === "dark"
                        ? "border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {p === 100 ? "100+" : p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          <GlassLight className="p-8" hoverLift={false}>
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Essentiel</p>
                <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Piloter</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600">Piloter vos KPIs RH en toute autonomie.</p>
              </div>
              <div className="text-right">
                <p className="text-[26px] font-semibold tracking-[-0.03em] text-slate-900">{formatEuros(prices.essentiel)}</p>
                <p className="text-[12px] font-medium text-slate-500">/collab/mois</p>
              </div>
            </div>
            <ul className="mt-8 space-y-3 text-[14px] text-slate-700">
              {[
                "Dashboard Manager",
                "Questionnaires hebdo (signaux faibles)",
                "Questionnaires mensuels (thématiques)",
                "Micro-learnings illimités",
              ].map((f) => (
                <li key={f} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
              <span className="text-[12px] font-medium text-slate-600">Estimation {billing === "yearly" ? "annuelle" : "mensuelle"}</span>
              <span className="text-[13px] font-semibold text-slate-900">{formatEuros(total.essentiel)}</span>
            </div>
            <Link
              href="/beyond-center/onboarding/create-workspace?plan=essentiel"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-[14px] font-semibold text-white transition-shadow hover:shadow-lg"
            >
              Lancer un pilote
            </Link>
          </GlassLight>

          <GlassLight className="relative overflow-hidden p-8" hoverLift={false}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_0%_0%,rgba(29,78,216,0.12),transparent)]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Avancé</p>
                  <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Transformer</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-slate-600">Transformer vos équipes avec l’IA et nos experts.</p>
                </div>
                <div className="text-right">
                  <p className="text-[26px] font-semibold tracking-[-0.03em] text-slate-900">{formatEuros(prices.avance)}</p>
                  <p className="text-[12px] font-medium text-slate-500">/collab/mois</p>
                </div>
              </div>
              <ul className="mt-8 space-y-3 text-[14px] text-slate-700">
                {[
                  "Tout Essentiel",
                  "Analyses par IA",
                  "Restitutions trimestrielles avec un expert",
                  "Ateliers stratégiques (coaching / analyse)",
                ].map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
                <span className="text-[12px] font-medium text-slate-600">Estimation {billing === "yearly" ? "annuelle" : "mensuelle"}</span>
                <span className="text-[13px] font-semibold text-slate-900">{formatEuros(total.avance)}</span>
              </div>
              <Link
                href="/beyond-center/onboarding/create-workspace?plan=avance"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#1D4ED8] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_16px_40px_-24px_rgba(29,78,216,0.6)] transition-shadow hover:shadow-[0_20px_48px_-24px_rgba(29,78,216,0.7)]"
              >
                Lancer un pilote
              </Link>
            </div>
          </GlassLight>

          <GlassLight className="p-8" hoverLift={false}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Sur mesure</p>
            <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Partenariat</h3>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-600">
              Pour les besoins spécifiques des grandes organisations.
            </p>
            <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
              <p className="text-[13px] font-medium text-slate-700">Déploiement, gouvernance, périmètres multiples.</p>
              <p className="mt-2 text-[12px] text-slate-500">On construit un pilote cadré, puis un plan de généralisation.</p>
            </div>
            <motion.a
              href="mailto:contact@beyondcenter.fr?subject=Beyond%20Center%20%E2%80%93%20Offre%20sur%20mesure"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              <Phone className="h-4 w-4" aria-hidden />
              Contacter
            </motion.a>
          </GlassLight>
        </div>
      </div>
    </section>
  );
}

