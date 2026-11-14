import type { SupabaseClient } from "@supabase/supabase-js";

export type DisabilityAccessAction =
  | "view_case"
  | "open_document"
  | "share_trainer"
  | "export"
  | "manual_delete";

/** Journal d'accès — ids seulement, jamais le contenu des champs. */
export async function writeDisabilityAccessLog(
  service: SupabaseClient,
  params: { caseId: string; actorId: string | null; action: DisabilityAccessAction },
) {
  const { error } = await service.from("disability_access_log").insert({
    case_id: params.caseId,
    actor_id: params.actorId,
    action: params.action,
  });
  if (error) {
    console.error("[disability] access_log", params.action, params.caseId, error.message);
  }
}
