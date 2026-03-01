import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  getServiceRoleClientOrFallback: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "course-1" }, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

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
      create: vi.fn(),
      update: vi.fn(),
    },
    badgeCriteria: { createMany: vi.fn() },
    badgeReceivability: { create: vi.fn() },
    $transaction: vi.fn((fn: any) =>
      fn({
        badgeClass: {
          create: vi.fn().mockResolvedValue({ id: "badge-1" }),
          update: vi.fn(),
        },
        badgeCriteria: { createMany: vi.fn() },
        badgeReceivability: { create: vi.fn() },
      }),
    ),
  },
}));

describe("POST /api/admin/badgeclasses validation", () => {
  it("rejects requiresEnrollment without requiredCourseId", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "y" },
        requiresEnrollment: true,
        requiredCourseId: null,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("REQUIRED_COURSE_ID");
  });

  it("rejects when org header is missing", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "y" },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("MISSING_ORG_ID");
  });

  it("rejects when org header/body mismatch", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
        "x-org-id": "org-1",
      },
      body: JSON.stringify({
        organizationId: "org-2",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "y" },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("ORG_MISMATCH");
  });

  it("returns VALIDATION_ERROR when required fields are missing", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
        "x-org-id": "org-1",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        description: "",
        criteria: [],
        receivability: { expectedModalities: "", aiEvaluationPrompt: "y" },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("VALIDATION_ERROR");
  });

  it("returns COURSE_NOT_FOUND when requiredCourseId is missing in db", async () => {
    const { getServiceRoleClientOrFallback } = await import("@/lib/supabase/server");
    (getServiceRoleClientOrFallback as any).mockResolvedValueOnce({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
        "x-org-id": "org-1",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "y" },
        requiresEnrollment: true,
        requiredCourseId: "course-404",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("COURSE_NOT_FOUND");
  });

  it("creates minimal issuer when missing", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.issuerProfile.findFirst as any).mockResolvedValueOnce(null);
    (prisma.organization.findUnique as any).mockResolvedValueOnce({
      id: "org-1",
      name: "Org",
      slug: "",
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
        "x-org-id": "org-1",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "y" },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(prisma.issuerProfile.create).toHaveBeenCalled();
  });

  it("reuses existing issuer when present", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.issuerProfile.findFirst as any).mockResolvedValueOnce({ id: "issuer-1" });
    (prisma.issuerProfile.create as any).mockClear();

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
        "x-org-id": "org-1",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "y" },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(prisma.issuerProfile.create).not.toHaveBeenCalled();
  });

  it("returns CONFLICT for Prisma P2002 errors", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.$transaction as any).mockImplementationOnce(() => {
      throw new PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "0",
        meta: { target: ["name", "orgId"] },
      });
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
        "x-org-id": "org-1",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "y" },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.error).toBe("CONFLICT");
    expect(json.code).toBe("P2002");
    expect(json.message).toBe("Un badge avec ce nom existe déjà pour cette organisation.");
    expect(json.field).toBe("name");
  });

  it("allows HUMAN without aiEvaluationPrompt", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "" },
        receivabilityReviewMode: "HUMAN",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
  });

  it("rejects AI without aiEvaluationPrompt", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "" },
        receivabilityReviewMode: "AI",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("AI_PROMPT_REQUIRED");
  });

  it("rejects MIXED without aiEvaluationPrompt", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "" },
        receivabilityReviewMode: "MIXED",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("AI_PROMPT_REQUIRED");
  });

  it("creates without issuerProfileId and resolves issuer", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.issuerProfile.findFirst as any).mockResolvedValue(null);
    (prisma.issuerProfile.create as any).mockResolvedValue({ id: "issuer-2" });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Badge",
        description: "Desc",
        imageUrl: "https://example.com/badge.png",
        criteria: [],
        receivability: { expectedModalities: "x", aiEvaluationPrompt: "ok" },
        receivabilityReviewMode: "AI",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
  });
});
