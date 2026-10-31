import type { SupabaseClient } from "@supabase/supabase-js";
import { BADGE_PUBLIC_ORIGIN, REVOCATION_STATUS_URL } from "@/lib/openbadges/v3/credential";
import { encodeStatusList } from "@/lib/openbadges/v3/status-list";

export type RevokedCredentialEntry = {
  id: string;
  revoked: boolean;
  revocationReason?: string;
};

/** Liste publique décrite par 1EdTech Revocation List v1.0, sections 3 et 4.1. */
export function revocationListDocument(entries: RevokedCredentialEntry[]) {
  return {
    id: REVOCATION_STATUS_URL,
    issuer: `${BADGE_PUBLIC_ORIGIN}/issuers/byound`,
    revokedCredential: entries,
    revokedCredentials: entries,
  };
}

export async function refreshRevocationList(db: SupabaseClient) {
  const { data, error } = await db.from("badge_assertions").select("status_index, revoked_at");
  if (error) throw new Error(error.message);
  const revoked = (data ?? [])
    .filter((row) => row.revoked_at && typeof row.status_index === "number")
    .map((row) => row.status_index as number);
  const encodedList = encodeStatusList(revoked);
  const { error: updateError } = await db
    .from("badge_status_lists")
    .update({ encoded_list: encodedList, updated_at: new Date().toISOString() })
    .eq("purpose", "revocation");
  if (updateError) throw new Error(updateError.message);
  return encodedList;
}

export async function revokeBadgeAssertion(db: SupabaseClient, assertionId: string, reason: string) {
  const motif = reason.trim();
  if (!motif) return { ok: false as const, error: "REASON_REQUIRED" };
  const { data, error } = await db
    .from("badge_assertions")
    .update({ revoked_at: new Date().toISOString(), revocation_reason: motif })
    .eq("id", assertionId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false as const, error: error?.message ?? "NOT_FOUND" };
  await refreshRevocationList(db);
  return { ok: true as const };
}
