"use client";

import { useState } from "react";
import { Minus, Plus, Sparkles } from "lucide-react";

const PLATFORM_FIXED = 590;
const PLATFORM_PER_LEARNER = 1;
const SETUP = 3000;
const ANNUAL_CART_DISCOUNT = 0.2;

const CARE_TIERS = {
  essentiel: { label: "Essentiel", flat: 390, per: 4 },
  plus: { label: "Plus", flat: 790, per: 3 },
  premium: { label: "Premium", flat: 1350, per: 2 },
} as const;

type TierKey = keyof typeof CARE_TIERS;

type Props = {
  variant?: "dashboard" | "marketing" | "landing";
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 50_000,
  dark,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  dark?: boolean;
}) {
  const bump = (d: number) => onChange(Math.min(max, Math.max(min, value + d)));
  const btn = dark
    ? "border-white/15 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50";
  const input = dark
    ? "border-white/15 bg-zinc-900 text-center text-sm font-semibold text-white tabular-nums"
    : "border-zinc-200 bg-white text-center text-sm font-semibold text-zinc-900 tabular-nums shadow-inner";
  return (
    <div className="flex flex-col gap-1.5">
      <span className={`text-xs font-medium ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuer"
          onClick={() => bump(-1)}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition ${btn}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Math.round(Number(e.target.value) || 0))))}
          className={`h-10 w-20 rounded-xl border px-0 outline-none ring-offset-0 focus:ring-2 ${input} ${
            dark ? "focus:ring-emerald-500/40" : "focus:ring-cyan-500/25"
          }`}
        />
        <button
          type="button"
          aria-label="Augmenter"
          onClick={() => bump(1)}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition ${btn}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function EcolePricingPanel({ variant = "dashboard" }: Props) {
  const isDark = variant === "marketing" || variant === "landing";
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [nbApprenants, setNbApprenants] = useState(120);
  const [platformOn, setPlatformOn] = useState(true);
  const [careOn, setCareOn] = useState(true);
  const [tier, setTier] = useState<TierKey>("essentiel");
  const [nbProfilsSuivis, setNbProfilsSuivis] = useState(15);

  const platformMensuel = PLATFORM_FIXED + nbApprenants * PLATFORM_PER_LEARNER;
  const platformPartMensuel = platformOn ? platformMensuel : 0;
  const careCfg = CARE_TIERS[tier];
  const careMensuel = careOn ? careCfg.flat + nbProfilsSuivis * careCfg.per : 0;
  const totalMensuel = platformPartMensuel + careMensuel;

  const brutFirstYear = totalMensuel * 12 + SETUP;
  const firstYearAfterDiscount =
    billing === "annual" ? brutFirstYear * (1 - ANNUAL_CART_DISCOUNT) : brutFirstYear;
  const equivMonthlyFirstYear = firstYearAfterDiscount / 12;

  const displayMain = billing === "monthly" ? totalMensuel : equivMonthlyFirstYear;
  const displaySub =
    billing === "monthly"
      ? `Sur 12 mois + setup (plein tarif) : ${fmt(brutFirstYear)} €`
      : `Total 1ʳᵉ année après −20 % (panier + setup) : ${fmt(firstYearAfterDiscount)} € — avant remise : ${fmt(brutFirstYear)} €`;

  const platformLine = !platformOn
    ? "Plateforme non incluse — estimation Care seul possible."
    : billing === "monthly"
      ? `${fmt(nbApprenants)} apprenants → ${fmt(platformMensuel)} €/mois`
      : `Plateforme : ${fmt(platformMensuel)} €/mois × 12 + quote-part setup`;

  const careLine = !careOn
    ? "Beyond Care non activé"
    : billing === "monthly"
      ? `${careCfg.label} · ${fmt(nbProfilsSuivis)} profils suivis → ${fmt(careMensuel)} €/mois`
      : `Care (${careCfg.label}) : ${fmt(careMensuel)} €/mois × 12`;

  const tierKeys: TierKey[] = ["essentiel", "plus", "premium"];

  const shell = isDark
    ? "rounded-[28px] border border-white/10 bg-[#0b0f14] p-6 shadow-[0_40px_100px_-50px_rgba(0,0,0,0.85)] md:p-10"
    : "rounded-[28px] border border-zinc-200/80 bg-white p-6 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.12)] md:p-10";

  const toolbar = isDark
    ? "rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5"
    : "rounded-2xl border border-zinc-100 bg-zinc-50/90 p-4 md:p-5";

  return (
    <div className={shell}>
      <div className="mb-8 text-center md:mb-10">
        <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isDark ? "text-cyan-400/90" : "text-cyan-600"}`}>
          Tarification
        </p>
        <h2
          className={`mt-3 text-3xl font-bold tracking-tight md:text-4xl ${isDark ? "text-white" : "text-zinc-900"}`}
        >
          Beyond for Education
        </h2>
        <p className={`mx-auto mt-3 max-w-2xl text-sm md:text-base ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
          Estimez votre budget : la plateforme et Beyond Care sont indépendants — vous pouvez ne souscrire qu&apos;au
          volet handicap (Care). Paiement annuel : −20 % sur la totalité du panier (abonnements + setup).
        </p>
      </div>

      {/* Barre type Aircall */}
      <div className={`${toolbar} mb-8 flex flex-col flex-wrap gap-4 md:mb-10 md:flex-row md:items-end md:justify-between`}>
        <div className="flex flex-col gap-2">
          <span className={`text-xs font-medium ${isDark ? "text-white/45" : "text-zinc-500"}`}>Facturation</span>
          <div
            className={`inline-flex rounded-full p-1 ${isDark ? "bg-black/40 ring-1 ring-white/10" : "bg-white shadow-inner ring-1 ring-zinc-200/80"}`}
          >
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition md:text-sm ${
                billing === "annual"
                  ? isDark
                    ? "bg-white text-zinc-900 shadow"
                    : "bg-zinc-900 text-white shadow"
                  : isDark
                    ? "text-white/50 hover:text-white/80"
                    : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Annuel
              <span className="ml-1.5 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 md:text-[11px]">
                −20 %
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition md:text-sm ${
                billing === "monthly"
                  ? isDark
                    ? "bg-white text-zinc-900 shadow"
                    : "bg-zinc-900 text-white shadow"
                  : isDark
                    ? "text-white/50 hover:text-white/80"
                    : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Mensuel
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={`text-xs font-medium ${isDark ? "text-white/45" : "text-zinc-500"}`}>Pays</span>
          <select
            className={`h-10 min-w-[160px] rounded-xl border px-3 text-sm font-medium outline-none ring-offset-2 focus:ring-2 ${
              isDark
                ? "border-white/15 bg-black/30 text-white focus:ring-cyan-500/40"
                : "border-zinc-200 bg-white text-zinc-900 focus:ring-cyan-500/30"
            }`}
            defaultValue="FR"
          >
            <option value="FR">France</option>
          </select>
        </div>

        <Stepper dark={isDark} label="Apprenants (total)" value={nbApprenants} onChange={setNbApprenants} max={20_000} />
        <Stepper dark={isDark} label="Profils suivis (Care)" value={nbProfilsSuivis} onChange={setNbProfilsSuivis} max={5_000} />
      </div>

      {/* Cartes 3 colonnes */}
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        {/* Plateforme — vert */}
        <article
          className={
            isDark
              ? "relative flex flex-col overflow-hidden rounded-2xl border border-emerald-500/35 bg-zinc-950 p-6 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15 md:p-8"
              : "relative flex flex-col overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/80 p-6 shadow-lg shadow-emerald-900/5 md:p-8"
          }
        >
          <div
            className={
              isDark
                ? "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/12 to-transparent"
                : ""
            }
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-2">
            <h3 className={`text-lg font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Plateforme Beyond</h3>
            <span
              className={
                isDark
                  ? "shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200"
                  : "shrink-0 rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-200/80"
              }
            >
              Modulable
            </span>
          </div>
          <p className={`relative mt-2 text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
            Base CRM, classes, apprenants, offres et pilotage quotidien — souscription distincte de Beyond Care.
          </p>
          <label
            className={`relative mt-4 flex cursor-pointer items-center gap-2 text-sm ${isDark ? "text-zinc-200" : "text-zinc-600"}`}
          >
            <input
              type="checkbox"
              checked={platformOn}
              onChange={(e) => setPlatformOn(e.target.checked)}
              className={`h-4 w-4 rounded border ${isDark ? "border-emerald-500/40 bg-zinc-900 accent-emerald-500" : "border-emerald-400/50 accent-emerald-600"}`}
            />
            Inclure la plateforme dans l&apos;estimation
          </label>
          <div className="relative mt-4 flex flex-1 flex-col">
            <p className={`text-4xl font-bold tabular-nums md:text-5xl ${isDark ? "text-white" : "text-zinc-900"}`}>
              {platformOn ? (
                <>
                  {fmt(platformMensuel)}
                  <span className={`ml-1 text-xl font-semibold md:text-2xl ${isDark ? "text-emerald-200/80" : "text-zinc-400"}`}>
                    €
                  </span>
                  <span className={`mt-2 block text-sm font-normal ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    / mois
                  </span>
                </>
              ) : (
                <span className={`text-2xl font-semibold ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>—</span>
              )}
            </p>
            <p className={`mt-4 text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              {platformOn
                ? `${PLATFORM_FIXED} € fixe + ${nbApprenants} × ${PLATFORM_PER_LEARNER} €`
                : "Décochez uniquement si vous ne souhaitez que Beyond Care."}
            </p>
            <a
              href="mailto:contact@beyondcenter.fr?subject=Beyond%20Plateforme%20%E2%80%94%20devis"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 shadow-lg transition hover:bg-emerald-400"
            >
              En savoir plus
            </a>
            <p className={`mt-4 flex items-start gap-2 text-xs leading-snug ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              <Sparkles className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
              {platformLine}
            </p>
          </div>
        </article>

        {/* Beyond Care — violet */}
        <article
          className={
            isDark
              ? "relative flex flex-col overflow-hidden rounded-2xl border border-violet-500/35 bg-zinc-950 p-6 shadow-2xl shadow-black/50 ring-1 ring-violet-500/15 md:p-8"
              : "relative flex flex-col overflow-hidden rounded-2xl border border-violet-200/90 bg-gradient-to-b from-white to-violet-50/70 p-6 shadow-lg shadow-violet-900/5 md:p-8"
          }
        >
          <div
            className={
              isDark
                ? "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-violet-500/12 to-transparent"
                : ""
            }
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-2">
            <h3 className={`text-lg font-bold ${isDark ? "text-violet-300" : "text-violet-700"}`}>Beyond Care</h3>
            <span
              className={
                isDark
                  ? "shrink-0 rounded-full border border-amber-400/35 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-100"
                  : "shrink-0 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950"
              }
            >
              Optionnel
            </span>
          </div>
          <p className={`relative mt-2 text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
            Handicap, décrochage, profils à enjeux — forfait + unitaire par profil suivi.
          </p>

          <div className="relative mt-4 flex flex-wrap gap-2">
            {tierKeys.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTier(k)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  tier === k
                    ? isDark
                      ? "bg-violet-500 text-white shadow-md ring-1 ring-violet-400/40"
                      : "bg-violet-600 text-white shadow"
                    : isDark
                      ? "border border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20 hover:bg-zinc-800"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {CARE_TIERS[k].label}
              </button>
            ))}
          </div>

          <label
            className={`relative mt-4 flex cursor-pointer items-center gap-2 text-sm ${isDark ? "text-zinc-200" : "text-zinc-600"}`}
          >
            <input
              type="checkbox"
              checked={careOn}
              onChange={(e) => setCareOn(e.target.checked)}
              className={`h-4 w-4 rounded border ${isDark ? "border-violet-400/40 bg-zinc-900 accent-violet-500" : "border-violet-300 accent-violet-600"}`}
            />
            Inclure Beyond Care dans l&apos;estimation
          </label>

          <div className="relative mt-4 flex flex-1 flex-col">
            <p className={`text-4xl font-bold tabular-nums md:text-5xl ${isDark ? "text-white" : "text-zinc-900"}`}>
              {careOn ? (
                <>
                  {fmt(careMensuel)}
                  <span className={`ml-1 text-xl font-semibold md:text-2xl ${isDark ? "text-violet-200/80" : "text-zinc-400"}`}>
                    €
                  </span>
                  <span className={`mt-2 block text-sm font-normal ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    / mois
                  </span>
                </>
              ) : (
                <span className={`text-2xl font-semibold ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>—</span>
              )}
            </p>
            <p className={`mt-4 text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              {careOn ? `${careCfg.flat} € + ${nbProfilsSuivis} × ${careCfg.per} €` : "Activez Care pour voir le montant."}
            </p>
            <a
              href="mailto:contact@beyondcenter.fr?subject=Beyond%20Care%20%E2%80%94%20devis"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-violet-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-400"
            >
              Parler à un conseiller
            </a>
            <p className={`mt-4 text-xs leading-snug ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{careLine}</p>
          </div>
        </article>

        {/* Total — sombre */}
        <article className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 text-white shadow-2xl md:p-8">
          <h3 className="text-lg font-bold text-white">Votre estimation</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            Setup {fmt(SETUP)} € (one shot) inclus dans le calcul de la première année. Paiement annuel : −20 % sur ce
            total (abonnements + setup).
          </p>
          <div className="mt-6 flex flex-1 flex-col">
            {!platformOn && !careOn ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-100">
                Cochez au moins la plateforme ou Beyond Care pour afficher un montant.
              </p>
            ) : (
              <>
                <p className="text-4xl font-bold tabular-nums text-white md:text-5xl">
                  {fmt(Math.round(displayMain * 100) / 100)}
                  <span className="ml-1 text-xl font-semibold text-cyan-200/90 md:text-2xl">€</span>
                  <span className="mt-2 block text-sm font-normal text-zinc-400">
                    {billing === "monthly" ? "/ mois (hors setup)" : "/ mois équivalent 1ʳᵉ année (après −20 %)"}
                  </span>
                </p>
                <p className="mt-4 text-xs leading-relaxed text-zinc-400">{displaySub}</p>
              </>
            )}
            <div className="mt-6 rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-xs text-zinc-200">
              <p className="font-semibold text-white">Rappel formules</p>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-zinc-300">
                <li>Plateforme (si retenue) = {PLATFORM_FIXED} + (apprenants × {PLATFORM_PER_LEARNER}) € / mois</li>
                <li>Care = forfait + (profils suivis × tarif) € / mois</li>
                <li>1ʳᵉ année = (mensuel cumulé × 12) + {fmt(SETUP)} € ; en paiement annuel : −20 % sur ce montant</li>
              </ul>
            </div>
            <a
              href="mailto:contact@beyondcenter.fr?subject=Devis%20Beyond%20Education"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white py-3 text-sm font-semibold text-zinc-950 shadow transition hover:bg-zinc-100"
            >
              Demander un devis
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
