"use client";

import { useEffect, useState } from "react";
import { Segmented } from "@/components/builder/fiche-builder-chrome";
import {
  BENEFIT_OPTIONS,
  centsToInput,
  eurosToCents,
  formatCents,
  formatOfferPay,
  monthlyCents,
  type SalaryPeriod,
} from "@/lib/entreprise/offer-conditions";
import type { OfferPoste } from "@/lib/entreprise/offer-poste";

const fieldClass =
  "h-14 w-full rounded-2xl border border-[#E3E0D8] bg-white px-4 text-[17px] font-bold text-[#07080B] outline-none focus:border-[#07080B]";

type Grid = { updated_on: string; min_cents: number; period: SalaryPeriod } | null;

export function OfferStepConditions({
  draft,
  onChange,
}: {
  draft: OfferPoste;
  onChange: (patch: Partial<OfferPoste>) => void;
}) {
  const period: SalaryPeriod = draft.salary_period === "year" ? "year" : "month";
  const benefits = Array.isArray(draft.benefits) ? draft.benefits : [];
  const autre = benefits.find((item) => item.code === "autre");
  const [autreOpen, setAutreOpen] = useState(Boolean(autre?.label));
  const [grid, setGrid] = useState<Grid>(null);
  const alternance = draft.contract_type === "Alternance";
  const pay = formatOfferPay(draft.salary_min, draft.salary_max, period);

  useEffect(() => {
    if (!alternance) return;
    let cancelled = false;
    void fetch("/api/dashboard/entreprise/job-offers/alternance-grid", { credentials: "include" })
      .then((res) => res.json())
      .then((json: { grid?: Grid }) => {
        if (!cancelled) setGrid(json.grid ?? null);
      })
      .catch(() => {
        if (!cancelled) setGrid(null);
      });
    return () => {
      cancelled = true;
    };
  }, [alternance]);

  const belowGrid = (() => {
    if (!alternance || !grid || draft.salary_min == null || draft.salary_min <= 0) return false;
    return monthlyCents(draft.salary_min, period) < monthlyCents(grid.min_cents, grid.period);
  })();

  const toggle = (code: string, label: string) => {
    const exists = benefits.some((item) => item.code === code);
    onChange({
      benefits: exists ? benefits.filter((item) => item.code !== code) : [...benefits, { code, label }],
    });
  };

  return (
    <div className="mt-8 space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold">Rémunération <span className="font-medium text-[#6B6F7A]">brut</span></p>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
          <input
            id="offer-salary"
            inputMode="decimal"
            aria-label="Rémunération minimum"
            placeholder="1 000"
            defaultValue={centsToInput(draft.salary_min)}
            onChange={(event) => onChange({ salary_min: eurosToCents(event.target.value) })}
            className={fieldClass}
          />
          <input
            inputMode="decimal"
            aria-label="Rémunération maximum, facultatif"
            placeholder="Maximum (facultatif)"
            defaultValue={centsToInput(draft.salary_max)}
            onChange={(event) => onChange({ salary_max: eurosToCents(event.target.value) })}
            className={fieldClass}
          />
          <Segmented
            label="Période de rémunération"
            value={period === "year" ? "Par an" : "Par mois"}
            options={["Par mois", "Par an"]}
            onChange={(value) => onChange({ salary_period: value === "Par an" ? "year" : "month" })}
          />
        </div>
        {pay ? <p className="mt-2 text-sm font-semibold">{pay}</p> : null}
      </div>

      {alternance ? (
        <div className="rounded-[20px] bg-[#FFF1E2] px-4 py-3 text-sm text-[#3A3D45]">
          <p>La rémunération minimale dépend de l'âge de l'alternant et de l'année du contrat.</p>
          {belowGrid && grid ? (
            <p className="mt-2">
              Le montant saisi est sous le minimum le plus bas de la grille ({formatCents(grid.min_cents)} / {grid.period === "year" ? "an" : "mois"}, mise à jour le {new Date(grid.updated_on).toLocaleDateString("fr-FR")}). Ce n'est pas bloquant.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-semibold">
          Temps de travail (h / semaine)
          <input
            inputMode="decimal"
            aria-label="Heures par semaine"
            placeholder="35 h / semaine"
            value={draft.hours_per_week ?? ""}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^\d.,]/g, "").replace(",", ".");
              const amount = Number(raw);
              onChange({ hours_per_week: raw.trim() && Number.isFinite(amount) ? amount : null });
            }}
            className={`${fieldClass} mt-2`}
          />
        </label>
        <label className="block text-sm font-semibold">
          Date de début
          <input
            aria-label="Date de début"
            placeholder="Septembre 2027"
            value={String(draft.start_label ?? "")}
            onChange={(event) => onChange({ start_label: event.target.value })}
            className={`${fieldClass} mt-2`}
          />
        </label>
        <label className="block text-sm font-semibold">
          Nombre de postes
          <input
            inputMode="numeric"
            aria-label="Nombre de postes"
            placeholder="1"
            value={draft.headcount ?? ""}
            onChange={(event) => {
              const raw = event.target.value.trim();
              onChange({ headcount: raw ? Math.max(1, Number(raw) || 1) : null });
            }}
            className={`${fieldClass} mt-2`}
          />
        </label>
      </div>

      <div id="offer-benefits" tabIndex={-1}>
        <p className="mb-2 text-sm font-semibold">Avantages</p>
        <div className="flex flex-wrap gap-2">
          {BENEFIT_OPTIONS.map((option) => {
            const active = benefits.some((item) => item.code === option.code);
            return (
              <button
                key={option.code}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(option.code, option.label)}
                className={
                  active
                    ? "h-[42px] rounded-full border border-[#6E5BFF] bg-[#EEEBFF] px-4 text-sm font-semibold text-[#4B3BD1]"
                    : "h-[42px] rounded-full border border-[#E3E0D8] bg-white px-4 text-sm font-semibold text-[#07080B]"
                }
              >
                {option.label}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={autreOpen || Boolean(autre)}
            onClick={() => setAutreOpen(true)}
            className={
              autre
                ? "h-[42px] rounded-full border border-[#6E5BFF] bg-[#EEEBFF] px-4 text-sm font-semibold text-[#4B3BD1]"
                : "h-[42px] rounded-full border border-[#E3E0D8] bg-white px-4 text-sm font-semibold"
            }
          >
            + Autre
          </button>
        </div>
        {autreOpen ? (
          <input
            aria-label="Autre avantage"
            placeholder="Texte court"
            value={autre?.label ?? ""}
            onChange={(event) => {
              const label = event.target.value;
              const rest = benefits.filter((item) => item.code !== "autre");
              onChange({ benefits: label.trim() ? [...rest, { code: "autre", label: label.trim() }] : rest });
            }}
            className={`${fieldClass} mt-3`}
          />
        ) : null}
      </div>
    </div>
  );
}
