import { buildOpenBadgeCredential, type BadgeAlignment, type BadgeEvidenceItem } from "@/lib/openbadges/v3/credential";

export type PreservedBadgeIdentity = {
  assertionId: string;
  validFrom: string;
  identityHash: string;
  salt: string;
  recipientName: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function preservedIdentityFromCredential(payload: Record<string, unknown>): PreservedBadgeIdentity {
  const subject = asRecord(payload.credentialSubject);
  const identifier = Array.isArray(subject.identifier) ? asRecord(subject.identifier[0]) : {};
  const id = String(payload.id ?? "");
  const assertionId = id.split("/badges/")[1] ?? "";
  const validFrom = String(payload.validFrom ?? "");
  const identityHash = String(identifier.identityHash ?? "");
  const salt = String(identifier.salt ?? "");
  const recipientName = String(subject.name ?? "");
  if (!assertionId || !validFrom || !identityHash || !salt || !recipientName) {
    throw new Error("Credential précédent incomplet");
  }
  return { assertionId, validFrom, identityHash, salt, recipientName };
}

export function buildReissuedOpenBadgeCredential(
  badgeClassId: string,
  preserved: PreservedBadgeIdentity,
  badge: {
    name: string;
    description: string;
    imageUrl?: string | null;
    achievementType?: string | null;
    criteriaNarrative?: string | null;
    alignments?: BadgeAlignment[];
    evidence?: BadgeEvidenceItem[];
    statusIndex: number;
    validUntil?: string | null;
  },
): Record<string, unknown> {
  return buildOpenBadgeCredential(badgeClassId, {
    assertionId: preserved.assertionId,
    name: badge.name,
    description: badge.description,
    imageUrl: badge.imageUrl,
    achievementType: badge.achievementType,
    criteriaNarrative: badge.criteriaNarrative,
    alignments: badge.alignments,
    recipientName: preserved.recipientName,
    recipientEmail: "",
    recipientSalt: preserved.salt,
    identityHash: preserved.identityHash,
    issuedAt: preserved.validFrom,
    validUntil: badge.validUntil,
    statusIndex: badge.statusIndex,
    evidence: badge.evidence,
  });
}

/** Le JWT archivé ne sort jamais d'une réponse publique. */
export function publicCredentialJwt(row: {
  credential_jwt?: string | null;
  superseded_credential_jwt?: string | null;
}): string | null {
  const current = String(row.credential_jwt ?? "").trim();
  return current || null;
}
