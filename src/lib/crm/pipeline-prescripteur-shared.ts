import { CRM_REVENUE_STAGE_SLUGS, formatDealAmount } from "@/lib/crm/pipeline-shared";

export type CommissionType = "percent" | "fixed";

export type PipelinePrescripteur = {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  next_action: string;
  notes: string | null;
  contact_owner_email: string | null;
  created_at: string;
  updated_at: string;
};

export type PrescripteurLinkedDeal = {
  id: string;
  prescripteur_id: string;
  deal_id: string;
  commission_type: CommissionType;
  commission_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deal?: {
    id: string;
    company_name: string;
    contact_first_name: string;
    contact_last_name?: string | null;
    email?: string | null;
    stage_slug: string;
    amount_cents: number;
  } | null;
};

export type PrescripteurForm = {
  id?: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  next_action: string;
  notes: string;
  contact_owner_email: string;
};

export const emptyPrescripteurForm = (ownerEmail: string): PrescripteurForm => ({
  first_name: "",
  last_name: "",
  company_name: "",
  email: "",
  phone: "",
  next_action: "",
  notes: "",
  contact_owner_email: ownerEmail,
});

export function dealRevenueCents(amountCents: number, stageSlug: string): number {
  if (!CRM_REVENUE_STAGE_SLUGS.includes(stageSlug as (typeof CRM_REVENUE_STAGE_SLUGS)[number])) {
    return 0;
  }
  return amountCents ?? 0;
}

export function computeClientCommissionCents(
  link: Pick<PrescripteurLinkedDeal, "commission_type" | "commission_value">,
  deal?: PrescripteurLinkedDeal["deal"] | null,
): number {
  const value = Number(link.commission_value) || 0;
  if (link.commission_type === "fixed") {
    return Math.round(value * 100);
  }
  const base = dealRevenueCents(deal?.amount_cents ?? 0, deal?.stage_slug ?? "");
  return Math.round((base * value) / 100);
}

export function formatCommissionLabel(
  link: Pick<PrescripteurLinkedDeal, "commission_type" | "commission_value">,
): string {
  const value = Number(link.commission_value) || 0;
  if (link.commission_type === "fixed") {
    return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;
  }
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export function formatCommissionAmount(cents: number): string {
  return formatDealAmount(cents);
}

export function sumLinkedCommissionsCents(links: PrescripteurLinkedDeal[]): number {
  return links.reduce((sum, link) => sum + computeClientCommissionCents(link, link.deal), 0);
}
