import type { SupabaseClient } from "@supabase/supabase-js";
import type { JWK } from "jose";
import { BADGE_PUBLIC_ORIGIN, REVOCATION_STATUS_URL } from "@/lib/openbadges/v3/credential";
import { verifyCredentialJwt } from "@/lib/openbadges/v3/sign";
import { isPublicBadgeVisible, statusBit } from "@/lib/openbadges/v3/status-list";

export type BadgeVerificationState = "verified" | "expired" | "revoked" | "invalid";

export type PublicBadgeDocument = {
  assertionId: string;
  badgeClassId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  recipientName: string;
  issuedAt: string;
  validUntil: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  credentialJwt: string;
  kid: string | null;
  criteria: Array<{ label: string; description: string | null }>;
  state: BadgeVerificationState;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function criteriaOf(row: Record<string, unknown>) {
  const items = Array.isArray(row.criteria_items) ? row.criteria_items : [];
  return items.flatMap((item) => {
    const record = asRecord(item);
    const label = String(record.label ?? "").trim();
    if (!label) return [];
    return [{ label, description: typeof record.description === "string" ? record.description : null }];
  });
}

export async function loadPublicBadgeDocument(
  db: SupabaseClient,
  assertionId: string,
): Promise<PublicBadgeDocument | null> {
  const { data: assertion } = await db
    .from("badge_assertions")
    .select("id, badge_class_id, recipient_name, issued_at, valid_until, revoked_at, revocation_reason, credential_jwt, kid, is_public, status_index")
    .eq("id", assertionId)
    .maybeSingle();
  if (!assertion || !isPublicBadgeVisible(assertion)) return null;
  if (!assertion.credential_jwt) return null;

  const { data: badge } = await db
    .from("open_badges")
    .select("id, name, title, description, image_url, criteria_items")
    .eq("id", assertion.badge_class_id)
    .maybeSingle();
  if (!badge) return null;

  const { data: issuer } = await db.from("badge_issuers").select("public_jwks").eq("slug", "byound").maybeSingle();
  const keys = Array.isArray(asRecord(issuer?.public_jwks).keys) ? (asRecord(issuer?.public_jwks).keys as JWK[]) : [];
  const publicKey = keys.find((key) => key.kid === assertion.kid) ?? keys[0];
  let signatureOk = false;
  if (publicKey) {
    try {
      await verifyCredentialJwt(assertion.credential_jwt, publicKey);
      signatureOk = true;
    } catch {
      signatureOk = false;
    }
  }

  const { data: statusRow } = await db
    .from("badge_status_lists")
    .select("encoded_list")
    .eq("purpose", "revocation")
    .maybeSingle();
  let listRevoked = false;
  if (statusRow?.encoded_list && typeof assertion.status_index === "number") {
    try {
      listRevoked = statusBit(statusRow.encoded_list, assertion.status_index);
    } catch {
      listRevoked = false;
    }
  }

  const revoked = Boolean(assertion.revoked_at) || listRevoked;
  const expired = Boolean(assertion.valid_until) && Date.parse(assertion.valid_until) < Date.now();
  const state: BadgeVerificationState = !signatureOk ? "invalid" : revoked ? "revoked" : expired ? "expired" : "verified";

  return {
    assertionId: assertion.id,
    badgeClassId: String(badge.id),
    name: String(badge.name ?? badge.title ?? "Open Badge"),
    description: String(badge.description ?? ""),
    imageUrl: typeof badge.image_url === "string" ? badge.image_url : null,
    recipientName: assertion.recipient_name,
    issuedAt: assertion.issued_at,
    validUntil: assertion.valid_until,
    revokedAt: assertion.revoked_at,
    revocationReason: assertion.revocation_reason,
    credentialJwt: assertion.credential_jwt,
    kid: assertion.kid,
    criteria: criteriaOf(badge),
    state,
  };
}

export function decodeCredentialPayload(jwt: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function statusListCredential(encodedList: string, issuedAt: string) {
  return {
    "@context": [ "https://www.w3.org/ns/credentials/v2", "https://www.w3.org/ns/credentials/status/v1" ],
    id: REVOCATION_STATUS_URL,
    type: ["VerifiableCredential", "BitstringStatusListCredential"],
    issuer: {
      id: `${BADGE_PUBLIC_ORIGIN}/issuers/byound`,
      type: ["Profile"],
      name: "Byound",
      url: BADGE_PUBLIC_ORIGIN,
      email: "contact@byound.fr",
    },
    validFrom: issuedAt,
    credentialSubject: {
      id: `${REVOCATION_STATUS_URL}#list`,
      type: "BitstringStatusList",
      statusPurpose: "revocation",
      encodedList,
    },
  };
}
