import type { SupabaseClient } from "@supabase/supabase-js";

/** UUID fixe — voir migration 20260619100000_diagnostic_commercial_badge.sql */
export const DIAGNOSTIC_COMMERCIAL_BADGE_ID = "a1000001-0000-4000-8000-000000000001";

export const DIAGNOSTIC_COMMERCIAL_BADGE_NAME = "Diagnostic Commercial";

export async function resolveDiagnosticCommercialBadgeId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data: byId } = await supabase
    .from("open_badges")
    .select("id")
    .eq("id", DIAGNOSTIC_COMMERCIAL_BADGE_ID)
    .maybeSingle();

  if (byId?.id) return String(byId.id);

  const { data: byName } = await supabase
    .from("open_badges")
    .select("id")
    .eq("name", DIAGNOSTIC_COMMERCIAL_BADGE_NAME)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return byName?.id ? String(byName.id) : null;
}
