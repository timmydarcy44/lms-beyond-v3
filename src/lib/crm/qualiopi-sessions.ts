import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SIGNED_DEAL_STAGES_FOR_FORMATIONS } from "@/lib/crm/pipeline-shared";
import { QUALIOPI_CORE_DOCS } from "@/lib/crm/qualiopi-shared";

export function isSignedDealStage(stageSlug: string | null | undefined) {
  return SIGNED_DEAL_STAGES_FOR_FORMATIONS.includes(
    String(stageSlug) as (typeof SIGNED_DEAL_STAGES_FOR_FORMATIONS)[number]
  );
}

export async function copyTemplateDocsToSession(supabase: SupabaseClient, sessionId: string) {
  const { data: templates } = await supabase
    .from("crm_qualiopi_documents")
    .select("*")
    .is("session_id", null)
    .in("kind", ["convention", "reglement", "livret"]);
  const { data: existing } = await supabase
    .from("crm_qualiopi_documents")
    .select("kind")
    .eq("session_id", sessionId);
  const have = new Set((existing ?? []).map((row) => String(row.kind)));
  const rows = QUALIOPI_CORE_DOCS.filter((doc) => !have.has(doc.kind)).map((doc) => {
    const template = (templates ?? []).find((item) => item.kind === doc.kind);
    return {
      session_id: sessionId,
      kind: doc.kind,
      title: doc.title,
      file_url: template?.file_url ?? null,
      file_name: template?.file_name ?? null,
    };
  });
  if (rows.length) {
    await supabase.from("crm_qualiopi_documents").insert(rows);
  }
}

export async function ensureQualiopiSessionForDeal(
  supabase: SupabaseClient,
  deal: { id: string; company_name?: string | null; quoted_course_ids?: string[] | null }
) {
  const { data: existing } = await supabase
    .from("crm_qualiopi_sessions")
    .select("id")
    .eq("deal_id", deal.id)
    .limit(1);
  if (existing?.length) return existing[0];

  const quoted = Array.isArray(deal.quoted_course_ids) ? deal.quoted_course_ids : [];
  const { data: session, error } = await supabase
    .from("crm_qualiopi_sessions")
    .insert({
      deal_id: deal.id,
      course_id: quoted[0] ?? null,
      course_name: "Formation à programmer",
      status: "scheduled",
    })
    .select()
    .single();
  if (error || !session) return null;
  await copyTemplateDocsToSession(supabase, session.id);
  return session;
}

export async function syncSignedDealsIntoFormations(supabase: SupabaseClient) {
  const { data: deals } = await supabase
    .from("crm_pipeline_deals")
    .select("id, company_name, quoted_course_ids, stage_slug")
    .eq("pipeline_type", "btob")
    .in("stage_slug", [...SIGNED_DEAL_STAGES_FOR_FORMATIONS]);
  for (const deal of deals ?? []) {
    await ensureQualiopiSessionForDeal(supabase, deal);
  }
}

export function newAttendeeToken() {
  return randomUUID();
}
