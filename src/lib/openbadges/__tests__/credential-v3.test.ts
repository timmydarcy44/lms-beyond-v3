import { generateKeyPair, exportJWK } from "jose";
import { describe, expect, it } from "vitest";
import { buildOpenBadgeCredential } from "@/lib/openbadges/v3/credential";
import { hashBadgeEmail } from "@/lib/openbadges/v3/identity";
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
    expect(credential["@context"]).toEqual([
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ]);
    expect(credential.type).toEqual(["VerifiableCredential", "OpenBadgeCredential"]);
    expect(credential.id).toBe("https://www.byound.fr/badges/assertion-1");
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
    expect(JSON.stringify(publicJwkFromPrivate(privateJwk, kid))).not.toContain(String(privateJwk.d));
  });
});
