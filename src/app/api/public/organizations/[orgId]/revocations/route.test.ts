import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    assertion: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "assertion-1",
          revokedAt: new Date("2024-01-01T00:00:00.000Z"),
          revocationReason: "Policy",
        },
      ]),
    },
  },
}));

describe("GET /api/public/organizations/[orgId]/revocations", () => {
  it("returns revocations without personal data and cache headers", async () => {
    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ orgId: "org-1" }),
    });

    expect(response.headers.get("Cache-Control")).toContain("s-maxage=300");
    const json = await response.json();
    expect(json.organizationId).toBe("org-1");
    expect(Array.isArray(json.revocations)).toBe(true);
    expect(json.revocations[0]).toEqual({
      assertionId: "assertion-1",
      revokedAt: "2024-01-01T00:00:00.000Z",
      reason: "Policy",
    });
    expect("recipient" in json.revocations[0]).toBe(false);
  });
});
