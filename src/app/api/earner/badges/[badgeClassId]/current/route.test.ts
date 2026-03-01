import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    assessment: {
      findFirst: mockFindFirst,
    },
  },
}));

describe("GET /api/earner/badges/[badgeClassId]/current", () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
  });

  it("returns note and evidences for NEEDS_INFO", async () => {
    mockFindFirst.mockResolvedValue({
      id: "assessment-1",
      status: "NEEDS_INFO",
      notes: "Compléter la preuve.",
      evidence: [
        {
          type: "URL",
          url: "https://example.com",
          title: "Lien",
          description: "Description",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ],
    });

    const request = new NextRequest("http://localhost", {
      headers: {
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "EARNER",
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ badgeClassId: "badge-1" }),
    });

    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.item.note).toBe("Compléter la preuve.");
    expect(json.item.evidences).toHaveLength(1);
  });
});
