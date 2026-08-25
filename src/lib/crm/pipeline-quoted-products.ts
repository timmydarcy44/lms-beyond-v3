/**
 * Produits commercial pipeline (hors formations catalogue).
 * Prix unitaires HT indicatifs pour chiffrage opportunité.
 */

export type PipelineQuotedProductId =
  | "licence_rh"
  | "licence_lms"
  | "edge_recruit"
  | "nevo";

export type PipelineQuotedProductLine = {
  id: PipelineQuotedProductId;
  qty: number;
  /** Prix unitaire en centimes (Nevo : 990 | 1490 | 1990). */
  unit_cents: number;
};

export const NEVO_PRICE_OPTIONS_CENTS = [990, 1490, 1990] as const;

export const PIPELINE_PRODUCT_CATALOG: Array<{
  id: PipelineQuotedProductId;
  label: string;
  hint: string;
  /** Prix fixe ; null si le prix est choisi (Nevo) ou déjà dans unit_cents défaut. */
  defaultUnitCents: number;
  allowQty: boolean;
  priceOptionsCents?: readonly number[];
}> = [
  {
    id: "licence_rh",
    label: "Licences RH",
    hint: "9 € / collab. / mois (EDGE Skills)",
    defaultUnitCents: 900,
    allowQty: true,
  },
  {
    id: "licence_lms",
    label: "Licences LMS",
    hint: "15 € / collab. / mois",
    defaultUnitCents: 1500,
    allowQty: true,
  },
  {
    id: "edge_recruit",
    label: "Accès recrutement",
    hint: "149 €",
    defaultUnitCents: 14900,
    allowQty: true,
  },
  {
    id: "nevo",
    label: "nevo.",
    hint: "9,90 / 14,90 / 19,90 €",
    defaultUnitCents: 1490,
    allowQty: true,
    priceOptionsCents: NEVO_PRICE_OPTIONS_CENTS,
  },
];

export function formatProductUnitEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function computeQuotedProductsCents(lines: PipelineQuotedProductLine[] | null | undefined): number {
  if (!Array.isArray(lines)) return 0;
  return lines.reduce((sum, line) => {
    const qty = Math.max(0, Math.round(Number(line.qty) || 0));
    const unit = Math.max(0, Math.round(Number(line.unit_cents) || 0));
    return sum + qty * unit;
  }, 0);
}

export function parseQuotedProducts(raw: unknown): PipelineQuotedProductLine[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(PIPELINE_PRODUCT_CATALOG.map((p) => p.id));
  const out: PipelineQuotedProductLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "") as PipelineQuotedProductId;
    if (!allowed.has(id)) continue;
    const catalog = PIPELINE_PRODUCT_CATALOG.find((p) => p.id === id)!;
    let unit = Math.round(Number(row.unit_cents));
    if (!Number.isFinite(unit) || unit <= 0) unit = catalog.defaultUnitCents;
    if (catalog.priceOptionsCents && !catalog.priceOptionsCents.includes(unit as (typeof NEVO_PRICE_OPTIONS_CENTS)[number])) {
      unit = catalog.defaultUnitCents;
    }
    const qty = Math.max(0, Math.round(Number(row.qty) || 0));
    if (qty <= 0) continue;
    out.push({ id, qty, unit_cents: unit });
  }
  return out;
}

export type PipelinePartyKind = "prospect" | "prescripteur";

/** Heuristique locale : SIM traité comme prescripteur en attendant un mapping CRM complet. */
export function inferPartyKindFromCompanyName(companyName: string | null | undefined): PipelinePartyKind | null {
  const n = (companyName ?? "").trim().toLowerCase();
  if (!n) return null;
  if (n === "sim" || n.startsWith("sim ") || n.includes(" sim ") || n.endsWith(" sim")) {
    return "prescripteur";
  }
  return null;
}

export function resolvePartyKind(deal: {
  party_kind?: string | null;
  company_name?: string | null;
}): PipelinePartyKind {
  if (deal.party_kind === "prescripteur" || deal.party_kind === "prospect") {
    return deal.party_kind;
  }
  return inferPartyKindFromCompanyName(deal.company_name) ?? "prospect";
}
