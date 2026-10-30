import { generateKeyPair, exportJWK } from "jose";
import { describe, expect, it } from "vitest";
import { buildOpenBadgeCredential, OB_V3_CONTEXT, VC_V2_CONTEXT } from "@/lib/openbadges/v3/credential";
import { hashBadgeEmail } from "@/lib/openbadges/v3/identity";
import { resolveBadgeVerificationState } from "@/lib/openbadges/v3/public-badge";
import { publicJwkFromPrivate, signCredentialJwt, verifyCredentialJwt } from "@/lib/openbadges/v3/sign";

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

  it("signs and verifies with EdDSA", async () => {
    const { privateKey, publicKey } = await generateKeyPair("EdDSA", { crv: "Ed25519", extractable: true });
    const privateJwk = await exportJWK(privateKey);
    const kid = "byound-test";
    const credential = sampleCredential();
    const signed = await signCredentialJwt(credential, { jwk: privateJwk, kid });
    expect(signed?.jwt.split(".").length).toBe(3);
    const verified = await verifyCredentialJwt(signed!.jwt, publicJwkFromPrivate(privateJwk, kid));
    expect(verified.id).toBe(credential.id);
    const exportedPublic = await exportJWK(publicKey);
    expect(publicJwkFromPrivate(privateJwk, kid).x).toBe(exportedPublic.x);
    const publicJwk = publicJwkFromPrivate(privateJwk, kid);
    expect(publicJwk).not.toHaveProperty("d");
    expect(JSON.stringify(publicJwk)).not.toContain(String(privateJwk.d));

    const tamperedPayload = Buffer.from(JSON.stringify({ ...credential, name: "modifié" })).toString("base64url");
    const [header, , signature] = signed!.jwt.split(".");
    await expect(verifyCredentialJwt(`${header}.${tamperedPayload}.${signature}`, publicJwk)).rejects.toThrow();
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
