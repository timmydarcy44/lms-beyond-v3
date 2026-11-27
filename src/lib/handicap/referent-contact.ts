import type { SupabaseClient } from "@supabase/supabase-js";
import {
  QUALIOPI_HANDICAP_REFERENT_SHORT,
  QUALIOPI_PUBLIC_CONTACT_EMAIL,
  QUALIOPI_PUBLIC_CONTACT_PHONE,
} from "@/lib/qualiopi/public-copy";

export type DisabilityReferentContact = {
  userId: string | null;
  displayName: string;
  email: string | null;
  /** Ligne pour convocation / mentions publiques. */
  publicLine: string;
};

const FALLBACK: DisabilityReferentContact = {
  userId: null,
  displayName: "Jessica Contentin",
  email: QUALIOPI_PUBLIC_CONTACT_EMAIL,
  publicLine: QUALIOPI_HANDICAP_REFERENT_SHORT,
};

/**
 * Coordonnées publiques de la référente : of_settings.referent_handicap_user_id → profiles.
 * Fallback = contact Qualiopi unique (jessica.contentin@byound.fr).
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
  // Contact public Qualiopi = adresse unique (pas l'email perso du profil).
  const email = QUALIOPI_PUBLIC_CONTACT_EMAIL;

  return {
    userId,
    displayName,
    email,
    publicLine: `${displayName} · ${email} · ${QUALIOPI_PUBLIC_CONTACT_PHONE}`,
  };
}
