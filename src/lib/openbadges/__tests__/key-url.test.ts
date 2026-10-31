import { exportJWK, generateKeyPair } from "jose";
import { describe, expect, it } from "vitest";
import { buildOpenBadgeCredential } from "@/lib/openbadges/v3/credential";
import { hashBadgeEmail } from "@/lib/openbadges/v3/identity";
import { buildReissuedOpenBadgeCredential, preservedIdentityFromCredential } from "@/lib/openbadges/v3/reissue";
import {
  BADGE_KEY_URL,
  findPublicJwk,
  publicJwkFromPrivate,
  publishedJwk,
  signCredentialJwt,
  verifyCredentialJwt,
} from "@/lib/openbadges/v3/sign";

const EMAIL = "holder@example.com";

function sample() {
  return buildOpenBadgeCredential("class-1", {
    assertionId: "assertion-1",
    name: "Profil comportemental",
    description: "Atteste un profil croisé.",
    criteriaNarrative: "Profil complet.",
    recipientName: "Camille Martin",
    recipientEmail: EMAIL,
    recipientSalt: "salt-1",
    issuedAt: "2026-10-04T15:30:34.157Z",
    statusIndex: 0,
  });
}

describe("resolvable signing kid", () => {
  it("resolves the header kid to a public JWK", async () => {
    const { privateKey } = await generateKeyPair("ES256", { extractable: true });
    const privateJwk = await exportJWK(privateKey);
    const signed = await signCredentialJwt(sample(), { jwk: privateJwk, kid: BADGE_KEY_URL });
    const header = JSON.parse(Buffer.from(signed!.jwt.split(".")[0], "base64url").toString()) as { kid: string; alg: string; typ: string };
    expect(header).toMatchObject({ alg: "ES256", kid: BADGE_KEY_URL, typ: "vc+jwt" });

    const stored = publicJwkFromPrivate(privateJwk, "byound-es256-2026");
    const requested = new URL(header.kid).pathname.split("/").pop() ?? "";
    const found = findPublicJwk([stored], requested);
    const body = found ? publishedJwk(found) : null;
    expect(body).toEqual({
      kty: "EC",
      crv: "P-256",
      x: stored.x,
      y: stored.y,
      alg: "ES256",
      use: "sig",
      kid: BADGE_KEY_URL,
    });
    expect(body).not.toHaveProperty("d");
    await expect(verifyCredentialJwt(signed!.jwt, [stored])).resolves.toMatchObject({
      id: "https://www.byound.fr/badges/assertion-1",
    });
  });

  it("still verifies a credential signed with the short kid", async () => {
    const { privateKey } = await generateKeyPair("ES256", { extractable: true });
    const privateJwk = await exportJWK(privateKey);
    const signed = await signCredentialJwt(sample(), { jwk: privateJwk, kid: "byound-es256-2026" });
    const stored = publicJwkFromPrivate(privateJwk, BADGE_KEY_URL);
    await expect(verifyCredentialJwt(signed!.jwt, [stored])).resolves.toMatchObject({
      id: "https://www.byound.fr/badges/assertion-1",
    });
    expect(findPublicJwk([stored], "inconnu.json")).toBeNull();
  });

  it("keeps the id, date, hash and salt when the kid changes", () => {
    const original = sample();
    const preserved = preservedIdentityFromCredential(original);
    const reissued = buildReissuedOpenBadgeCredential("class-1", preserved, {
      name: "Profil comportemental",
      description: "Atteste un profil croisé.",
      statusIndex: 0,
    });
    const subject = reissued.credentialSubject as { identifier: Array<{ identityHash: string; salt: string }> };
    expect(reissued.id).toBe(original.id);
    expect(reissued.validFrom).toBe(original.validFrom);
    expect(subject.identifier[0]?.identityHash).toBe(hashBadgeEmail(EMAIL, "salt-1"));
    expect(subject.identifier[0]?.salt).toBe("salt-1");
  });
});
