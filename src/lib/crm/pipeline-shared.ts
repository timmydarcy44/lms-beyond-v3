export type PipelineType = "btob" | "btoc";

/** Stades à partir desquels le bandeau CA s’affiche (proposition envoyée et au-delà). */
export const CRM_REVENUE_STAGE_SLUGS = [
  "proposition_envoyee",
  "reussi",
] as const;

export const DEFAULT_BTOC_PIPELINE_STAGES = [
  { slug: "inscription", label: "Inscription", sort_order: 0 },
  { slug: "badge_passe", label: "Badge passé", sort_order: 1 },
  { slug: "paiement", label: "Paiement", sort_order: 2 },
] as const;

export const BTOB_CATALOGUE_STAGE_SLUG = "mail_envoye_catalogue";

export const DEFAULT_PIPELINE_STAGES = [
  { slug: "a_appeler", label: "A appeler", sort_order: 0 },
  { slug: BTOB_CATALOGUE_STAGE_SLUG, label: "Mail envoyé + catalogue", sort_order: 1 },
  { slug: "presentation_programmee", label: "Présentation programmée", sort_order: 2 },
  { slug: "demo_realisee", label: "Démo réalisée", sort_order: 3 },
  { slug: "proposition_a_faire", label: "Proposition à faire", sort_order: 4 },
  { slug: "proposition_envoyee", label: "Proposition envoyée", sort_order: 5 },
  { slug: "reussi", label: "Réussi", sort_order: 6 },
  { slug: "echec", label: "Échec", sort_order: 7 },
] as const;

/** Étapes retirées du pipe (legacy). */
export const DEPRECATED_PIPELINE_STAGE_SLUGS = ["envoi_mail"] as const;

export type PipelineStage = {
  pipeline_type?: string;
  slug: string;
  label: string;
  sort_order: number;
};

export type PipelineDealCommercial = {
  contact_owner_email?: string | null;
  siret?: string | null;
  siren?: string | null;
  naf_code?: string | null;
  opco_name?: string | null;
  sector?: string | null;
  employee_count?: string | null;
  location?: string | null;
  city?: string | null;
  zip_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  quoted_course_ids?: string[] | null;
  priority?: string | null;
  why_target?: string | null;
  training_needs?: string[] | null;
  contact_role?: string | null;
  contact_linkedin?: string | null;
  company_linkedin?: string | null;
  approach_channel?: string | null;
  decision_maker_identified?: boolean | null;
  decision_maker_name?: string | null;
  champion_name?: string | null;
  blocker_name?: string | null;
  finance_contact?: string | null;
  lost_reason?: string | null;
  lost_reason_detail?: string | null;
  lost_competitor?: string | null;
  next_best_action?: string | null;
  engagement_score?: number | null;
  last_contact_date?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  estimated_budget?: string | null;
  estimated_users?: number | null;
};

export type PipelineDeal = PipelineDealCommercial & {
  id: string;
  pipeline_type?: string;
  stage_slug: string;
  organization_id?: string | null;
  profile_id?: string | null;
  source?: string;
  company_name: string;
  contact_first_name: string;
  contact_last_name?: string | null;
  contact_civility?: string | null;
  email: string | null;
  phone: string | null;
  amount_cents: number;
  sort_order: number;
  notes: string | null;
  ai_prospect_summary?: string | null;
  ai_prospect_summary_at?: string | null;
  company_creation_date?: string | null;
  catalog_email_sent_at?: string | null;
  catalog_email_resend_id?: string | null;
  catalog_email_opened_at?: string | null;
  created_at: string;
  updated_at: string;
};

export function formatDealAmount(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function shouldShowRevenueBar(deals: PipelineDeal[]): boolean {
  return deals.some((d) =>
    CRM_REVENUE_STAGE_SLUGS.includes(d.stage_slug as (typeof CRM_REVENUE_STAGE_SLUGS)[number]),
  );
}

export function computePipelineRevenueCents(deals: PipelineDeal[]): number {
  return deals
    .filter((d) =>
      CRM_REVENUE_STAGE_SLUGS.includes(d.stage_slug as (typeof CRM_REVENUE_STAGE_SLUGS)[number]),
    )
    .reduce((sum, d) => sum + (d.amount_cents ?? 0), 0);
}

/** Boutons lisibles sur fond sombre (fiche prospect / panneau EDGE). */
export const PIPELINE_SHEET_BTN_OUTLINE =
  "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white";
export const PIPELINE_SHEET_BTN_SECONDARY = "bg-white/15 text-white hover:bg-white/25";
export const PIPELINE_SHEET_BADGE = "border-white/20 bg-white/10 text-slate-100";
