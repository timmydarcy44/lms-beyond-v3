import { describe, expect, it } from "vitest";
import { bakePng, unbakePng } from "@/lib/openbadges/baking/png";
import { publicEvidenceItems } from "@/lib/openbadges/v3/public-badge";
import { encodeStatusList, isPublicBadgeVisible, statusBit } from "@/lib/openbadges/v3/status-list";
import { v2AssertionToV3Credential } from "@/lib/openbadges/v3/mappers";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("bitstring status list", () => {
  it("sets only the revoked indexes", () => {
    const encoded = encodeStatusList([0, 3]);
    expect(statusBit(encoded, 0)).toBe(true);
    expect(statusBit(encoded, 1)).toBe(false);
    expect(statusBit(encoded, 3)).toBe(true);
  });

  it("hides a private badge and keeps a public revoked badge visible", () => {
    expect(isPublicBadgeVisible(null)).toBe(false);
    expect(isPublicBadgeVisible({ is_public: false, revoked_at: null })).toBe(false);
    expect(isPublicBadgeVisible({ is_public: true, revoked_at: "2026-10-30T00:00:00Z" })).toBe(true);
  });
});

describe("baked badge", () => {
  it("writes the JWT into the openbadgecredential chunk", () => {
    const jwt = "header.payload.signature";
    const baked = bakePng(TINY_PNG, jwt);
    expect(unbakePng(baked)).toBe(jwt);
  });
});

describe("v2AssertionToV3Credential", () => {
  it("returns an Open Badges 3.0 credential instead of an empty document", () => {
    const credential = v2AssertionToV3Credential({
      "@context": "https://w3id.org/openbadges/v2",
      id: "assertion-1",
      type: "Assertion",
      recipient: { identity: "sha256$abc", type: "email", hashed: true, salt: "salt" },
      issuedOn: "2026-10-04T15:30:34.157Z",
      badge: "class-1",
      issuer: "https://www.byound.fr/issuers/byound",
      verification: { type: "hosted", url: "https://www.byound.fr/badges/assertion-1" },
      narrative: "Profil comportemental",
    });
    expect(credential.type).toEqual(["VerifiableCredential", "OpenBadgeCredential"]);
    expect(credential.id).toBe("https://www.byound.fr/badges/assertion-1");
    expect(JSON.stringify(credential)).not.toContain("holder@");
    expect(credential["@context"]).toContain("https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json");
  });
});

describe("public evidence", () => {
  it("keeps only the deliverables the holder marked public", () => {
    const items = publicEvidenceItems([
      { name: "Privé", public: false },
      { name: "Public", description: "Visible", url: "https://www.byound.fr/livrable", public: true },
    ]);
    expect(items).toEqual([
      { name: "Public", description: "Visible", url: "https://www.byound.fr/livrable" },
    ]);
  });
});
