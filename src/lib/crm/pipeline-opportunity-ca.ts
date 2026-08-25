/**
 * Pilotage CA pipeline B2B — prospect ≠ opportunité financière.
 * CA réalisé = étapes proposition_signee + reussi (validé produit).
 */

export const CRM_WON_REVENUE_STAGE_SLUGS = ["proposition_signee", "reussi"] as const;

export const CRM_LOST_STAGE_SLUG = "echec";

export type PipelineOpportunityType =
  | "formation_edge"
  | "beyond_learning"
  | "edge_recruit"
  | "autre";

export const PIPELINE_OPPORTUNITY_TYPE_OPTIONS: Array<{
  value: PipelineOpportunityType;
  label: string;
}> = [
  { value: "formation_edge", label: "Formation EDGE" },
  { value: "beyond_learning", label: "Beyond / Learning" },
  { value: "edge_recruit", label: "EDGE Recruit" },
  { value: "autre", label: "Autre" },
];

export type PipelineCaPeriod = "month" | "quarter" | "year";

export type PipelineDealAmountLike = {
  stage_slug: string;
  amount_cents: number;
  opportunity_type?: string | null;
  opportunity_title?: string | null;
  opportunity_identified_at?: string | null;
  opportunity_won_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export function isWonRevenueStage(stageSlug: string): boolean {
  return (CRM_WON_REVENUE_STAGE_SLUGS as readonly string[]).includes(stageSlug);
}

export function isLostStage(stageSlug: string): boolean {
  return stageSlug === CRM_LOST_STAGE_SLUG;
}

/** Montant renseigné = opportunité financière identifiée (pas un 0 fictif). */
export function hasIdentifiedOpportunity(deal: PipelineDealAmountLike): boolean {
  return (deal.amount_cents ?? 0) > 0;
}

export function opportunityTypeLabel(type: string | null | undefined): string {
  const found = PIPELINE_OPPORTUNITY_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label ?? "Opportunité";
}

function startOfPeriod(period: PipelineCaPeriod, now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (period === "month") {
    d.setDate(1);
    return d;
  }
  if (period === "quarter") {
    const q = Math.floor(d.getMonth() / 3) * 3;
    d.setMonth(q, 1);
    return d;
  }
  d.setMonth(0, 1);
  return d;
}

function dateInPeriod(iso: string | null | undefined, period: PipelineCaPeriod, now = new Date()): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return t >= startOfPeriod(period, now).getTime();
}

/** CA potentiel : opportunités actives chiffrées (hors perdu / hors gagné). */
export function computeCaPotentielCents(deals: PipelineDealAmountLike[]): {
  cents: number;
  count: number;
} {
  let cents = 0;
  let count = 0;
  for (const d of deals) {
    if (!hasIdentifiedOpportunity(d)) continue;
    if (isLostStage(d.stage_slug) || isWonRevenueStage(d.stage_slug)) continue;
    // legacy gagne / client_actif : hors potentiel (déjà clos ou post-vente)
    if (d.stage_slug === "gagne" || d.stage_slug === "client_actif") continue;
    cents += d.amount_cents;
    count += 1;
  }
  return { cents, count };
}

/** CA réalisé : opportunité gagnée (proposition_signee + reussi) sur la période. */
export function computeCaRealiseCents(
  deals: PipelineDealAmountLike[],
  period: PipelineCaPeriod,
  now = new Date(),
): { cents: number; count: number } {
  let cents = 0;
  let count = 0;
  for (const d of deals) {
    if (!hasIdentifiedOpportunity(d)) continue;
    if (!isWonRevenueStage(d.stage_slug) && d.stage_slug !== "gagne") continue;
    const wonAt = d.opportunity_won_at || d.updated_at || d.created_at;
    if (!dateInPeriod(wonAt, period, now)) continue;
    cents += d.amount_cents;
    count += 1;
  }
  return { cents, count };
}

export function formatColumnPipelineSummary(
  prospectCount: number,
  identifiedCents: number,
): string {
  const n = `${prospectCount} prospect${prospectCount > 1 ? "s" : ""}`;
  if (identifiedCents <= 0) return n;
  const euros = (identifiedCents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  return `${n} · ${euros} identifiés`;
}

export function columnIdentifiedCents(deals: PipelineDealAmountLike[]): number {
  return deals.reduce((sum, d) => sum + (hasIdentifiedOpportunity(d) ? d.amount_cents : 0), 0);
}
