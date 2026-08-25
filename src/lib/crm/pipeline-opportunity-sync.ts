import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isLostStage,
  isWonRevenueStage,
  type PipelineOpportunityType,
} from "@/lib/crm/pipeline-opportunity-ca";

const OPPORTUNITY_COLUMNS = [
  "opportunity_type",
  "opportunity_title",
  "opportunity_identified_at",
  "opportunity_won_at",
] as const;

const OPPORTUNITY_COLUMN_ERROR =
  /opportunity_type|opportunity_title|opportunity_identified_at|opportunity_won_at|crm_pipeline_opportunities|crm_pipeline_deal_stage_history/i;

export function stripOpportunityColumns(row: Record<string, unknown>): Record<string, unknown> {
  const next = { ...row };
  for (const key of OPPORTUNITY_COLUMNS) {
    delete next[key];
  }
  return next;
}

export function isOpportunitySchemaError(message: string | undefined | null): boolean {
  return Boolean(message && OPPORTUNITY_COLUMN_ERROR.test(message));
}

export function parseOpportunityType(raw: unknown): PipelineOpportunityType | null {
  if (raw == null || raw === "") return null;
  const v = String(raw).trim();
  if (
    v === "formation_edge" ||
    v === "beyond_learning" ||
    v === "edge_recruit" ||
    v === "autre"
  ) {
    return v;
  }
  return "autre";
}

type ExistingDeal = {
  stage_slug?: string | null;
  amount_cents?: number | null;
  opportunity_type?: string | null;
  opportunity_title?: string | null;
  opportunity_identified_at?: string | null;
  opportunity_won_at?: string | null;
};

/** Enrichit le patch deal avec dates / type opportunité selon montant + étape. */
export function applyOpportunityFieldsToDealPatch(
  patch: Record<string, unknown>,
  existing: ExistingDeal | null,
  body: Record<string, unknown> | null,
): void {
  const nextAmount =
    patch.amount_cents != null
      ? Number(patch.amount_cents)
      : Number(existing?.amount_cents ?? 0);
  const nextStage = String(patch.stage_slug ?? existing?.stage_slug ?? "");
  const now = new Date().toISOString();

  const bodyType = parseOpportunityType(body?.opportunity_type);
  if (bodyType) patch.opportunity_type = bodyType;
  if (body?.opportunity_title !== undefined) {
    patch.opportunity_title = body.opportunity_title
      ? String(body.opportunity_title).trim()
      : null;
  }

  if (nextAmount > 0) {
    if (!existing?.opportunity_identified_at && !patch.opportunity_identified_at) {
      patch.opportunity_identified_at = now;
    }
    if (!patch.opportunity_type && !existing?.opportunity_type) {
      patch.opportunity_type = "autre";
    }
    if (!patch.opportunity_title && !existing?.opportunity_title) {
      patch.opportunity_title = "Opportunité commerciale";
    }
  }

  const becomingWon =
    isWonRevenueStage(nextStage) || nextStage === "gagne";
  const wasWon =
    isWonRevenueStage(String(existing?.stage_slug ?? "")) ||
    existing?.stage_slug === "gagne";

  if (becomingWon && nextAmount > 0 && !wasWon) {
    patch.opportunity_won_at = existing?.opportunity_won_at || now;
  }
  if (isLostStage(nextStage) && !isLostStage(String(existing?.stage_slug ?? ""))) {
    // won_at inchangé ; le status opportunity passera à lost
  }
}

export async function logDealStageChange(
  supabase: SupabaseClient,
  params: {
    dealId: string;
    fromStage: string | null;
    toStage: string;
    changedByEmail?: string | null;
    source?: string;
  },
): Promise<void> {
  if (params.fromStage === params.toStage) return;
  const { error } = await supabase.from("crm_pipeline_deal_stage_history").insert({
    deal_id: params.dealId,
    from_stage_slug: params.fromStage,
    to_stage_slug: params.toStage,
    changed_by_email: params.changedByEmail ?? null,
    source: params.source ?? "ui",
  });
  if (error && !isOpportunitySchemaError(error.message)) {
    console.warn("[crm] stage history insert failed", error.message);
  }
}

/** Upsert opportunité primaire miroir du montant deal (V1 = 1 opportunité / deal). */
export async function syncPrimaryOpportunity(
  supabase: SupabaseClient,
  deal: {
    id: string;
    stage_slug: string;
    amount_cents: number;
    opportunity_type?: string | null;
    opportunity_title?: string | null;
    opportunity_identified_at?: string | null;
    opportunity_won_at?: string | null;
  },
): Promise<void> {
  const amount = deal.amount_cents ?? 0;
  if (amount <= 0) {
    // Ne pas supprimer l'historique : marquer lost/active à 0 si existait
    const { data: existing } = await supabase
      .from("crm_pipeline_opportunities")
      .select("id")
      .eq("deal_id", deal.id)
      .eq("is_primary", true)
      .maybeSingle();
    if (existing?.id) {
      await supabase
        .from("crm_pipeline_opportunities")
        .update({
          amount_cents: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    }
    return;
  }

  const won = isWonRevenueStage(deal.stage_slug) || deal.stage_slug === "gagne";
  const lost = isLostStage(deal.stage_slug);
  const status = won ? "won" : lost ? "lost" : "active";
  const now = new Date().toISOString();

  const row = {
    deal_id: deal.id,
    opportunity_type: deal.opportunity_type || "autre",
    title: deal.opportunity_title || "Opportunité commerciale",
    amount_cents: amount,
    status,
    is_primary: true,
    identified_at: deal.opportunity_identified_at || now,
    won_at: won ? deal.opportunity_won_at || now : null,
    lost_at: lost ? now : null,
    updated_at: now,
  };

  const { data: existing } = await supabase
    .from("crm_pipeline_opportunities")
    .select("id")
    .eq("deal_id", deal.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("crm_pipeline_opportunities")
      .update(row)
      .eq("id", existing.id);
    if (error && !isOpportunitySchemaError(error.message)) {
      console.warn("[crm] opportunity update failed", error.message);
    }
    return;
  }

  const { error } = await supabase.from("crm_pipeline_opportunities").insert(row);
  if (error && !isOpportunitySchemaError(error.message)) {
    console.warn("[crm] opportunity insert failed", error.message);
  }
}
