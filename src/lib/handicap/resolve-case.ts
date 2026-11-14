import type { SupabaseClient } from "@supabase/supabase-js";

/** Accepte un id disability_cases ou un legacy handicap_profiles.id. */
export async function resolveDisabilityCaseId(
  service: SupabaseClient,
  rawId: string,
): Promise<string | null> {
  const id = String(rawId ?? "").trim();
  if (!id) return null;

  const { data: direct } = await service
    .from("disability_cases")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (direct?.id) return String(direct.id);

  const { data: byLegacy } = await service
    .from("disability_cases")
    .select("id")
    .eq("legacy_handicap_profile_id", id)
    .maybeSingle();
  if (byLegacy?.id) return String(byLegacy.id);

  return null;
}
