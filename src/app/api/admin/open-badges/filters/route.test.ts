import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const { mockBadgeFindMany, mockUserFindMany } = vi.hoisted(() => ({
  mockBadgeFindMany: vi.fn(),
  mockUserFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    badgeClass: {
      findMany: mockBadgeFindMany,
    },
    user: {
      findMany: mockUserFindMany,
    },
  },
}));

describe("GET /api/admin/open-badges/filters", () => {
  beforeEach(() => {
    mockBadgeFindMany.mockReset();
    mockUserFindMany.mockReset();
    mockBadgeFindMany.mockResolvedValue([]);
    mockUserFindMany.mockResolvedValue([]);
  });

  it("scopes to orgId", async () => {
    const request = new NextRequest("http://localhost", {
      headers: {
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "ADMIN",
      },
    });

    await GET(request);
    const prismaMock = (await import("@/lib/prisma")).prisma as any;
    const badgeArgs = prismaMock.badgeClass.findMany.mock.calls[0][0];
    const userArgs = prismaMock.user.findMany.mock.calls[0][0];
    expect(badgeArgs.where.orgId).toBe("org-1");
    expect(userArgs.where.orgId).toBe("org-1");
    expect(userArgs.where.role).toBe("EARNER");
  });
});
