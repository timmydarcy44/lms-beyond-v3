import type { AssertionLD } from "../v2/types";
import { BADGE_PUBLIC_ORIGIN, OB_V3_CONTEXT, VC_V2_CONTEXT } from "@/lib/openbadges/v3/credential";

/**
 * Traduit une assertion Open Badges 2.0 déjà hachée vers un OpenBadgeCredential 3.0.
 * L'émission Byound passe par issueOpenBadgeCredential, qui signe ce document.
 */
export function v2AssertionToV3Credential(assertion: AssertionLD): Record<string, unknown> {
  const id = assertion.id.startsWith("http")
    ? assertion.id
    : `${BADGE_PUBLIC_ORIGIN}/badges/${assertion.id}`;
  const achievementId = assertion.badge.startsWith("http")
    ? assertion.badge
    : `${BADGE_PUBLIC_ORIGIN}/badgeclasses/${assertion.badge}`;
  const name = assertion.narrative?.trim() || "Open Badge";

  return {
    "@context": [VC_V2_CONTEXT, OB_V3_CONTEXT],
    id,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name,
    issuer: {
      id: assertion.issuer.startsWith("http") ? assertion.issuer : `${BADGE_PUBLIC_ORIGIN}/issuers/byound`,
      type: ["Profile"],
      name: "Byound",
      url: BADGE_PUBLIC_ORIGIN,
      email: "contact@byound.fr",
    },
    validFrom: assertion.issuedOn,
    ...(assertion.expires ? { validUntil: assertion.expires } : {}),
    credentialSubject: {
      type: ["AchievementSubject"],
      identifier: [
        {
          type: "IdentityObject",
          identityHash: assertion.recipient.identity,
          identityType: assertion.recipient.type === "email" ? "emailAddress" : assertion.recipient.type,
          hashed: assertion.recipient.hashed,
          salt: assertion.recipient.salt,
        },
      ],
      achievement: {
        id: achievementId,
        type: ["Achievement"],
        achievementType: "Competency",
        name,
        description: assertion.narrative ?? "",
        criteria: { id: `${achievementId}/criteria`, narrative: assertion.narrative ?? "" },
      },
    },
  };
}
