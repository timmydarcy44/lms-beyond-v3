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
  const activityType = input.activityType ?? "status_change";
  const recent = await db
    .from("cfa_company_activities")
    .select("id, type, body")
    .eq("company_id", input.companyId)
    .eq("type", activityType)
    .eq("body", input.body)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent.data?.id) {
    const auditOnly = await db.from("cfa_audit_events").insert({
      actor_id: input.actorId,
      application_id: null,
      company_id: input.companyId,
      action: input.action,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
    });
    if (auditOnly.error && /cfa_audit_events|schema cache|application_id/i.test(auditOnly.error.message)) {
      return "Collez le script 20261026160000_cfa_company_fiche.sql.";
    }
    return auditOnly.error?.message ?? null;
  }

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
    type: activityType,
    body: input.body,
    actor_id: input.actorId,
  });
  const error = audit.error ?? activity.error;
  if (error && /cfa_audit_events|cfa_company_activities|schema cache|application_id/i.test(error.message)) {
    return "Collez le script 20261026160000_cfa_company_fiche.sql.";
  }
  return error?.message ?? null;
}

/** Masque les doublons déjà en base à l'affichage (même type + même contenu). */
export function dedupeTimelineItems<T extends { type: string; body: string | null }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = `${item.type}::${String(item.body ?? "").trim()}`;
    if (item.type !== "note" && seen.has(key)) continue;
    if (item.type !== "note") seen.add(key);
    out.push(item);
  }
  return out;
}
