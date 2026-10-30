import type { SupabaseClient } from "@supabase/supabase-js";
import { BADGE_PUBLIC_ORIGIN, REVOCATION_STATUS_URL } from "@/lib/openbadges/v3/credential";
import { publicCredentialJwt } from "@/lib/openbadges/v3/reissue";
import { publicJwksKeys, verifyCredentialJwt } from "@/lib/openbadges/v3/sign";
import { isPublicBadgeVisible, statusBit } from "@/lib/openbadges/v3/status-list";

export type BadgeVerificationState = "verified" | "expired" | "revoked" | "invalid";

export function resolveBadgeVerificationState(input: {
  signatureOk: boolean;
  revoked: boolean;
  expired: boolean;
}): BadgeVerificationState {
  if (!input.signatureOk) return "invalid";
  if (input.revoked) return "revoked";
  if (input.expired) return "expired";
  return "verified";
}

export type PublicBadgeCriterion = {
  label: string;
  description: string | null;
  validatedAt: string | null;
};

export type PublicBadgeEvidence = {
  name: string;
  description: string | null;
  url: string | null;
};

export type PublicBadgeAlignment = {
  targetName: string;
  targetUrl: string | null;
  targetFramework: string | null;
  targetCode: string | null;
};

export type PublicBadgeDocument = {
  assertionId: string;
  badgeClassId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  level: number | null;
  recipientName: string;
  issuedAt: string;
  validUntil: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  credentialJwt: string;
  kid: string | null;
  criteria: PublicBadgeCriterion[];
  evidence: PublicBadgeEvidence[];
  alignments: PublicBadgeAlignment[];
  indexable: boolean;
  state: BadgeVerificationState;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function criteriaOf(row: Record<string, unknown>, validatedAt: string): PublicBadgeCriterion[] {
  const items = Array.isArray(row.criteria_items) ? row.criteria_items : [];
  return items.flatMap((item) => {
    const record = asRecord(item);
    const label = String(record.label ?? "").trim();
    if (!label) return [];
    return [{
      label,
      description: typeof record.description === "string" ? record.description : null,
      validatedAt,
    }];
  });
}

export function publicEvidenceItems(raw: unknown): PublicBadgeEvidence[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const record = asRecord(item);
    const visible = record.public === true || record.public === "true";
    if (!visible) return [];
    const name = String(record.name ?? record.narrative ?? "").trim();
    if (!name) return [];
    const narrative = typeof record.narrative === "string" ? record.narrative.trim() : "";
    const description = typeof record.description === "string" ? record.description.trim() : narrative && narrative !== name ? narrative : "";
    return [{
      name,
      description: description || null,
      url: typeof record.url === "string" && record.url.trim() ? record.url.trim() : null,
    }];
  });
}

function alignmentsOf(raw: unknown): PublicBadgeAlignment[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const record = asRecord(item);
    const targetName = String(record.targetName ?? "").trim();
    if (!targetName) return [];
    return [{
      targetName,
      targetUrl: typeof record.targetUrl === "string" && record.targetUrl.trim() ? record.targetUrl.trim() : null,
      targetFramework: typeof record.targetFramework === "string" ? record.targetFramework : null,
      targetCode: typeof record.targetCode === "string" ? record.targetCode : null,
    }];
  });
}

function levelOf(row: Record<string, unknown>): number | null {
  const config = asRecord(row.evaluation_config);
  const source = row.level ?? config.level;
  const level = typeof source === "number" ? source : Number.parseInt(String(source ?? ""), 10);
  return Number.isFinite(level) ? level : null;
}

export const PUBLIC_ASSERTION_COLUMNS =
  "id, badge_class_id, recipient_name, issued_at, valid_until, revoked_at, revocation_reason, credential_jwt, kid, is_public, status_index, evidence";

export function visibleBadgeStatLabels(input: {
  level: number | null;
  criteriaCount: number;
  evidenceCount: number;
  hasExpiry: boolean;
}): string[] {
  const labels: string[] = [];
  if (input.level != null) labels.push("Niveau");
  if (input.criteriaCount > 0) labels.push("Critères");
  if (input.evidenceCount > 0) labels.push("Livrables");
  if (input.hasExpiry) labels.push("Expiration");
  return labels;
}

export function badgeStatGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  return "grid-cols-2 sm:grid-cols-4";
}

export async function loadPublicBadgeDocument(
  db: SupabaseClient,
  assertionId: string,
): Promise<PublicBadgeDocument | null> {
  let { data: assertion, error } = await db
    .from("badge_assertions")
    .select(`${PUBLIC_ASSERTION_COLUMNS}, indexable`)
    .eq("id", assertionId)
    .maybeSingle();
  if (error) {
    const retry = await db.from("badge_assertions").select(PUBLIC_ASSERTION_COLUMNS).eq("id", assertionId).maybeSingle();
    assertion = retry.data ? { ...retry.data, indexable: true } : null;
  }
  const credentialJwt = assertion ? publicCredentialJwt(assertion) : null;
  if (!assertion || !isPublicBadgeVisible(assertion) || !credentialJwt) return null;

  const { data: badge } = await db
    .from("open_badges")
    .select("id, name, title, description, image_url, criteria_items, alignments, level, evaluation_config")
    .eq("id", assertion.badge_class_id)
    .maybeSingle();
  if (!badge) return null;

  const { data: issuer } = await db.from("badge_issuers").select("public_jwks").eq("slug", "byound").maybeSingle();
  const keys = publicJwksKeys(asRecord(issuer?.public_jwks).keys);
  let signatureOk = false;
  if (keys.length > 0) {
    try {
      await verifyCredentialJwt(credentialJwt, keys);
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
  const state = resolveBadgeVerificationState({ signatureOk, revoked, expired });

  return {
    assertionId: assertion.id,
    badgeClassId: String(badge.id),
    name: String(badge.name ?? badge.title ?? "Open Badge"),
    description: String(badge.description ?? ""),
    imageUrl: typeof badge.image_url === "string" ? badge.image_url : null,
    level: levelOf(badge),
    recipientName: assertion.recipient_name,
    issuedAt: assertion.issued_at,
    validUntil: assertion.valid_until,
    revokedAt: assertion.revoked_at,
    revocationReason: assertion.revocation_reason,
    credentialJwt,
    kid: assertion.kid,
    criteria: criteriaOf(badge, assertion.issued_at),
    evidence: publicEvidenceItems(assertion.evidence),
    alignments: alignmentsOf(badge.alignments),
    indexable: assertion.indexable !== false,
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
