import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  getServiceSupabase: vi.fn(),
}));

const mockServiceClient = {
  from: vi.fn(),
  auth: {
    admin: {
      inviteUserByEmail: vi.fn(),
      createUser: vi.fn(),
    },
  },
};

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";

describe("POST /api/super-admin/organizations/create", () => {
  it("returns 403 if not super admin", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    const { getServiceSupabase } = await import("@/lib/supabase/service");
    (isSuperAdmin as any).mockResolvedValue(false);
    (getServiceSupabase as any).mockResolvedValue(mockServiceClient);

    const request = new NextRequest("http://localhost/api/super-admin/organizations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Org" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("returns 400 if name is missing", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    const { getServiceSupabase } = await import("@/lib/supabase/service");
    (isSuperAdmin as any).mockResolvedValue(true);
    (getServiceSupabase as any).mockResolvedValue(mockServiceClient);

    const request = new NextRequest("http://localhost/api/super-admin/organizations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("VALIDATION_ERROR");
  });

  it("returns 201 on success", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    const { getServiceSupabase } = await import("@/lib/supabase/service");
    (isSuperAdmin as any).mockResolvedValue(true);

    const maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null });
    const insert = vi.fn().mockReturnValue({
      select: () => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "org-1", name: "Test Org", slug: "test-org" },
          error: null,
        }),
      }),
    });

    (getServiceSupabase as any).mockResolvedValue({
      ...mockServiceClient,
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle,
          }),
        }),
        insert,
      })),
    });

    const request = new NextRequest("http://localhost/api/super-admin/organizations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Org" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.organization?.id).toBe("org-1");
  });

  it("returns 409 on slug conflict", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    const { getServiceSupabase } = await import("@/lib/supabase/service");
    (isSuperAdmin as any).mockResolvedValue(true);

    (getServiceSupabase as any).mockResolvedValue({
      ...mockServiceClient,
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "org-1" } }),
          }),
        }),
      })),
    });

    const request = new NextRequest("http://localhost/api/super-admin/organizations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Org", slug: "test-org" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.error).toBe("ORG_SLUG_TAKEN");
  });
});
