import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SIGNED_DEAL_STAGES_FOR_FORMATIONS } from "@/lib/crm/pipeline-shared";
import { QUALIOPI_CORE_DOCS } from "@/lib/crm/qualiopi-shared";

/** @deprecated Prefer isDossierDealTriggerStage — client_actif ne crée plus de dossier. */
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

/** @deprecated Lot 1 — plus de coquilles vides. Utiliser ensureDossierFromWonDeal. */
export async function ensureQualiopiSessionForDeal(
  _supabase: SupabaseClient,
  _deal: { id: string; company_name?: string | null; quoted_course_ids?: string[] | null },
) {
  return null;
}

/** @deprecated Lot 1 — backfill désactivé. */
export async function syncSignedDealsIntoFormations(_supabase: SupabaseClient) {
  return;
}

export function newAttendeeToken() {
  return randomUUID();
}
