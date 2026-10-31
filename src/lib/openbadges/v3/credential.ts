import { hashBadgeEmail } from "@/lib/openbadges/v3/identity";

export const BADGE_PUBLIC_ORIGIN = "https://www.byound.fr";
export const OB_V3_CONTEXT = "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json";
export const OB_V3_EXTENSIONS_CONTEXT = "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json";
export const VC_V2_CONTEXT = "https://www.w3.org/ns/credentials/v2";
export const REVOCATION_STATUS_URL = `${BADGE_PUBLIC_ORIGIN}/api/public/status/revocation`;

export type BadgeAlignment = {
  targetName: string;
  targetUrl?: string;
  targetFramework?: string;
  targetCode?: string;
};

export type BadgeEvidenceItem = {
  id?: string;
  name?: string;
  description?: string;
  genre?: string;
  narrative?: string;
  url?: string;
  validatedBy?: string;
  date?: string;
};

export type OpenBadgeCredentialInput = {
  assertionId: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  achievementType?: string | null;
  criteriaNarrative?: string | null;
  alignments?: BadgeAlignment[];
  recipientName: string;
  recipientEmail: string;
  recipientSalt: string;
  /** Conserve le hash déjà émis. Sinon il est recalculé depuis l'email et le sel. */
  identityHash?: string;
  issuedAt: string;
  validUntil?: string | null;
  statusIndex: number;
  evidence?: BadgeEvidenceItem[];
};

function achievementId(badgeClassId: string) {
  return `${BADGE_PUBLIC_ORIGIN}/badgeclasses/${badgeClassId}`;
}

export function buildOpenBadgeCredential(
  badgeClassId: string,
  input: OpenBadgeCredentialInput,
): Record<string, unknown> {
  const issuerId = `${BADGE_PUBLIC_ORIGIN}/issuers/byound`;
  const credentialId = `${BADGE_PUBLIC_ORIGIN}/badges/${input.assertionId}`;
  const criteriaId = `${achievementId(badgeClassId)}/criteria`;
  const narrative = String(input.criteriaNarrative ?? "").trim();
  const imageUrl = String(input.imageUrl ?? "").trim();
  const alignments = (input.alignments ?? []).filter((item) => item.targetName.trim());
  const evidence = (input.evidence ?? []).filter((item) => item.name || item.narrative || item.url);

  const achievement: Record<string, unknown> = {
    id: achievementId(badgeClassId),
    type: ["Achievement"],
    achievementType: input.achievementType?.trim() || "Competency",
    name: input.name,
    description: input.description,
    criteria: narrative ? { id: criteriaId, narrative } : { id: criteriaId },
  };
  if (imageUrl) {
    achievement.image = { id: imageUrl, type: "Image" };
  }
  if (alignments.length > 0) {
    achievement.alignment = alignments.map((item) => ({
      type: ["Alignment"],
      targetName: item.targetName,
      ...(item.targetUrl ? { targetUrl: item.targetUrl } : {}),
      ...(item.targetFramework ? { targetFramework: item.targetFramework } : {}),
      ...(item.targetCode ? { targetCode: item.targetCode } : {}),
    }));
  }

  const credential: Record<string, unknown> = {
    "@context": [VC_V2_CONTEXT, OB_V3_CONTEXT, OB_V3_EXTENSIONS_CONTEXT],
    id: credentialId,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: input.name,
    issuer: {
      id: issuerId,
      type: ["Profile"],
      name: "Byound",
      url: BADGE_PUBLIC_ORIGIN,
      email: "contact@byound.fr",
    },
    validFrom: input.issuedAt,
    credentialSubject: {
      type: ["AchievementSubject"],
      name: input.recipientName,
      identifier: [
        {
          type: "IdentityObject",
          identityHash: input.identityHash ?? hashBadgeEmail(input.recipientEmail, input.recipientSalt),
          identityType: "emailAddress",
          hashed: true,
          salt: input.recipientSalt,
        },
      ],
      achievement,
    },
    credentialStatus: {
      id: REVOCATION_STATUS_URL,
      type: "1EdTechRevocationList",
    },
  };

  if (input.validUntil) credential.validUntil = input.validUntil;
  if (evidence.length > 0) {
    credential.evidence = evidence.map((item) => ({
      type: ["Evidence"],
      ...(item.id ? { id: item.id } : {}),
      ...(item.name ? { name: item.name } : {}),
      ...(item.description ? { description: item.description } : {}),
      ...(item.genre ? { genre: item.genre } : {}),
      ...(item.narrative ? { narrative: item.narrative } : {}),
      ...(item.url ? { url: item.url } : {}),
    }));
  }

  return credential;
}
