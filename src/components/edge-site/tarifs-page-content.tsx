"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search, TrendingUp, User, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { EDGE_HREFS } from "@/lib/edge-site/constants";

const RED = "#E63329";
const BLACK = "#0A0A0A";
const GRAY_TEXT = "#666666";
const BORDER = "#E5E5E5";
const CARD_SHADOW = "0 4px 24px rgba(0,0,0,0.08)";
const CARD_SHADOW_ACTIVE = "0 8px 32px rgba(230,51,41,0.15)";
const ADDON_CARD_SHADOW = "0 2px 12px rgba(0,0,0,0.06)";
const TRANSITION = "transition-all duration-200 ease-out";
const PANEL_TRANSITION = "transition-all duration-300 ease-out";

type Universe = "particuliers" | "entreprises";
type Billing = "monthly" | "annual";
type EntreprisePlanId = "essentiel" | "performance" | "sur-mesure";
type ParticulierPlanId = "online" | "parcours" | "premium";

const ENTREPRISE_PLANS = [
  {
    id: "essentiel" as const,
    label: "ESSENTIEL",
    unit: 12,
    features: [
      "Onboarding digital des collaborateurs",
      "Diagnostic comportemental DISC",
      "Cartographie des compétences",
      "Dashboard RH temps réel",
      "Plan d'action IA personnalisé",
      "Création de formations internes",
      "3 licences RH offertes",
    ],
    cta: "Demander un accès",
    ctaStyle: "outline-red" as const,
  },
  {
    id: "performance" as const,
    label: "PERFORMANCE",
    unit: 18,
    popular: true,
    features: [
      "Tout l'Essentiel",
      "Accès EDGE Online (80+ micro-formations)",
      "Formations collectives EDGE certifiantes",
      "Certification Open Badge IMS Global",
      "Reporting RH avancé",
      "Accès parcours experts EDGE",
      "Support dédié",
    ],
    cta: "Commencer",
    ctaStyle: "solid-red" as const,
  },
  {
    id: "sur-mesure" as const,
    label: "SUR-MESURE",
    unit: null,
    features: [
      "Tout Performance",
      "Coaching individuel intégré",
      "Interventions présentielles sur-mesure",
      "Déploiement multi-sites",
      "Account manager dédié",
    ],
    cta: "Parler à un consultant",
    ctaStyle: "outline-black" as const,
  },
];

const PARTICULIER_PLANS = [
  {
    id: "online" as const,
    label: "EDGE ONLINE",
    monthly: 19,
    annual: 149,
    sub: "Accès illimité au catalogue",
    features: [
      "80+ micro-formations",
      "12 thématiques métier",
      "Test d'orientation inclus",
      "Accès mobile et desktop",
      "Mises à jour continues",
    ],
    cta: "Essayer 7 jours gratuit",
    href: EDGE_HREFS.edgeOnline,
  },
  {
    id: "parcours" as const,
    label: "PARCOURS CERTIFIANT",
    monthly: 49,
    annual: 390,
    popular: true,
    features: [
      "Tout EDGE Online",
      "1 parcours certifiant au choix",
      "Accompagnement formateur",
      "Certification Open Badge IMS Global",
      "Accès communauté EDGE",
    ],
    cta: "Rejoindre la cohorte",
    href: EDGE_HREFS.candidater,
  },
  {
    id: "premium" as const,
    label: "PREMIUM",
    monthly: null,
    annual: null,
    sub: "Accompagnement personnalisé",
    features: [
      "Tout Parcours Certifiant",
      "Sessions coaching individuel",
      "Plan de développement sur-mesure",
      "Suivi Beyond personnalisé",
    ],
    cta: "Nous contacter",
    href: "/entreprises#contact",
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

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: RED }}>
      {children}
    </p>
  );
}

function PillToggle<T extends string>({
  options,
  value,
  onChange,
  size = "lg",
}: {
  options: { id: T; label: string; badge?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "lg" | "sm";
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full p-1",
        size === "lg" ? "bg-[#F2F2F2]" : "bg-[#F2F2F2]",
      )}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative rounded-full font-semibold",
              TRANSITION,
              size === "lg" ? "px-6 py-3.5 text-sm sm:px-8 sm:text-base" : "px-5 py-2 text-sm",
              active ? "text-white" : "text-black/45 hover:text-black/70",
            )}
            style={active ? { backgroundColor: BLACK } : undefined}
          >
            {opt.label}
            {opt.badge && active ? (
              <span className="ml-1.5 text-xs font-bold" style={{ color: RED }}>
                • {opt.badge}
              </span>
            ) : null}
            {opt.badge && !active ? (
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: RED }}
              >
                {opt.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function FeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3.5">
      {items.map((f) => (
        <li key={f} className="flex gap-3 text-base leading-[1.7]" style={{ color: GRAY_TEXT }}>
          <Check className="mt-1 h-4 w-4 shrink-0" style={{ color: RED }} strokeWidth={2.5} aria-hidden />
          {f}
        </li>
      ))}
    </ul>
  );
}

function PricingCard({
  children,
  featured,
  selected,
  onSelect,
}: {
  children: React.ReactNode;
  featured?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <article
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-10",
        TRANSITION,
        onSelect && "cursor-pointer",
        featured || selected ? "border-2" : "border",
      )}
      style={{
        borderColor: featured || selected ? RED : BORDER,
        boxShadow: featured || selected ? CARD_SHADOW_ACTIVE : CARD_SHADOW,
      }}
    >
      {children}
    </article>
  );
}

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <dl>
      {FAQ.map((item, i) => {
        const expanded = open === i;
        return (
          <div key={item.q} className="border-b" style={{ borderColor: BORDER }}>
            <dt>
              <button
                type="button"
                className={cn("flex w-full items-center justify-between gap-4 py-6 text-left font-bold", TRANSITION)}
                style={{ color: BLACK, fontSize: "16px" }}
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : i)}
              >
                {item.q}
                <ChevronDown
                  className={cn("h-5 w-5 shrink-0", TRANSITION, expanded && "rotate-180")}
                  style={{ color: RED }}
                />
              </button>
            </dt>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.dd
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 text-base leading-[1.7]" style={{ color: GRAY_TEXT }}>
                    {item.a}
                  </p>
                </motion.dd>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </dl>
  );
}

function SidePanel({
  open,
  onClose,
  planLabel,
  planMonthly,
  addons,
  onRemoveAddon,
  totalMonthly,
  totalAddons,
}: {
  open: boolean;
  onClose: () => void;
  planLabel: string;
  planMonthly: number | null;
  addons: (typeof ADDONS)[number][];
  onRemoveAddon: (id: string) => void;
  totalMonthly: number | null;
  totalAddons: number;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  const slideFrom = isMobile ? { y: "100%" } : { x: "100%" };
  const slideTo = isMobile ? { y: 0 } : { x: 0 };

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={slideFrom}
          animate={slideTo}
          exit={slideFrom}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "fixed z-50 flex flex-col bg-white",
            "inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl",
            "md:inset-y-0 md:left-auto md:right-0 md:top-12 md:h-[calc(100vh-3rem)] md:max-h-none md:w-[380px] md:rounded-none",
          )}
          style={{
            boxShadow: isMobile ? "0 -8px 32px rgba(0,0,0,0.12)" : "-8px 0 32px rgba(0,0,0,0.12)",
          }}
        >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: BORDER }}>
              <h3 className="text-lg font-bold" style={{ color: BLACK }}>
                Votre formule
              </h3>
              <button
                type="button"
                onClick={onClose}
                className={cn("rounded-full p-2 hover:bg-black/5", TRANSITION)}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" style={{ color: BLACK }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-black/35">Base</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <p className="font-bold" style={{ color: BLACK }}>
                  {planLabel}
                </p>
                <p className="shrink-0 font-bold tabular-nums" style={{ color: BLACK }}>
                  {planMonthly != null ? `${formatEur(planMonthly)}€ / mois` : "Sur devis"}
                </p>
              </div>

              {addons.length > 0 ? (
                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-black/35">Add-ons</p>
                  <ul className="mt-3 space-y-3">
                    {addons.map((a) => (
                      <li key={a.id} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: BLACK }}>
                            {a.name}
                          </p>
                          <p className="text-xs tabular-nums text-black/45">{a.priceLabel}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveAddon(a.id)}
                          className={cn("rounded-full p-1 hover:bg-black/5", TRANSITION)}
                          aria-label={`Retirer ${a.name}`}
                        >
                          <X className="h-4 w-4" style={{ color: GRAY_TEXT }} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="border-t px-6 py-6" style={{ borderColor: BORDER }}>
              <div className="flex items-end justify-between gap-4">
                <span className="text-sm font-semibold" style={{ color: BLACK }}>
                  Total HT
                </span>
                <span className="text-2xl font-bold tabular-nums" style={{ color: RED }}>
                  {totalMonthly != null ? (
                    <>
                      {formatEur(totalMonthly)}€
                      <span className="text-sm font-semibold text-black/45"> / mois</span>
                      {totalAddons > 0 ? (
                        <span className="mt-1 block text-sm font-semibold text-black/45">
                          + {formatEur(totalAddons)}€ add-ons
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "Sur devis"
                  )}
                </span>
              </div>
              <Link
                href="/entreprises#contact"
                className={cn(
                  "mt-5 flex w-full items-center justify-center rounded-full py-4 text-sm font-semibold text-white",
                  TRANSITION,
                  "hover:opacity-90",
                )}
                style={{ backgroundColor: RED }}
              >
                Demander un devis
              </Link>
            </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

export function TarifsPageContent() {
  const [universe, setUniverse] = useState<Universe>("entreprises");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [collaborators, setCollaborators] = useState(10);
  const [selectedPlan, setSelectedPlan] = useState<EntreprisePlanId>("performance");
  const [selectedParticulier, setSelectedParticulier] = useState<ParticulierPlanId>("parcours");
  const [addonIds, setAddonIds] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);

  const discount = 0.8;

  const entreprisePrices = useMemo(() => {
    const out: Record<string, { monthly: number; discounted: number; unit: number; unitDisc: number } | null> = {};
    for (const p of ENTREPRISE_PLANS) {
      if (p.unit == null) {
        out[p.id] = null;
        continue;
      }
      const monthly = p.unit * collaborators;
      out[p.id] = {
        monthly,
        discounted: monthly * discount,
        unit: p.unit,
        unitDisc: p.unit * discount,
      };
    }
    return out;
  }, [collaborators]);

  const selectedPlanData = ENTREPRISE_PLANS.find((p) => p.id === selectedPlan)!;
  const selectedPrices = entreprisePrices[selectedPlan];
  const planMonthlyTotal =
    selectedPrices == null
      ? null
      : billing === "annual"
        ? selectedPrices.discounted
        : selectedPrices.monthly;

  const activeAddons = ADDONS.filter((a) => addonIds.has(a.id));
  const addonsTotal = activeAddons.reduce((s, a) => s + a.price, 0);

  const toggleAddon = (id: string) => {
    setAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setPanelOpen(true);
  };

  const removeAddon = (id: string) => {
    setAddonIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  useEffect(() => {
    if (universe === "particuliers") setPanelOpen(false);
  }, [universe]);

  const showPanel = panelOpen && universe === "entreprises";

  return (
    <div className={cn("bg-white", PANEL_TRANSITION, showPanel && "md:mr-[380px]")}>
      {/* Hero */}
      <section className="px-5 pt-[160px] pb-[120px] sm:px-8">
        <div className="mx-auto max-w-[1100px]">
          <Label>TARIFS</Label>
          <h1
            className="mt-6 font-bold leading-[1.05] tracking-[-0.04em]"
            style={{ color: BLACK, fontSize: "clamp(2.75rem, 7vw, 4.5rem)" }}
          >
            Transparent.
            <br />
            Simple.
            <br />
            Sur-mesure.
          </h1>
          <p className="mt-8 max-w-[480px] text-lg leading-[1.7]" style={{ color: GRAY_TEXT }}>
            Calculez le coût exact pour votre équipe.
            <br />
            Composez votre formule en 30 secondes.
          </p>
        </div>
      </section>

      {/* Universe toggle */}
      <section className="px-5 pb-[120px] sm:px-8">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-12">
          <PillToggle
            size="lg"
            value={universe}
            onChange={setUniverse}
            options={[
              { id: "particuliers", label: "Particuliers & Apprenants" },
              { id: "entreprises", label: "Entreprises" },
            ]}
          />

          <AnimatePresence mode="wait">
            {universe === "entreprises" ? (
              <motion.div
                key="entreprises"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="flex flex-col items-center gap-10">
                  <PillToggle
                    size="sm"
                    value={billing}
                    onChange={setBilling}
                    options={[
                      { id: "monthly", label: "Mensuel" },
                      { id: "annual", label: "Annuel", badge: "-20%" },
                    ]}
                  />

                  <div className="w-full max-w-xl px-[60px]">
                    <div className="flex items-end justify-between gap-4">
                      <span className="text-base font-semibold" style={{ color: BLACK }}>
                        Nombre de collaborateurs
                      </span>
                      <span className="text-lg font-bold tabular-nums" style={{ color: RED }}>
                        {collaborators} collaborateur{collaborators > 1 ? "s" : ""}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={500}
                      value={collaborators}
                      onChange={(e) => setCollaborators(Number(e.target.value))}
                      className="mt-5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E5E5E5] accent-[#E63329] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E63329]"
                    />
                  </div>
                </div>

                <div className="mx-auto mt-16 grid max-w-[1100px] gap-6 lg:grid-cols-3">
                  {ENTREPRISE_PLANS.map((plan) => {
                    const prices = entreprisePrices[plan.id];
                    const isSelected = selectedPlan === plan.id;
                    const isCustom = plan.unit == null;

                    return (
                      <PricingCard
                        key={plan.id}
                        featured={plan.popular}
                        selected={isSelected && !plan.popular}
                        onSelect={() => setSelectedPlan(plan.id)}
                      >
                        {plan.popular ? (
                          <span
                            className="absolute right-6 top-6 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                            style={{ backgroundColor: RED }}
                          >
                            Populaire
                          </span>
                        ) : null}

                        <Label>{plan.label}</Label>

                        <div className="mt-8 min-h-[88px]">
                          {isCustom ? (
                            <>
                              <p className="text-[48px] font-bold leading-none tracking-tight" style={{ color: BLACK }}>
                                Sur devis
                              </p>
                              <p className="mt-3 text-base" style={{ color: GRAY_TEXT }}>
                                Tarification personnalisée
                              </p>
                            </>
                          ) : prices ? (
                            <>
                              {billing === "annual" ? (
                                <p className="text-base line-through tabular-nums" style={{ color: GRAY_TEXT }}>
                                  {formatEur(prices.monthly)}€ / mois
                                </p>
                              ) : null}
                              <p className="text-[48px] font-bold leading-none tracking-tight tabular-nums" style={{ color: BLACK }}>
                                {formatEur(billing === "annual" ? prices.discounted : prices.monthly)}€
                              </p>
                              <p className="mt-3 text-base" style={{ color: GRAY_TEXT }}>
                                / mois · soit {formatEur(billing === "annual" ? prices.unitDisc : prices.unit)}€ par
                                collaborateur
                              </p>
                            </>
                          ) : null}
                        </div>

                        <hr className="my-8" style={{ borderColor: BORDER }} />
                        <FeatureList items={plan.features} />

                        <Link
                          href="/entreprises#contact"
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "mt-10 flex w-full items-center justify-center rounded-full py-4 text-sm font-semibold",
                            TRANSITION,
                            plan.ctaStyle === "solid-red"
                              ? "text-white hover:opacity-90"
                              : plan.ctaStyle === "outline-black"
                                ? "border-2 text-black hover:bg-black/5"
                                : "border-2 hover:bg-[#E63329]/5",
                          )}
                          style={
                            plan.ctaStyle === "solid-red"
                              ? { backgroundColor: RED }
                              : plan.ctaStyle === "outline-black"
                                ? { borderColor: BLACK }
                                : { borderColor: RED, color: RED }
                          }
                        >
                          {plan.cta}
                        </Link>
                      </PricingCard>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="particuliers"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="mb-12 flex justify-center">
                  <PillToggle
                    size="sm"
                    value={billing}
                    onChange={setBilling}
                    options={[
                      { id: "monthly", label: "Mensuel" },
                      { id: "annual", label: "Annuel", badge: "-20%" },
                    ]}
                  />
                </div>

                <div className="mx-auto grid max-w-[1100px] gap-6 lg:grid-cols-3">
                  {PARTICULIER_PLANS.map((plan) => {
                    const isCustom = plan.monthly == null;
                    const isSelected = selectedParticulier === plan.id;

                    return (
                      <PricingCard
                        key={plan.id}
                        featured={plan.popular}
                        selected={isSelected && !plan.popular}
                        onSelect={() => setSelectedParticulier(plan.id)}
                      >
                        {plan.popular ? (
                          <span
                            className="absolute right-6 top-6 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                            style={{ backgroundColor: RED }}
                          >
                            Populaire
                          </span>
                        ) : null}

                        <Label>{plan.label}</Label>

                        <div className="mt-8 min-h-[88px]">
                          {isCustom ? (
                            <>
                              <p className="text-[48px] font-bold leading-none" style={{ color: BLACK }}>
                                Sur devis
                              </p>
                              {plan.sub ? (
                                <p className="mt-3 text-base" style={{ color: GRAY_TEXT }}>
                                  {plan.sub}
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <p className="text-[48px] font-bold leading-none tabular-nums" style={{ color: BLACK }}>
                                {billing === "annual" && plan.annual != null
                                  ? `${formatEur(plan.annual)}€`
                                  : `${formatEur(plan.monthly!)}€`}
                              </p>
                              <p className="mt-3 text-base" style={{ color: GRAY_TEXT }}>
                                {billing === "annual" && plan.annual != null
                                  ? "/ an"
                                  : "/ mois"}
                                {plan.sub ? ` · ${plan.sub}` : plan.id === "online" && billing === "annual" ? " · 2 mois offerts" : ""}
                              </p>
                            </>
                          )}
                        </div>

                        <hr className="my-8" style={{ borderColor: BORDER }} />
                        <FeatureList items={plan.features} />

                        <Link
                          href={plan.href}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "mt-10 flex w-full items-center justify-center rounded-full py-4 text-sm font-semibold text-white",
                            TRANSITION,
                            "hover:opacity-90",
                          )}
                          style={{ backgroundColor: isCustom ? undefined : RED, ...(isCustom ? { border: `2px solid ${RED}`, color: RED, backgroundColor: "transparent" } : {}) }}
                        >
                          {plan.cta}
                        </Link>
                      </PricingCard>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Add-ons — Entreprises only */}
      <AnimatePresence>
        {universe === "entreprises" ? (
          <motion.section
            key="addons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white px-5 py-[120px] sm:px-8"
          >
            <div className="mx-auto max-w-[1100px]">
              <Label>ADD-ONS</Label>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight" style={{ color: BLACK }}>
                Allez plus loin.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-[1.7]" style={{ color: GRAY_TEXT }}>
                Activez uniquement ce dont vous avez besoin.
              </p>

              <div className="mt-16 grid gap-6 sm:grid-cols-2">
                {ADDONS.map((addon) => {
                  const Icon = addon.icon;
                  const active = addonIds.has(addon.id);
                  return (
                    <article
                      key={addon.id}
                      className="rounded-2xl border bg-white p-8"
                      style={{ border: `1px solid ${BORDER}`, boxShadow: ADDON_CARD_SHADOW }}
                    >
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${RED}12` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: RED }} aria-hidden />
                      </div>
                      <h3 className="mt-6 text-xl font-bold" style={{ color: BLACK }}>
                        {addon.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: GRAY_TEXT }}>
                        {addon.description}
                      </p>
                      <p className="mt-4 text-base font-bold tabular-nums" style={{ color: BLACK }}>
                        {addon.priceLabel}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleAddon(addon.id)}
                        className={cn(
                          "mt-6 w-full rounded-full border-2 py-3 text-sm font-semibold",
                          TRANSITION,
                          active ? "border-transparent text-white" : "hover:bg-[#E63329]/5",
                        )}
                        style={
                          active
                            ? { backgroundColor: RED }
                            : { borderColor: RED, color: RED }
                        }
                      >
                        {active ? "Ajouté ✓" : "Ajouter"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {/* FAQ */}
      {universe === "entreprises" ? (
        <section className="px-5 py-[120px] sm:px-8">
          <div className="mx-auto max-w-[720px]">
            <h2 className="mb-12 text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight" style={{ color: BLACK }}>
              Questions fréquentes
            </h2>
            <FaqSection />
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="px-5 py-[120px] sm:px-8" style={{ backgroundColor: BLACK }}>
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-white">
            Pas sûr de ce qu&apos;il vous faut ?
          </h2>
          <p className="mx-auto mt-6 max-w-md text-base leading-[1.7] text-white/55">
            On vous aide à construire la formule adaptée à votre contexte en 15 minutes.
          </p>
          <Link
            href="/entreprises#contact"
            className={cn(
              "mt-10 inline-flex items-center justify-center rounded-full px-10 py-4 text-sm font-semibold text-white",
              TRANSITION,
              "hover:opacity-90",
            )}
            style={{ backgroundColor: RED }}
          >
            Parler à un consultant
          </Link>
        </div>
      </section>

      <SidePanel
        open={showPanel}
        onClose={() => setPanelOpen(false)}
        planLabel={selectedPlanData.label}
        planMonthly={planMonthlyTotal}
        addons={activeAddons}
        onRemoveAddon={removeAddon}
        totalMonthly={planMonthlyTotal}
        totalAddons={addonsTotal}
      />
    </div>
  );
}
