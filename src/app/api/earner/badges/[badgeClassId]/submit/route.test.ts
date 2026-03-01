import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const { mockFindUnique, mockFindFirst, mockUpdate, mockCreate, mockCreateMany } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn(),
  mockUpdate: vi.fn(),
  mockCreate: vi.fn(),
  mockCreateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    badgeClass: {
      findUnique: mockFindUnique,
    },
    assessment: {
      findFirst: mockFindFirst,
      update: mockUpdate,
      create: mockCreate,
    },
    evidence: {
      createMany: mockCreateMany,
    },
  },
}));

const mockIsEnrolled = vi.hoisted(() => vi.fn());
vi.mock("@/lib/openbadges/enrollment", () => ({
  isLearnerEnrolled: mockIsEnrolled,
}));

describe("POST /api/earner/badges/[badgeClassId]/submit", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockFindFirst.mockReset();
    mockUpdate.mockReset();
    mockCreate.mockReset();
    mockCreateMany.mockReset();
    mockIsEnrolled.mockReset();
    mockFindUnique.mockResolvedValue({
      id: "badge-1",
      orgId: "org-1",
      status: "ACTIVE",
      requiresEnrollment: true,
      requiredCourseId: "course-1",
    });
  });

  it("returns ENROLLMENT_REQUIRED when not enrolled", async () => {
    mockIsEnrolled.mockResolvedValue(false);
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "EARNER",
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request, {
      params: Promise.resolve({ badgeClassId: "badge-1" }),
    });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe("ENROLLMENT_REQUIRED");
  });

  it("resubmits when assessment is NEEDS_INFO", async () => {
    mockIsEnrolled.mockResolvedValue(true);
    mockFindFirst.mockResolvedValue({
      id: "assessment-1",
      status: "NEEDS_INFO",
    });
    mockUpdate.mockResolvedValue({
      id: "assessment-1",
      status: "SUBMITTED",
    });
    mockCreateMany.mockResolvedValue({ count: 1 });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "EARNER",
      },
      body: JSON.stringify({
        evidence: [{ type: "URL", url: "https://example.com" }],
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ badgeClassId: "badge-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.assessmentId).toBe("assessment-1");
  });
});
