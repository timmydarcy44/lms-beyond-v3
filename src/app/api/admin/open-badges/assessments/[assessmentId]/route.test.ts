import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    assessment: {
      findUnique: vi.fn().mockResolvedValue({
        id: "assessment-1",
        status: "SUBMITTED",
        createdAt: new Date(),
        updatedAt: new Date(),
        badgeClass: {
          orgId: "org-2",
          id: "badge-1",
          name: "Badge",
          description: "Desc",
          imageUrl: null,
          imageTemplateUrl: "https://example.com/badge.png",
          criteriaMarkdown: "",
          criteriaUrl: null,
          issuer: { name: "Issuer", url: null, imageUrl: null },
          requiresEnrollment: false,
          requiredCourseId: null,
          receivability: null,
          criteria: [],
        },
        earner: { id: "earner-1", name: "Learner" },
        evidence: [],
        assertions: [],
      }),
    },
  },
}));

describe("GET /api/admin/open-badges/assessments/[assessmentId]", () => {
  it("returns 404 when assessment not in org", async () => {
    const request = new NextRequest("http://localhost", {
      headers: {
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "ADMIN",
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ assessmentId: "assessment-1" }),
    });

    expect(response.status).toBe(404);
  });
});
