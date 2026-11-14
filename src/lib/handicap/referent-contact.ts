import type { SupabaseClient } from "@supabase/supabase-js";

export type DisabilityReferentContact = {
  userId: string | null;
  displayName: string;
  email: string | null;
  /** Ligne pour convocation / mentions publiques. */
  publicLine: string;
};

const FALLBACK: DisabilityReferentContact = {
  userId: null,
  displayName: "Référente handicap Byound",
  email: "referent-handicap@byound.fr",
  publicLine: "Référente handicap Byound · referent-handicap@byound.fr",
};

/**
 * Coordonnées publiques de la référente : of_settings.referent_handicap_user_id → profiles.
 * Jamais de nom en dur Jessica / Timmy dans les documents.
 */
export async function loadDisabilityReferentContact(
  service: SupabaseClient,
): Promise<DisabilityReferentContact> {
  const { data: settings } = await service
    .from("of_settings")
    .select("referent_handicap_user_id")
    .limit(1)
    .maybeSingle();

  const userId = settings?.referent_handicap_user_id
    ? String(settings.referent_handicap_user_id)
    : null;
  if (!userId) return FALLBACK;

  const { data: profile } = await service
    .from("profiles")
    .select("id, first_name, last_name, full_name, email, reference_email")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { ...FALLBACK, userId };

  const displayName =
    String(profile.full_name ?? "").trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    FALLBACK.displayName;
  const email =
    String(profile.email ?? "").trim().toLowerCase() ||
    String(profile.reference_email ?? "").trim().toLowerCase() ||
    FALLBACK.email;

  return {
    userId,
    displayName,
    email,
    publicLine: email ? `${displayName} · ${email}` : displayName,
  };
}
