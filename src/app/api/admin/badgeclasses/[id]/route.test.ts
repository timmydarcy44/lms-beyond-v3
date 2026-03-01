import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PUT } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: vi.fn().mockResolvedValue({ id: "org-1", name: "Org", slug: "org" }),
    },
    issuerProfile: {
      findFirst: vi.fn().mockResolvedValue({ id: "issuer-1" }),
      create: vi.fn().mockResolvedValue({ id: "issuer-1" }),
    },
    badgeClass: {
      findUnique: vi.fn().mockResolvedValue({ orgId: "org-1" }),
    },
    badgeCriteria: { deleteMany: vi.fn(), createMany: vi.fn() },
    badgeReceivability: { upsert: vi.fn() },
    $transaction: (fn: any) =>
      fn({
        badgeClass: {
          update: vi.fn().mockResolvedValue({ id: "badge-1" }),
        },
        badgeCriteria: { deleteMany: vi.fn(), createMany: vi.fn() },
        badgeReceivability: { upsert: vi.fn() },
      }),
  },
}));

describe("PUT /api/admin/badgeclasses/[id] validation", () => {
  it("rejects HUMAN->AI without aiEvaluationPrompt", async () => {
    const request = new NextRequest("http://localhost", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        receivabilityReviewMode: "AI",
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "" },
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: "badge-1" }) });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("AI_PROMPT_REQUIRED");
  });

  it("rejects HUMAN->MIXED without aiEvaluationPrompt", async () => {
    const request = new NextRequest("http://localhost", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        receivabilityReviewMode: "MIXED",
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "" },
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: "badge-1" }) });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("AI_PROMPT_REQUIRED");
  });

  it("allows AI with aiEvaluationPrompt", async () => {
    const request = new NextRequest("http://localhost", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        receivabilityReviewMode: "AI",
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "ok" },
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: "badge-1" }) });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
  });
});
