import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Lit le flag OF « Certification Qualiopi obtenue ».
 * Prefère la colonne `of_settings.qualiopi_certified` ; sinon lit
 * `qualiopi_activities.qualiopi_certified` (repli sans migration DDL).
 */
export function readQualiopiCertifiedFromRow(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) return false;
  if (typeof row.qualiopi_certified === "boolean") return row.qualiopi_certified;
  const act = row.qualiopi_activities;
  if (act && typeof act === "object" && typeof (act as { qualiopi_certified?: unknown }).qualiopi_certified === "boolean") {
    return Boolean((act as { qualiopi_certified: boolean }).qualiopi_certified);
  }
  return false;
}

export async function loadQualiopiCertified(service: SupabaseClient): Promise<boolean> {
  const full = await service
    .from("of_settings")
    .select("qualiopi_certified, qualiopi_activities")
    .limit(1)
    .maybeSingle();
  if (!full.error && full.data) {
    return readQualiopiCertifiedFromRow(full.data as Record<string, unknown>);
  }
  if (full.error && /qualiopi_certified/i.test(full.error.message)) {
    const fb = await service.from("of_settings").select("qualiopi_activities").limit(1).maybeSingle();
    if (!fb.error && fb.data) {
      return readQualiopiCertifiedFromRow(fb.data as Record<string, unknown>);
    }
  }
  return false;
}

/**
 * Afficher OPCO sur le front public — désactivé par défaut.
 * Stocké dans `of_settings.qualiopi_activities.show_opco_public` (pas de DDL).
 */
export function readShowOpcoPublicFromRow(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) return false;
  const act = row.qualiopi_activities;
  if (act && typeof act === "object" && typeof (act as { show_opco_public?: unknown }).show_opco_public === "boolean") {
    return Boolean((act as { show_opco_public: boolean }).show_opco_public);
  }
  return false;
}

export async function loadShowOpcoPublic(service: SupabaseClient): Promise<boolean> {
  const { data, error } = await service.from("of_settings").select("qualiopi_activities").limit(1).maybeSingle();
  if (error || !data) return false;
  return readShowOpcoPublicFromRow(data as Record<string, unknown>);
}

/** Fusionne le booléen dans le JSON activités (repli sans colonne). */
export function mergeCertifiedIntoActivities(
  activities: Record<string, unknown>,
  certified: boolean,
): Record<string, unknown> {
  return { ...activities, qualiopi_certified: certified };
}
