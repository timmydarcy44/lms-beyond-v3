import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    assertion: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("PATCH /api/admin/assertions/[assertionId]/revoke", () => {
  it("revokes assertion with reason when org matches", async () => {
    const prismaMock = (await import("@/lib/prisma")).prisma as any;
    prismaMock.assertion.findUnique.mockResolvedValueOnce({
      id: "assertion-1",
      revokedAt: null,
      badgeClass: { orgId: "org-1" },
    });
    prismaMock.assertion.update.mockResolvedValueOnce({
      id: "assertion-1",
      revokedAt: new Date("2024-01-01T00:00:00.000Z"),
      revocationReason: "Cheating",
    });

    const request = new NextRequest("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ reason: "Cheating" }),
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ assertionId: "assertion-1" }),
    });

    expect(response.status).toBe(200);
    expect(prismaMock.assertion.update).toHaveBeenCalled();
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.revocationReason).toBe("Cheating");
  });
});
