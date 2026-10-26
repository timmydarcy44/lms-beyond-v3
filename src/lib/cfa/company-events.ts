import type { SupabaseClient } from "@supabase/supabase-js";

export async function logCompanyEvent(
  db: SupabaseClient,
  input: {
    companyId: string;
    actorId: string | null;
    action: string;
    body: string;
    oldValue?: string | null;
    newValue?: string | null;
    activityType?: "note" | "call" | "email" | "meeting" | "status_change" | "profile_sent" | "placement" | "opco_lookup";
  },
) {
  const audit = await db.from("cfa_audit_events").insert({
    actor_id: input.actorId,
    application_id: null,
    company_id: input.companyId,
    action: input.action,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
  });
  const activity = await db.from("cfa_company_activities").insert({
    company_id: input.companyId,
    type: input.activityType ?? "status_change",
    body: input.body,
    actor_id: input.actorId,
  });
  const error = audit.error ?? activity.error;
  if (error && /cfa_audit_events|cfa_company_activities|schema cache|application_id/i.test(error.message)) {
    return "Collez le script 20261026160000_cfa_company_fiche.sql.";
  }
  return error?.message ?? null;
}
