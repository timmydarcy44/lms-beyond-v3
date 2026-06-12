"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Search, TrendingUp, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { FaqAccordion } from "@/components/edge-site/faq-accordion";
import { SectionLabel } from "@/components/edge-site/section-label";

const EDGE_RED = "#E63329";
const EDGE_BLACK = "#0A0A0A";

type Billing = "monthly" | "annual";
type PlanId = "essentiel" | "performance" | "sur-mesure";

const PLANS: {
  id: PlanId;
  label: string;
  unitMonthly: number | null;
  popular?: boolean;
  features: readonly string[];
  cta: string;
  ctaVariant: "outline" | "solid";
}[] = [
  {
    id: "essentiel",
    label: "ESSENTIEL",
    unitMonthly: 12,
    features: [
      "Onboarding digital des collaborateurs",
      "Diagnostic comportemental DISC",
      "Cartographie des compétences",
      "Dashboard RH temps réel",
      "Plan d'action IA personnalisé",
      "Accès EDGE Online (80+ micro-formations)",
      "3 licences RH offertes",
    ],
    cta: "Demander un accès",
    ctaVariant: "outline",
  },
  {
    id: "performance",
    label: "PERFORMANCE",
    unitMonthly: 18,
    popular: true,
    features: [
      "Tout l'Essentiel",
      "Formations collectives EDGE certifiantes",
      "Certification Open Badge IMS Global",
      "Reporting RH avancé",
      "Accès aux parcours experts EDGE",
      "Support dédié",
    ],
    cta: "Commencer",
    ctaVariant: "solid",
  },
  {
    id: "sur-mesure",
    label: "SUR-MESURE",
    unitMonthly: null,
    features: [
      "Tout Performance",
      "Coaching individuel intégré",
      "Interventions présentielles sur-mesure",
      "Déploiement multi-sites",
      "Account manager dédié",
      "Intégration SIRH",
    ],
    cta: "Parler à un consultant",
    ctaVariant: "outline",
  },
];

const ADDONS = [
  {
    id: "flash",
    name: "Intervention Flash",
    icon: Zap,
    description: "1 journée en présentiel. Diagnostic live + atelier + restitution.",
    price: 1500,
    priceLabel: "+ 1 500€ HT / intervention",
  },
  {
    id: "parcours",
    name: "Parcours Performance",
    icon: TrendingUp,
    description: "3 mois. 4 sessions collectives + suivi individuel + reporting mensuel.",
    price: 4500,
    priceLabel: "+ 4 500€ HT / parcours",
  },
  {
    id: "coaching",
    name: "Coaching Individuel",
    icon: User,
    description: "Sessions de coaching pour vos talents et managers clés.",
    price: 150,
    priceLabel: "+ 150€ HT / session",
  },
  {
    id: "diagnostic",
    name: "Diagnostic Équipe Flash",
    icon: Search,
    description: "Audit express de votre équipe en 48h. Restitution et recommandations.",
    price: 490,
    priceLabel: "+ 490€ HT",
  },
] as const;

const FAQ = [
  {
    q: "Puis-je changer de formule en cours de route ?",
    a: "Oui. Vous pouvez upgrader ou downgrader à tout moment depuis votre dashboard RH.",
  },
  {
    q: "Y a-t-il un engagement minimum ?",
    a: "Non. Nos formules sont sans engagement en mensuel. L'annuel bénéficie de -20%.",
  },
  {
    q: "Comment fonctionne l'onboarding ?",
    a: "Vous intégrez les emails de vos collaborateurs. Ils reçoivent une invitation, passent le diagnostic en 12 minutes. Les résultats arrivent sur votre dashboard RH automatiquement.",
  },
  {
    q: "Les add-ons sont-ils cumulables ?",
    a: "Oui, vous composez votre formule librement.",
  },
  {
    q: "Est-ce éligible aux financements OPCO ?",
    a: "Nos interventions EDGE sont éligibles au financement via votre OPCO. Contactez-nous pour un dossier.",
  },
] as const;

function formatEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(amount));
}

function planLabel(id: PlanId): string {
  return PLANS.find((p) => p.id === id)?.label ?? id;
}

export function TarifsPageContent() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [collaborators, setCollaborators] = useState(10);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("performance");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  const annualDiscount = 0.8;

  const planTotals = useMemo(() => {
    const result: Record<PlanId, { monthly: number; annual: number; unitDisplay: number } | null> = {
      essentiel: null,
      performance: null,
      "sur-mesure": null,
    };

    for (const plan of PLANS) {
      if (plan.unitMonthly == null) continue;
      const monthly = plan.unitMonthly * collaborators;
      const annual = monthly * 12 * annualDiscount;
      result[plan.id] = {
        monthly,
        annual,
        unitDisplay: billing === "annual" ? plan.unitMonthly * annualDiscount : plan.unitMonthly,
      };
    }
    return result;
  }, [billing, collaborators]);

  const selectedTotals = planTotals[selectedPlan];

  const subscriptionTotal =
    selectedTotals == null
      ? null
      : billing === "annual"
        ? selectedTotals.annual / 12
        : selectedTotals.monthly;

  const addonsOneShotTotal = ADDONS.filter((a) => selectedAddons.has(a.id)).reduce((sum, a) => sum + a.price, 0);

  const selectedAddonNames = ADDONS.filter((a) => selectedAddons.has(a.id)).map((a) => a.name);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {/* Hero */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" style={{ backgroundColor: EDGE_BLACK }}>
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <h1 className="max-w-3xl text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.04em] text-white">
              Transparent. Simple. Sur-mesure.
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/60 sm:text-lg">
              Calculez le coût exact pour votre équipe en moins de 30 secondes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Configurator */}
      <section className="bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          {/* Toggle */}
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex rounded-full border border-black/10 p-1">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={cn(
                  "rounded-full px-6 py-2.5 text-sm font-semibold transition-colors",
                  billing === "monthly" ? "text-white" : "text-black/50 hover:text-black",
                )}
                style={billing === "monthly" ? { backgroundColor: EDGE_BLACK } : undefined}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className={cn(
                  "relative rounded-full px-6 py-2.5 text-sm font-semibold transition-colors",
                  billing === "annual" ? "text-white" : "text-black/50 hover:text-black",
                )}
                style={billing === "annual" ? { backgroundColor: EDGE_BLACK } : undefined}
              >
                Annuel
                {billing === "annual" ? (
                  <span
                    className="absolute -right-2 -top-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: EDGE_RED }}
                  >
                    -20%
                  </span>
                ) : null}
              </button>
            </div>
            {billing === "annual" ? (
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: EDGE_RED }}>
                Économisez 20% en facturation annuelle
              </span>
            ) : null}
          </div>

          {/* Slider */}
          <div className="mx-auto mt-14 max-w-xl">
            <div className="flex items-end justify-between gap-4">
              <label htmlFor="collaborators" className="text-sm font-semibold" style={{ color: EDGE_BLACK }}>
                Nombre de collaborateurs
              </label>
              <span className="text-lg font-bold tabular-nums" style={{ color: EDGE_RED }}>
                {collaborators} collaborateur{collaborators > 1 ? "s" : ""}
              </span>
            </div>
            <input
              id="collaborators"
              type="range"
              min={1}
              max={500}
              value={collaborators}
              onChange={(e) => setCollaborators(Number(e.target.value))}
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-black/10 accent-[#E63329]"
            />
            <div className="mt-2 flex justify-between text-xs text-black/35">
              <span>1</span>
              <span>500</span>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-5">
            {PLANS.map((plan) => {
              const totals = planTotals[plan.id];
              const isSelected = selectedPlan === plan.id;
              const isCustom = plan.unitMonthly == null;

              return (
                <article
                  key={plan.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlan(plan.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedPlan(plan.id);
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-2xl border bg-white p-8 transition-shadow",
                    plan.popular || isSelected
                      ? "border-[#E63329] shadow-[0_0_0_1px_#E63329,0_20px_50px_-20px_rgba(230,51,41,0.18)]"
                      : "border-black/10 hover:border-black/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <SectionLabel>{plan.label}</SectionLabel>
                    {plan.popular ? (
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                        style={{ backgroundColor: EDGE_RED }}
                      >
                        Populaire
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 min-h-[5rem]">
                    {isCustom ? (
                      <>
                        <p className="text-3xl font-bold tracking-tight" style={{ color: EDGE_BLACK }}>
                          Contactez-nous
                        </p>
                        <p className="mt-2 text-sm text-black/45">Tarification personnalisée</p>
                      </>
                    ) : totals ? (
                      <>
                        <p className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: EDGE_BLACK }}>
                          {billing === "annual"
                            ? `${formatEur(totals.annual)}€ / an`
                            : `${formatEur(totals.monthly)}€ / mois`}
                        </p>
                        <p className="mt-2 text-sm text-black/45 tabular-nums">
                          soit {formatEur(totals.unitDisplay)}€ par collaborateur / mois
                          {billing === "annual" ? " (facturation annuelle −20%)" : ""}
                        </p>
                      </>
                    ) : null}
                  </div>

                  <ul className="mt-8 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm leading-snug text-black/65">
                        <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: EDGE_RED }} aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/entreprises#contact"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90",
                      plan.ctaVariant === "solid"
                        ? "text-white"
                        : "border border-[#E63329] text-[#E63329] hover:bg-[#E63329]/5",
                    )}
                    style={plan.ctaVariant === "solid" ? { backgroundColor: EDGE_RED } : undefined}
                  >
                    {plan.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="bg-[#F5F5F5] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionLabel>ADD-ONS</SectionLabel>
          <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold tracking-tight" style={{ color: EDGE_BLACK }}>
            Allez plus loin selon vos besoins.
          </h2>
          <p className="mt-3 text-base text-black/45">Activez uniquement ce dont vous avez besoin.</p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {ADDONS.map((addon) => {
              const Icon = addon.icon;
              const active = selectedAddons.has(addon.id);
              return (
                <article
                  key={addon.id}
                  className={cn(
                    "rounded-2xl border bg-white p-7 transition-shadow",
                    active
                      ? "border-[#E63329] shadow-[0_0_0_1px_#E63329]"
                      : "border-black/10 hover:border-black/15",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${EDGE_RED}14` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: EDGE_RED }} aria-hidden />
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAddon(addon.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                        active ? "text-white" : "border border-black/15 text-black hover:border-black/30",
                      )}
                      style={active ? { backgroundColor: EDGE_RED } : undefined}
                    >
                      {active ? "Ajouté ✓" : "Ajouter"}
                    </button>
                  </div>
                  <h3 className="mt-5 text-lg font-bold" style={{ color: EDGE_BLACK }}>
                    {addon.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-black/55">{addon.description}</p>
                  <p className="mt-4 text-sm font-bold tabular-nums" style={{ color: EDGE_BLACK }}>
                    {addon.priceLabel}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-tight" style={{ color: EDGE_BLACK }}>
            Questions fréquentes
          </h2>
          <div className="mt-10">
            <FaqAccordion items={FAQ} icon="chevron" defaultOpen={null} />
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" style={{ backgroundColor: EDGE_RED }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-tight text-white">
            Pas sûr de ce qu&apos;il faut ?
          </h2>
          <p className="mt-4 text-base text-white/90 sm:text-lg">
            On vous aide à construire la formule adaptée à votre contexte en 15 minutes.
          </p>
          <EdgeButton
            href="/entreprises#contact"
            variant="inverted"
            className="mt-8 !text-[#E63329] px-8 py-3.5 text-sm font-semibold"
            ariaLabel="Parler à un consultant"
          >
            Parler à un consultant
          </EdgeButton>
        </div>
      </section>

      {/* Sticky bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 px-4 py-4 sm:px-6"
        style={{ backgroundColor: EDGE_BLACK }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm text-white/80">
            <p className="truncate font-semibold text-white">
              Votre formule : {planLabel(selectedPlan)}
              {selectedAddonNames.length > 0 ? ` + ${selectedAddonNames.join(", ")}` : ""}
            </p>
            <p className="mt-1 tabular-nums">
              {subscriptionTotal != null ? (
                <>
                  Total estimé : {formatEur(subscriptionTotal)}€ HT / mois
                  {addonsOneShotTotal > 0 ? (
                    <span className="text-white/50">
                      {" "}
                      + {formatEur(addonsOneShotTotal)}€ HT (add-ons ponctuels)
                    </span>
                  ) : null}
                </>
              ) : (
                "Total estimé : sur devis"
              )}
            </p>
          </div>
          <EdgeButton
            href="/entreprises#contact"
            className="shrink-0 !border-[#E63329] !bg-[#E63329] px-6 py-3 text-sm font-semibold"
            ariaLabel="Demander un devis personnalisé"
          >
            Demander un devis personnalisé
          </EdgeButton>
        </div>
      </div>

      {/* Spacer for sticky bar */}
      <div className="h-28" aria-hidden />
    </>
  );
}
