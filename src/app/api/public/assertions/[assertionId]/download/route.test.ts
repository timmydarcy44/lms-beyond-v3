import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    assertion: {
      findUnique: vi.fn().mockResolvedValue({
        hostedUrl: null,
        bakedImageUrl: "https://cdn.example.com/badges/b1.png",
      }),
    },
  },
}));

describe("GET /api/public/assertions/[assertionId]/download", () => {
  it("returns JSON payload when baked image is external", async () => {
    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ assertionId: "assertion-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.assertionUrl).toContain("/api/public/assertions/assertion-1");
    expect(json.bakedImageUrl).toBe("https://cdn.example.com/badges/b1.png");
  });
});
