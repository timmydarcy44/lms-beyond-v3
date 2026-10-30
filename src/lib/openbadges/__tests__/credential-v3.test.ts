import { generateKeyPair, exportJWK } from "jose";
import { describe, expect, it } from "vitest";
import { buildOpenBadgeCredential, OB_V3_CONTEXT, VC_V2_CONTEXT } from "@/lib/openbadges/v3/credential";
import { hashBadgeEmail } from "@/lib/openbadges/v3/identity";
import { badgeStatGridClass, PUBLIC_ASSERTION_COLUMNS, resolveBadgeVerificationState, visibleBadgeStatLabels } from "@/lib/openbadges/v3/public-badge";
import { buildReissuedOpenBadgeCredential, preservedIdentityFromCredential, publicCredentialJwt } from "@/lib/openbadges/v3/reissue";
import { publicJwkFromPrivate, publicJwksKeys, signCredentialJwt, verifyCredentialJwt } from "@/lib/openbadges/v3/sign";

const EMAIL = "holder@example.com";

function sampleCredential() {
  return buildOpenBadgeCredential("class-1", {
    assertionId: "assertion-1",
    name: "Profil comportemental",
    description: "Atteste un profil croisé.",
    achievementType: "Competency",
    criteriaNarrative: "Profil croisé complet — Compléter les parcours demandés.",
    recipientName: "Camille Martin",
    recipientEmail: EMAIL,
    recipientSalt: "salt-1",
    issuedAt: "2026-10-04T15:30:34.157Z",
    statusIndex: 0,
  });
}

describe("OpenBadgeCredential 3.0", () => {
  it("keeps the email out of the credential and hashes it", () => {
    const credential = sampleCredential();
    const serialized = JSON.stringify(credential);
    expect(serialized).not.toContain(EMAIL);
    expect(serialized).not.toMatch(/disc|idmc|soft skills|score/i);
    const subject = credential.credentialSubject as {
      name: string;
      identifier: Array<{ identityHash: string; hashed: boolean; salt: string }>;
    };
    expect(subject.name).toBe("Camille Martin");
    expect(subject.identifier[0]?.identityHash).toBe(hashBadgeEmail(EMAIL, "salt-1"));
    expect(subject.identifier[0]?.hashed).toBe(true);
    expect(subject.identifier[0]?.salt).toBe("salt-1");
    expect(credential["@context"]).toEqual([VC_V2_CONTEXT, OB_V3_CONTEXT]);
    expect(credential.type).toEqual(["VerifiableCredential", "OpenBadgeCredential"]);
    expect(credential.id).toBe("https://www.byound.fr/badges/assertion-1");
    const issuer = credential.issuer as { type: string[]; name: string };
    expect(issuer.type).toContain("Profile");
    expect(issuer.name).toBe("Byound");
    expect(credential.validFrom).toBe("2026-10-04T15:30:34.157Z");
    const achievement = subject.achievement as { criteria: { id: string }; name: string };
    expect(achievement.name).toBe("Profil comportemental");
    expect(achievement.criteria.id).toContain("/criteria");
    const status = credential.credentialStatus as { statusListIndex: number; statusPurpose: string };
    expect(status.statusPurpose).toBe("revocation");
    expect(status.statusListIndex).toBe(0);
    const emails = serialized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
    expect(emails).toEqual(["contact@byound.fr"]);
  });

  it("signs and verifies with ES256", async () => {
    const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
    const privateJwk = await exportJWK(privateKey);
    const kid = "byound-es256-2026";
    const credential = sampleCredential();
    const signed = await signCredentialJwt(credential, { jwk: privateJwk, kid });
    expect(signed?.jwt.split(".").length).toBe(3);
    const header = JSON.parse(Buffer.from(signed!.jwt.split(".")[0], "base64url").toString()) as {
      alg: string;
      kid: string;
      typ: string;
    };
    expect(header).toEqual({ alg: "ES256", kid, typ: "vc+jwt" });
    const publicJwk = publicJwkFromPrivate(privateJwk, kid);
    const verified = await verifyCredentialJwt(signed!.jwt, publicJwk);
    expect(verified.id).toBe(credential.id);
    const exportedPublic = await exportJWK(publicKey);
    expect(publicJwk.x).toBe(exportedPublic.x);
    expect(publicJwk.y).toBe(exportedPublic.y);
    expect(publicJwk).not.toHaveProperty("d");
    expect(JSON.stringify(publicJwksKeys([privateJwk, publicJwk]))).not.toContain(String(privateJwk.d));

    const tamperedPayload = Buffer.from(JSON.stringify({ ...credential, name: "modifié" })).toString("base64url");
    const [protectedHeader, , signature] = signed!.jwt.split(".");
    await expect(verifyCredentialJwt(`${protectedHeader}.${tamperedPayload}.${signature}`, publicJwk)).rejects.toThrow();
  });

  it("still verifies an EdDSA credential when that public key is present", async () => {
    const { privateKey } = await generateKeyPair("EdDSA", { crv: "Ed25519", extractable: true });
    const privateJwk = await exportJWK(privateKey);
    const kid = "byound-ed25519-2026";
    const signed = await signCredentialJwt(sampleCredential(), { jwk: privateJwk, kid });
    const header = JSON.parse(Buffer.from(signed!.jwt.split(".")[0], "base64url").toString()) as { alg: string };
    expect(header.alg).toBe("EdDSA");
    const verified = await verifyCredentialJwt(signed!.jwt, [publicJwkFromPrivate(privateJwk, kid)]);
    expect(verified.id).toBe("https://www.byound.fr/badges/assertion-1");
  });

  it("keeps an archived credential out of the public response", () => {
    expect(PUBLIC_ASSERTION_COLUMNS).not.toContain("superseded_credential_jwt");
    expect(publicCredentialJwt({
      credential_jwt: "current.es256.jwt",
      superseded_credential_jwt: "archived.eddsa.jwt",
    })).toBe("current.es256.jwt");
  });

  it("reissues without changing the id, the date, the hash or the salt", () => {
    const original = sampleCredential();
    const preserved = preservedIdentityFromCredential(original);
    const reissued = buildReissuedOpenBadgeCredential("class-1", preserved, {
      name: "Profil comportemental",
      description: "Validation du profil croisé DISC, IDMC et soft skills.",
      statusIndex: 0,
    });
    const subject = reissued.credentialSubject as {
      identifier: Array<{ identityHash: string; salt: string }>;
      achievement: { description: string };
    };
    expect(reissued.id).toBe(original.id);
    expect(reissued.validFrom).toBe(original.validFrom);
    expect(subject.identifier[0]?.identityHash).toBe(hashBadgeEmail(EMAIL, "salt-1"));
    expect(subject.identifier[0]?.salt).toBe("salt-1");
    expect(JSON.stringify(reissued)).not.toMatch(/\bscore\b|\d+\s*%/i);
    expect(String((reissued.credentialSubject as { achievement: { name: string } }).achievement.name)).toBe("Profil comportemental");
    expect(subject.achievement.description).not.toContain("EDGE");
  });
});

describe("badge verification state", () => {
  it("maps revocation, expiry and a bad signature to distinct statuses", () => {
    expect(resolveBadgeVerificationState({ signatureOk: false, revoked: false, expired: false })).toBe("invalid");
    expect(resolveBadgeVerificationState({ signatureOk: true, revoked: true, expired: false })).toBe("revoked");
    expect(resolveBadgeVerificationState({ signatureOk: true, revoked: false, expired: true })).toBe("expired");
    expect(resolveBadgeVerificationState({ signatureOk: true, revoked: false, expired: false })).toBe("verified");
  });
});

describe("public badge stats", () => {
  it("hides empty counters and fits the remaining cells", () => {
    const labels = visibleBadgeStatLabels({
      level: 1,
      criteriaCount: 5,
      evidenceCount: 0,
      hasExpiry: false,
    });
    expect(labels).toEqual(["Niveau", "Critères"]);
    expect(badgeStatGridClass(labels.length)).toBe("grid-cols-2");
    expect(badgeStatGridClass(3)).toBe("grid-cols-3");
  });
});
