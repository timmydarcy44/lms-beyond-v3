import type { SupabaseClient } from "@supabase/supabase-js";

/** UUID fixe — voir migration 20260619100000_diagnostic_commercial_badge.sql */
export const PROFIL_COMPORTEMENTAL_BADGE_ID = "a1000001-0000-4000-8000-000000000001";

/** Nom technique historique en base (open_badges.name). */
export const PROFIL_COMPORTEMENTAL_BADGE_NAME = "Profil comportemental Byound";

/** Libellé produit affiché (wallet, celebration) — open_badges.title. */
export const PROFIL_COMPORTEMENTAL_BADGE_DISPLAY_NAME = "Connaissance de soi";

/** @deprecated */
export const DIAGNOSTIC_COMMERCIAL_BADGE_ID = PROFIL_COMPORTEMENTAL_BADGE_ID;

/** @deprecated */
export const DIAGNOSTIC_COMMERCIAL_BADGE_NAME = PROFIL_COMPORTEMENTAL_BADGE_NAME;

export async function resolveProfilComportementalBadgeId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data: byId } = await supabase
    .from("open_badges")
    .select("id")
    .eq("id", PROFIL_COMPORTEMENTAL_BADGE_ID)
    .maybeSingle();

  if (byId?.id) return String(byId.id);

  for (const name of [PROFIL_COMPORTEMENTAL_BADGE_NAME, "Diagnostic Commercial"]) {
    const { data: byName } = await supabase
      .from("open_badges")
      .select("id")
      .eq("name", name)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byName?.id) return String(byName.id);
  }

  return null;
}

/** @deprecated */
export const resolveDiagnosticCommercialBadgeId = resolveProfilComportementalBadgeId;
