import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("../../../../../lib/prisma", () => ({
  prisma: {
    assertion: {
      findUnique: vi.fn().mockResolvedValue({
        id: "assertion-1",
        badgeClassId: "badge-1",
        issuerId: "issuer-1",
        hostedUrl: null,
        issuedOn: new Date().toISOString(),
        expires: null,
        evidenceRefs: [],
        recipientSalt: "salt",
        revoked: false,
        revocationReason: null,
        badgeClass: { version: "1" },
        issuer: { id: "issuer-1" },
        earner: { email: "earner@example.com" },
      }),
    },
  },
}));

describe("GET /api/public/assertions/[assertionId]", () => {
  it("returns JSON-LD with correct content type", async () => {
    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ assertionId: "assertion-1" }),
    });

    expect(response.headers.get("Content-Type")).toBe("application/ld+json; charset=utf-8");
    const json = await response.json();
    expect(json["@context"]).toBe("https://w3id.org/openbadges/v2");
    expect(json.id).toContain("/api/public/assertions/");
  });

  it("includes revocation fields when revoked", async () => {
    const prismaMock = (await import("../../../../../lib/prisma")).prisma as any;
    prismaMock.assertion.findUnique.mockResolvedValueOnce({
      id: "assertion-2",
      badgeClassId: "badge-2",
      issuerId: "issuer-2",
      hostedUrl: null,
      issuedOn: new Date().toISOString(),
      expires: null,
      evidenceRefs: [],
      recipientSalt: "salt",
      revoked: true,
      revokedAt: new Date("2024-01-01T00:00:00.000Z"),
      revocationReason: "Policy violation",
      badgeClass: { version: "1" },
      issuer: { id: "issuer-2" },
      earner: { email: "earner@example.com" },
    });

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ assertionId: "assertion-2" }),
    });

    const json = await response.json();
    expect(json.revoked).toBe(true);
    expect(json.revokedAt).toBe("2024-01-01T00:00:00.000Z");
    expect(json.revocationReason).toBe("Policy violation");
  });
});
