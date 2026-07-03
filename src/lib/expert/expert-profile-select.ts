/** Colonnes experts validées en prod — évite les erreurs 400 PostgREST */
export const EXPERT_PROFILE_SELECT_CORE =
  "id,email,first_name,last_name,headline,bio,avatar_url,photo_url,specialties,formats_supported,references,review_status,is_active,wants_certification,certification_status,is_certified_beyond,registration_step,linkedin_url,regions";

export const EXPERT_PROFILE_SELECT_EXTENDED =
  `${EXPERT_PROFILE_SELECT_CORE},bio_long,website_url,daily_rate`;

export const EXPERT_PROFILE_SELECT_TIERS = [
  EXPERT_PROFILE_SELECT_EXTENDED,
  EXPERT_PROFILE_SELECT_CORE,
] as const;

export function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST204" || error.code === "42703") return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("column") && (msg.includes("does not exist") || msg.includes("could not find"));
}
