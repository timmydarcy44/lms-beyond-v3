import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    assessment: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "assessment-1",
          status: "APPROVED",
          updatedAt: new Date("2024-01-02T00:00:00.000Z"),
          badgeClass: {
            id: "badge-1",
            name: "Badge 1",
            imageUrl: "https://example.com/b1.png",
            imageTemplateUrl: "https://example.com/b1-template.png",
          },
          assertions: [
            { id: "assertion-1", hostedUrl: null },
          ],
        },
      ]),
    },
  },
}));

describe("GET /api/earner/badges/my", () => {
  it("returns downloadUrl when assertion exists", async () => {
    const request = new NextRequest("http://localhost", {
      headers: {
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "EARNER",
      },
    });
    const response = await GET(request);
    const json = await response.json();
    expect(json.items[0].downloadUrl).toContain("/api/public/assertions/assertion-1/download");
  });
});
