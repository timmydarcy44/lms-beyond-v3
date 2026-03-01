import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const { mockFindUnique, mockUpdate, mockIssueBadge } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockIssueBadge: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    assessment: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

vi.mock("@/lib/openbadges/issue", () => ({
  issueBadge: mockIssueBadge,
}));

describe("POST /api/admin/open-badges/assessments/[assessmentId]/decision", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockIssueBadge.mockReset();
  });

  it("updates NEEDS_INFO with note", async () => {
    mockFindUnique.mockResolvedValue({
      id: "assessment-1",
      status: "SUBMITTED",
      badgeClass: { orgId: "org-1" },
      assertions: [],
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "ADMIN",
      },
      body: JSON.stringify({ status: "NEEDS_INFO", note: "Compléter la preuve." }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ assessmentId: "assessment-1" }),
    });
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.status).toBe("NEEDS_INFO");
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("approves and issues badge", async () => {
    mockFindUnique.mockResolvedValue({
      id: "assessment-1",
      status: "SUBMITTED",
      badgeClass: { orgId: "org-1" },
      assertions: [],
    });
    mockIssueBadge.mockResolvedValue({
      assertionId: "assertion-1",
      hostedUrl: "http://localhost:3000/api/public/assertions/assertion-1",
      bakedImageUrl: "http://localhost:3000/badges/assertion-1.png",
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "ADMIN",
      },
      body: JSON.stringify({ status: "APPROVED", note: "" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ assessmentId: "assessment-1" }),
    });
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.status).toBe("ISSUED");
    expect(json.assertionId).toBe("assertion-1");
    expect(json.downloadUrl).toContain("/api/public/assertions/assertion-1/download");
  });

  it("returns 404 for cross-org", async () => {
    mockFindUnique.mockResolvedValue({
      id: "assessment-1",
      status: "SUBMITTED",
      badgeClass: { orgId: "org-2" },
      assertions: [],
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "ADMIN",
      },
      body: JSON.stringify({ status: "REJECTED", note: "Non conforme." }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ assessmentId: "assessment-1" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 409 when already issued", async () => {
    mockFindUnique.mockResolvedValue({
      id: "assessment-1",
      status: "APPROVED",
      badgeClass: { orgId: "org-1" },
      assertions: [{ id: "assertion-1" }],
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "ADMIN",
      },
      body: JSON.stringify({ status: "REJECTED", note: "Test" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ assessmentId: "assessment-1" }),
    });
    expect(response.status).toBe(409);
  });
});
