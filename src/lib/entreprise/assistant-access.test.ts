import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetProfile = vi.fn();
const mockIsSuperAdmin = vi.fn();

vi.mock("@/lib/auth/profile", () => ({
  getCurrentProfileWithAccess: () => mockGetProfile(),
}));

vi.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: () => mockIsSuperAdmin(),
}));

describe("resolveEntrepriseAssistantAccess", () => {
  beforeEach(() => {
    mockGetProfile.mockReset();
    mockIsSuperAdmin.mockReset();
  });

  it("bloque les super-admins et propose /super", async () => {
    mockIsSuperAdmin.mockResolvedValue(true);
    mockGetProfile.mockResolvedValue({
      user: { id: "u1" },
      profile: { role: "admin", role_type: "admin_hr", company_id: "org-a" },
    });

    const { resolveEntrepriseAssistantAccess } = await import("@/lib/entreprise/assistant-access");
    const access = await resolveEntrepriseAssistantAccess();

    expect(access.ok).toBe(false);
    if (!access.ok) {
      expect(access.status).toBe(403);
      expect(access.redirect).toBe("/super");
    }
  });

  it("autorise admin_hr avec company_id", async () => {
    mockIsSuperAdmin.mockResolvedValue(false);
    mockGetProfile.mockResolvedValue({
      user: { id: "u2" },
      profile: { role: "admin_hr", role_type: null, company_id: "org-b" },
    });

    const { resolveEntrepriseAssistantAccess } = await import("@/lib/entreprise/assistant-access");
    const access = await resolveEntrepriseAssistantAccess();

    expect(access.ok).toBe(true);
    if (access.ok) {
      expect(access.organizationId).toBe("org-b");
    }
  });
});
