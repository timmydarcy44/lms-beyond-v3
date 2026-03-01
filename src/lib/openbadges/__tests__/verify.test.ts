import { describe, expect, it, vi, afterEach } from "vitest";
import { verifyHostedAssertion } from "../verify";

describe("verifyHostedAssertion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok for a valid hosted assertion", async () => {
    const assertionUrl = "https://example.com/assertions/123";
    const payload = {
      "@context": "https://w3id.org/openbadges/v2",
      id: assertionUrl,
      badge: "https://example.com/badges/1",
      issuer: "https://example.com/issuers/1",
      recipient: { identity: "abc123", hashed: true },
      verification: { type: "hosted", url: assertionUrl },
    };

    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => payload,
    })) as unknown as typeof fetch);

    const result = await verifyHostedAssertion(assertionUrl);
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("returns reasons when required fields are missing", async () => {
    const assertionUrl = "https://example.com/assertions/456";
    const payload = {
      "@context": "https://w3id.org/openbadges/v2",
      id: "https://example.com/assertions/mismatch",
      recipient: { identity: "", hashed: false },
      verification: { type: "signed" },
    };

    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => payload,
    })) as unknown as typeof fetch);

    const result = await verifyHostedAssertion(assertionUrl);
    expect(result.ok).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("returns revoked when assertion is revoked", async () => {
    const assertionUrl = "https://example.com/assertions/789";
    const payload = {
      "@context": "https://w3id.org/openbadges/v2",
      id: assertionUrl,
      badge: "https://example.com/badges/1",
      issuer: "https://example.com/issuers/1",
      recipient: { identity: "sha256$abc123", hashed: true },
      verification: { type: "hosted", url: assertionUrl },
      revoked: true,
      revocationReason: "Cheating",
    };

    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => payload,
    })) as unknown as typeof fetch);

    const result = await verifyHostedAssertion(assertionUrl);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("REVOKED");
    expect(result.reasons).toContain("REVOCATION_REASON:Cheating");
  });

  it("optionally checks revocation list when enabled", async () => {
    const assertionUrl = "https://example.com/api/public/assertions/abc";
    const payload = {
      "@context": "https://w3id.org/openbadges/v2",
      id: assertionUrl,
      badge: "https://example.com/api/public/badgeclasses/b1",
      issuer: "https://example.com/api/public/issuers/i1",
      recipient: { identity: "sha256$abc123", hashed: true },
      verification: { type: "hosted", url: assertionUrl },
    };
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/api/public/organizations/org-1/revocations")) {
        return {
          ok: true,
          json: async () => ({
            revocations: [
              { assertionId: "abc", reason: "Admin revoked" },
            ],
          }),
        };
      }
      return {
        ok: true,
        json: async () => payload,
      };
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const result = await verifyHostedAssertion(assertionUrl, {
      checkRevocations: true,
      orgId: "org-1",
      baseUrl: "https://example.com",
    });

    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("REVOKED");
    expect(result.reasons).toContain("REVOCATION_REASON:Admin revoked");
  });
});
