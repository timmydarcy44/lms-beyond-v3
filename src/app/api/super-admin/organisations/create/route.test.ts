import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  getServiceSupabase: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerClient: vi.fn(),
}));

const mockServiceClient = {
  from: vi.fn(),
};

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";

describe("POST /api/super-admin/organisations/create", () => {
  it("returns 403 if not super admin", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    const { getServiceSupabase } = await import("@/lib/supabase/service");
    (isSuperAdmin as any).mockResolvedValue(false);
    (getServiceSupabase as any).mockResolvedValue(mockServiceClient);

    const request = new NextRequest("http://localhost/api/super-admin/organisations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", slug: "test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});

