"use client";

import { Check, ChevronDown, Minus, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import {
  EDGE_ANNUAL_DISCOUNT,
  EDGE_FORMATIONATION_DAY_PRICE_HT,
  EDGE_PLANS,
  EDGE_SEATS_DEFAULT,
  EDGE_SEATS_MAX,
  EDGE_SEATS_MIN,
  edgeAnnualTotal,
  edgeFormationDays,
  edgeFormationPriceHt,
  edgeFormationsTotalHt,
  edgeMonthlyTotal,
  edgeUnitPrice,
  formatEdgeDays,
  formatEdgeEur,
  type EdgeBilling,
  type EdgePlanId,
} from "@/lib/edge-site/beyond-pricing";
import {
  EDGE_TRAINING_DOMAINS,
  EDGE_TRAINING_MODULES,
} from "@/lib/edge-site/training-catalog";

type Props = {
  demoHref: string;
  contactHref: string;
};

function clampSeats(n: number) {
  if (!Number.isFinite(n)) return EDGE_SEATS_DEFAULT;
  return Math.min(EDGE_SEATS_MAX, Math.max(EDGE_SEATS_MIN, Math.round(n)));
}

function FormationsPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const domainTitle = useMemo(() => {
    const map = new Map(EDGE_TRAINING_DOMAINS.map((d) => [d.id, d.title]));
    return (id: string) => map.get(id) ?? id;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EDGE_TRAINING_MODULES;
    return EDGE_TRAINING_MODULES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        domainTitle(m.domainId).toLowerCase().includes(q),
    );
  }, [query, domainTitle]);

  const selectedModules = EDGE_TRAINING_MODULES.filter((m) => selected.includes(m.id));
  const formationsHt = edgeFormationsTotalHt(selectedModules);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <div ref={rootRef} className="relative mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Formations d’intérêt
        </p>
        <p className="text-[11px] text-neutral-400">
          {formatEdgeEur(EDGE_FORMATIONATION_DAY_PRICE_HT)} € HT / jour
        </p>
      </div>
      <button
        type="button"
        className="mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-3.5 py-3 text-left text-sm text-neutral-800 transition hover:border-neutral-300"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={cn(selected.length === 0 && "text-neutral-400")}>
          {selected.length === 0
            ? "Choisir une ou plusieurs formations"
            : `${selected.length} formation${selected.length > 1 ? "s" : ""} · ${formatEdgeEur(formationsHt)} € HT`}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-neutral-400 transition", open && "rotate-180")} />
      </button>

      {selectedModules.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedModules.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-700 transition hover:border-neutral-300"
            >
              <span className="truncate">{m.title}</span>
              <span className="shrink-0 text-neutral-400">
                {formatEdgeDays(edgeFormationDays(m.level))} ·{" "}
                {formatEdgeEur(edgeFormationPriceHt(m.level))} €
              </span>
              <X className="h-3 w-3 shrink-0 opacity-50" />
            </button>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2.5">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une formation…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
              autoFocus
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-neutral-400">Aucun résultat</li>
            ) : (
              filtered.map((m) => {
                const active = selected.includes(m.id);
                const days = edgeFormationDays(m.level);
                const price = edgeFormationPriceHt(m.level);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggle(m.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-2.5 text-left transition",
                        active ? "bg-neutral-950 text-white" : "hover:bg-neutral-50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          active
                            ? "border-white bg-white text-neutral-950"
                            : "border-neutral-300",
                        )}
                      >
                        {active ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{m.title}</span>
                        <span
                          className={cn(
                            "mt-0.5 block truncate text-[11px]",
                            active ? "text-white/55" : "text-neutral-400",
                          )}
                        >
                          {domainTitle(m.domainId)} · {formatEdgeDays(days)}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-[11px] font-medium tabular-nums",
                          active ? "text-white/80" : "text-neutral-600",
                        )}
                      >
                        {formatEdgeEur(price)} €
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="border-t border-neutral-100 px-3 py-2">
            <button
              type="button"
              className="w-full rounded-xl py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function EdgePremiumTarifs({ demoHref, contactHref }: Props) {
  const [billing, setBilling] = useState<EdgeBilling>("monthly");
  const [seats, setSeats] = useState(EDGE_SEATS_DEFAULT);
  const [selected, setSelected] = useState<EdgePlanId>("learning");
  const [formations, setFormations] = useState<string[]>([]);

  const annual = billing === "annual";
  const selectedModules = useMemo(
    () => EDGE_TRAINING_MODULES.filter((m) => formations.includes(m.id)),
    [formations],
  );
  const formationsHt = edgeFormationsTotalHt(selectedModules);
  const formationsDays = selectedModules.reduce((sum, m) => sum + edgeFormationDays(m.level), 0);

  const selectedPlan = EDGE_PLANS.find((p) => p.id === selected) ?? EDGE_PLANS[1];
  const selectedMonthly = edgeMonthlyTotal(selectedPlan.unitMonthly, seats, billing);
  const selectedYearly = edgeAnnualTotal(selectedPlan.unitMonthly, seats);
  const selectedFormations =
    selectedPlan.formationsPicker && selectedModules.length > 0 ? formationsHt : 0;
  const grandTotalYearOne =
    (annual ? selectedYearly : selectedMonthly * 12) + selectedFormations;

  return (
    <div className="bg-white text-neutral-950">
      <section className="border-b border-neutral-200 px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14 lg:px-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
            Tarifs
          </p>
          <h1 className="font-edge-display mt-4 text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.05] tracking-[-0.03em]">
            Des offres claires, calibrées à votre effectif.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral-500 sm:text-lg">
            Choisissez votre formule, le nombre de collaborateurs et la facturation. Le prix se
            met à jour en direct.
          </p>

          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-6">
            <div
              className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-1"
              role="group"
              aria-label="Facturation"
            >
              {(
                [
                  { id: "monthly" as const, label: "Mensuel" },
                  {
                    id: "annual" as const,
                    label: "Annuel",
                    badge: `−${Math.round(EDGE_ANNUAL_DISCOUNT * 100)} %`,
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBilling(opt.id)}
                  className={cn(
                    "relative rounded-full px-5 py-2.5 text-sm font-medium transition",
                    billing === opt.id
                      ? "bg-neutral-950 text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-950",
                  )}
                >
                  {opt.label}
                  {"badge" in opt && opt.badge ? (
                    <span
                      className={cn(
                        "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        billing === opt.id ? "bg-white/15 text-white" : "bg-neutral-200 text-neutral-700",
                      )}
                    >
                      {opt.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="w-full rounded-[28px] border border-neutral-200 bg-neutral-50/80 px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Collaborateurs
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    De {EDGE_SEATS_MIN} à {EDGE_SEATS_MAX}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Diminuer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 transition hover:border-neutral-300"
                    onClick={() => setSeats((s) => clampSeats(s - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={EDGE_SEATS_MIN}
                    max={EDGE_SEATS_MAX}
                    value={seats}
                    onChange={(e) => setSeats(clampSeats(Number(e.target.value)))}
                    className="h-10 w-20 rounded-2xl border border-neutral-200 bg-white text-center text-lg font-semibold tabular-nums outline-none focus:border-neutral-400"
                  />
                  <button
                    type="button"
                    aria-label="Augmenter"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 transition hover:border-neutral-300"
                    onClick={() => setSeats((s) => clampSeats(s + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={EDGE_SEATS_MIN}
                max={EDGE_SEATS_MAX}
                value={seats}
                onChange={(e) => setSeats(clampSeats(Number(e.target.value)))}
                className="mt-5 w-full accent-neutral-950"
                aria-label="Nombre de collaborateurs"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          {EDGE_PLANS.map((plan) => {
            const active = selected === plan.id;
            const unit = edgeUnitPrice(plan.unitMonthly, billing);
            const monthlyTotal = edgeMonthlyTotal(plan.unitMonthly, seats, billing);
            const yearlyTotal = edgeAnnualTotal(plan.unitMonthly, seats);
            const planFormationsHt =
              plan.formationsPicker && selectedModules.length > 0 ? formationsHt : 0;
            const planYearOne =
              (annual ? yearlyTotal : monthlyTotal * 12) + planFormationsHt;

            return (
              <article
                key={plan.id}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                onClick={() => setSelected(plan.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(plan.id);
                  }
                }}
                className={cn(
                  "relative flex flex-col rounded-[28px] border bg-white p-6 transition duration-300 sm:p-7",
                  active
                    ? "border-neutral-950 shadow-[0_24px_60px_rgba(0,0,0,0.12)] ring-1 ring-neutral-950"
                    : "border-neutral-200 hover:border-neutral-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]",
                )}
              >
                {plan.popular ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-neutral-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                    Populaire
                  </span>
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.02em]">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">{plan.tagline}</p>
                  </div>
                  <span
                    className={cn(
                      "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      active ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300",
                    )}
                    aria-hidden
                  >
                    {active ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                  </span>
                </div>

                <div className="mt-7">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[2.75rem] font-semibold tracking-[-0.04em] tabular-nums leading-none">
                      {formatEdgeEur(unit)}
                    </span>
                    <span className="text-sm text-neutral-500">€</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    / collaborateur / mois
                    {annual ? " · facturé annuellement" : ""}
                  </p>
                  {annual ? (
                    <p className="mt-1 text-xs text-neutral-400 line-through">
                      {formatEdgeEur(plan.unitMonthly)} € mensuel
                    </p>
                  ) : null}

                  <div className="mt-5 space-y-3 rounded-2xl bg-neutral-50 px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Plateforme · {seats} collab.
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums tracking-[-0.02em]">
                        {formatEdgeEur(monthlyTotal)} €{" "}
                        <span className="text-sm font-medium text-neutral-500">/ mois</span>
                      </p>
                      {annual ? (
                        <p className="mt-0.5 text-sm text-neutral-500 tabular-nums">
                          soit {formatEdgeEur(yearlyTotal)} € / an HT
                        </p>
                      ) : (
                        <p className="mt-0.5 text-sm text-neutral-500">HT · sans engagement</p>
                      )}
                    </div>

                    {plan.formationsPicker && selectedModules.length > 0 ? (
                      <div className="border-t border-neutral-200/80 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                          Formations
                        </p>
                        <p className="mt-1 text-base font-semibold tabular-nums">
                          {formatEdgeEur(formationsHt)} € HT
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {selectedModules.length} formation
                          {selectedModules.length > 1 ? "s" : ""} · {formatEdgeDays(formationsDays)}{" "}
                          · {formatEdgeEur(EDGE_FORMATIONATION_DAY_PRICE_HT)} € / jour
                        </p>
                      </div>
                    ) : null}

                    <div className="border-t border-neutral-950/10 pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-950">
                        Total
                      </p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em]">
                        {formatEdgeEur(planYearOne)} €{" "}
                        <span className="text-sm font-medium text-neutral-500">HT</span>
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {annual
                          ? "Abonnement annuel"
                          : "Abonnement × 12 mois"}
                        {planFormationsHt > 0 ? " + formations" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-sm italic leading-relaxed text-neutral-600">
                  « {plan.promise} »
                </p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-snug text-neutral-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-950" strokeWidth={2} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {plan.formationsPicker ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <FormationsPicker selected={formations} onChange={setFormations} />
                  </div>
                ) : null}

                <div className="mt-8" onClick={(e) => e.stopPropagation()}>
                  <EdgePremiumButton
                    href={`${demoHref}?plan=${plan.id}&seats=${seats}&billing=${billing}${
                      formations.length && plan.formationsPicker
                        ? `&formations=${formations.join(",")}`
                        : ""
                    }`}
                    variant={active ? "primary" : "secondary-light"}
                    shape="revolut"
                    className="w-full"
                  >
                    Demander une démo
                  </EdgePremiumButton>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-10 max-w-6xl rounded-[28px] border border-neutral-200 bg-neutral-950 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Récapitulatif · {selectedPlan.name}
              </p>
              <p className="mt-2 text-sm text-white/55">
                {seats} collaborateurs · {annual ? "annuel" : "mensuel"}
                {selectedFormations > 0
                  ? ` · ${selectedModules.length} formation${selectedModules.length > 1 ? "s" : ""}`
                  : ""}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Total
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.03em]">
                {formatEdgeEur(grandTotalYearOne)} €{" "}
                <span className="text-base font-medium text-white/50">HT</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0a1628 0%, #123a6b 42%, #1e6bb8 72%, #7ec8f5 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 20% 20%, rgba(126, 200, 245, 0.45), transparent 55%), radial-gradient(ellipse 70% 60% at 85% 80%, rgba(30, 107, 184, 0.5), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="font-edge-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] tracking-[-0.03em] text-white">
            Envie d&apos;une demande sur mesure&nbsp;?
            <br />
            Contactez l&apos;un de nos conseillers
          </h2>
          <div className="mt-8 flex justify-center">
            <EdgePremiumButton href={contactHref} variant="white" shape="revolut">
              Contacter un conseiller
            </EdgePremiumButton>
          </div>
        </div>
      </section>
    </div>
  );
}
