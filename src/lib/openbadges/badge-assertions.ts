import type { SupabaseClient } from "@supabase/supabase-js";
import { createBadgeSalt, hashBadgeEmail } from "@/lib/openbadges/v3/identity";
import {
  buildOpenBadgeCredential,
  type BadgeAlignment,
  type BadgeEvidenceItem,
} from "@/lib/openbadges/v3/credential";
import { publicJwkFromPrivate, signCredentialJwt } from "@/lib/openbadges/v3/sign";
import type { JWK } from "jose";

export type IssueBadgeAssertionInput = {
  badgeClassId: string;
  recipientProfileId: string;
  issuedAt?: string;
  isPublic?: boolean;
  evidence?: BadgeEvidenceItem[];
};

export type IssueBadgeAssertionResult =
  | { ok: true; assertionId: string; alreadyExisted: boolean; signed: boolean; awardedAt: string }
  | { ok: false; error: "NO_PROFILE" | "NO_EMAIL" | "NO_NAME" | "STORAGE" };

type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
};

function personName(row: ProfileRow): string {
  const full = String(row.full_name ?? "").trim();
  if (full) return full;
  const joined = [row.first_name, row.last_name]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  if (joined) return joined;
  return String(row.display_name ?? "").trim();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function criteriaNarrative(row: Record<string, unknown>): string {
  const direct = String(row.criteria_narrative ?? "").trim();
  if (direct) return direct;
  if (typeof row.criteria === "string" && row.criteria.trim()) return row.criteria.trim();
  const items = Array.isArray(row.criteria_items) ? row.criteria_items : [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const record = item as Record<string, unknown>;
      const label = String(record.label ?? "").trim();
      const description = String(record.description ?? "").trim();
      return [label, description].filter(Boolean).join(" — ");
    })
    .filter(Boolean)
    .join("\n");
}

function alignmentsFrom(raw: unknown): BadgeAlignment[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const targetName = String(row.targetName ?? "").trim();
    if (!targetName) return [];
    return [
      {
        targetName,
        targetUrl: typeof row.targetUrl === "string" ? row.targetUrl : undefined,
        targetFramework: typeof row.targetFramework === "string" ? row.targetFramework : undefined,
        targetCode: typeof row.targetCode === "string" ? row.targetCode : undefined,
      },
    ];
  });
}

function validUntil(issuedAt: string, days: unknown): string | null {
  const count = typeof days === "number" ? days : Number.parseInt(String(days ?? ""), 10);
  if (!Number.isFinite(count) || count <= 0) return null;
  const date = new Date(issuedAt);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString();
}

async function nextStatusIndex(db: SupabaseClient): Promise<number> {
  const { data } = await db
    .from("badge_assertions")
    .select("status_index")
    .order("status_index", { ascending: false })
    .limit(1);
  const current = data?.[0]?.status_index;
  return typeof current === "number" ? current + 1 : 0;
}

async function publishIssuerKey(db: SupabaseClient, kid: string) {
  const raw = process.env.BADGE_SIGNING_PRIVATE_JWK?.trim();
  if (!raw) return;
  let jwk: JWK;
  try {
    jwk = JSON.parse(raw) as JWK;
  } catch {
    return;
  }
  const publicKey = publicJwkFromPrivate(jwk, kid);
  const { data } = await db.from("badge_issuers").select("id, public_jwks").eq("slug", "byound").maybeSingle();
  if (!data?.id) return;
  const current = asRecord(data.public_jwks);
  const keys = Array.isArray(current.keys) ? [...current.keys] : [];
  if (keys.some((item) => asRecord(item).kid === kid)) return;
  keys.push(publicKey);
  await db.from("badge_issuers").update({ public_jwks: { keys } }).eq("id", data.id);
}

async function signStoredAssertion(
  db: SupabaseClient,
  assertion: { id: string; status_index: number; recipient_name: string; recipient_salt: string; issued_at: string; valid_until: string | null; evidence: unknown },
  badge: Record<string, unknown>,
  email: string,
): Promise<boolean> {
  const credential = buildOpenBadgeCredential(String(badge.id), {
    assertionId: assertion.id,
    name: String(badge.name ?? badge.title ?? "Open Badge"),
    description: String(badge.description ?? ""),
    imageUrl: typeof badge.image_url === "string" ? badge.image_url : null,
    achievementType: typeof badge.achievement_type === "string" ? badge.achievement_type : "Competency",
    criteriaNarrative: criteriaNarrative(badge),
    alignments: alignmentsFrom(badge.alignments),
    recipientName: assertion.recipient_name,
    recipientEmail: email,
    recipientSalt: assertion.recipient_salt,
    issuedAt: assertion.issued_at,
    validUntil: assertion.valid_until,
    statusIndex: assertion.status_index,
    evidence: Array.isArray(assertion.evidence) ? (assertion.evidence as BadgeEvidenceItem[]) : [],
  });
  const signed = await signCredentialJwt(credential);
  if (!signed) return false;
  const { error } = await db
    .from("badge_assertions")
    .update({ credential_jwt: signed.jwt, kid: signed.kid })
    .eq("id", assertion.id)
    .is("credential_jwt", null);
  if (error) {
    console.error("[badge-assertions] credential update:", error.message);
    return false;
  }
  await publishIssuerKey(db, signed.kid);
  return true;
}

export async function issueBadgeAssertion(
  db: SupabaseClient,
  input: IssueBadgeAssertionInput,
): Promise<IssueBadgeAssertionResult> {
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, display_name")
    .eq("id", input.recipientProfileId)
    .maybeSingle();
  if (profileError || !profile) return { ok: false, error: "NO_PROFILE" };
  const row = profile as ProfileRow;
  const email = String(row.email ?? "").trim();
  const name = personName(row);
  if (!email) return { ok: false, error: "NO_EMAIL" };
  if (!name) return { ok: false, error: "NO_NAME" };

  const { data: existing } = await db
    .from("badge_assertions")
    .select("id, issued_at, credential_jwt, status_index, recipient_name, recipient_salt, valid_until, evidence")
    .eq("badge_class_id", input.badgeClassId)
    .eq("recipient_profile_id", input.recipientProfileId)
    .maybeSingle();

  const { data: badge, error: badgeError } = await db
    .from("open_badges")
    .select("id, name, title, description, image_url, achievement_type, criteria_narrative, criteria, criteria_items, alignments, expires_after_days")
    .eq("id", input.badgeClassId)
    .maybeSingle();
  if (badgeError || !badge) return { ok: false, error: "STORAGE" };

  if (existing?.id) {
    const signed = existing.credential_jwt
      ? true
      : await signStoredAssertion(db, existing, badge as Record<string, unknown>, email);
    return {
      ok: true,
      assertionId: String(existing.id),
      alreadyExisted: true,
      signed,
      awardedAt: String(existing.issued_at),
    };
  }

  const issuedAt = input.issuedAt ?? new Date().toISOString();
  const salt = createBadgeSalt();
  const statusIndex = await nextStatusIndex(db);
  const until = validUntil(issuedAt, (badge as { expires_after_days?: unknown }).expires_after_days);
  const isPublic = input.isPublic === true;

  const { data: inserted, error: insertError } = await db
    .from("badge_assertions")
    .insert({
      badge_class_id: input.badgeClassId,
      recipient_profile_id: input.recipientProfileId,
      recipient_name: name,
      recipient_identity_hash: hashBadgeEmail(email, salt),
      recipient_salt: salt,
      issued_at: issuedAt,
      valid_until: until,
      evidence: input.evidence ?? [],
      status_index: statusIndex,
      is_public: isPublic,
      public_since: isPublic ? issuedAt : null,
    })
    .select("id, issued_at, credential_jwt, status_index, recipient_name, recipient_salt, valid_until, evidence")
    .single();

  if (insertError || !inserted) return { ok: false, error: "STORAGE" };

  const signed = await signStoredAssertion(db, inserted, badge as Record<string, unknown>, email);
  return {
    ok: true,
    assertionId: String(inserted.id),
    alreadyExisted: false,
    signed,
    awardedAt: String(inserted.issued_at),
  };
}

export async function awardedBadgeClassIds(db: SupabaseClient, profileId: string): Promise<Set<string>> {
  const { data } = await db.from("badge_assertions").select("badge_class_id").eq("recipient_profile_id", profileId);
  return new Set((data ?? []).map((row) => String(row.badge_class_id)));
}
