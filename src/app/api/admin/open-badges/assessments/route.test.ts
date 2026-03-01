import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const { mockFindMany, mockCount } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    assessment: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

describe("GET /api/admin/open-badges/assessments", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockReset();
    mockCount.mockResolvedValue(0);
  });

  it("scopes to orgId from headers", async () => {
    const request = new NextRequest("http://localhost", {
      headers: {
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "ADMIN",
      },
    });
    await GET(request);
    const prismaMock = (await import("@/lib/prisma")).prisma as any;
    expect(prismaMock.assessment.findMany).toHaveBeenCalled();
    const args = prismaMock.assessment.findMany.mock.calls[0][0];
    expect(args.where.badgeClass.orgId).toBe("org-1");
  });

  it("filters by badgeClassId and q", async () => {
    const request = new NextRequest(
      "http://localhost?badgeClassId=badge-1&q=marketing",
      {
        headers: {
          "x-user-id": "user-1",
          "x-org-id": "org-1",
          "x-user-role": "ADMIN",
        },
      },
    );
    await GET(request);
    const prismaMock = (await import("@/lib/prisma")).prisma as any;
    const args = prismaMock.assessment.findMany.mock.calls[0][0];
    expect(args.where.badgeClassId).toBe("badge-1");
    expect(args.where.OR).toHaveLength(2);
  });

  it("returns nextCursor when more results exist", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "a1",
        status: "SUBMITTED",
        createdAt: new Date(),
        updatedAt: new Date(),
        badgeClass: { id: "b1", name: "Badge", imageUrl: null, imageTemplateUrl: null },
        earner: { id: "e1", name: "User" },
        assertions: [],
        _count: { evidence: 0 },
      },
      {
        id: "a2",
        status: "SUBMITTED",
        createdAt: new Date(),
        updatedAt: new Date(),
        badgeClass: { id: "b1", name: "Badge", imageUrl: null, imageTemplateUrl: null },
        earner: { id: "e1", name: "User" },
        assertions: [],
        _count: { evidence: 0 },
      },
    ]);

    const request = new NextRequest("http://localhost?limit=1", {
      headers: {
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "ADMIN",
      },
    });
    const response = await GET(request);
    const json = await response.json();
    expect(json.nextCursor).toBe("a1");
    expect(json.items).toHaveLength(1);
  });

  it("returns totalCount when includeTotal is true", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(42);

    const request = new NextRequest("http://localhost?includeTotal=true", {
      headers: {
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "ADMIN",
      },
    });

    const response = await GET(request);
    const json = await response.json();
    expect(json.totalCount).toBe(42);
  });

  it("does not include totalCount when includeTotal is false", async () => {
    const request = new NextRequest("http://localhost", {
      headers: {
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "ADMIN",
      },
    });

    const response = await GET(request);
    const json = await response.json();
    expect(json.totalCount).toBeUndefined();
  });
});
