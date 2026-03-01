import { describe, expect, it, vi } from "vitest";
import { isSuperAdmin } from "./super-admin";

vi.mock("@/lib/supabase/server", () => ({
  getServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: false, error: { message: "missing function" } }),
  }),
  getServiceRoleClientOrFallback: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "bad request", code: "400" },
              status: 400,
            }),
          }),
        }),
      }),
    }),
  }),
}));

describe("isSuperAdmin", () => {
  it("returns false when supabase query errors", async () => {
    const result = await isSuperAdmin();
    expect(result).toBe(false);
  });
});
