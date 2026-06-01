import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const ORG_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const mockResolveAccess = vi.fn();
const mockIsSuperAdmin = vi.fn();
const mockFetchContext = vi.fn();
const mockRejectCrossOrg = vi.fn();
const mockGenerateChat = vi.fn();

vi.mock("@/lib/auth/super-admin", () => ({
  isSuperAdmin: () => mockIsSuperAdmin(),
}));

vi.mock("@/lib/entreprise/assistant-access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/entreprise/assistant-access")>();
  return {
    ...actual,
    resolveEntrepriseAssistantAccess: () => mockResolveAccess(),
    rejectsCrossOrganizationRequest: (msg: string, orgId: string) => mockRejectCrossOrg(msg, orgId),
  };
});

vi.mock("@/lib/entreprise/assistant-context", () => ({
  fetchEntrepriseAssistantContext: (orgId: string) => mockFetchContext(orgId),
  buildEntrepriseAssistantSystemPrompt: (orgId: string) => `PROMPT_${orgId}`,
}));

vi.mock("@/lib/ai/anthropic-messages", () => ({
  generateChatWithAnthropic: (...args: unknown[]) => mockGenerateChat(...args),
}));

describe("POST /api/dashboard/entreprise/assistant/chat", () => {
  beforeEach(() => {
    mockResolveAccess.mockReset();
    mockFetchContext.mockReset();
    mockRejectCrossOrg.mockReset();
    mockGenerateChat.mockReset();
    mockIsSuperAdmin.mockReset();
    mockRejectCrossOrg.mockReturnValue(false);
    mockGenerateChat.mockResolvedValue("OK");
  });

  it("bloque les super-admins avec redirect /super", async () => {
    mockResolveAccess.mockResolvedValue({
      ok: false,
      error: "Les super-admins utilisent l'assistant CRM sur /super",
      status: 403,
      redirect: "/super",
    });

    const { POST } = await import("./route");
    const res = await POST(
      new NextRequest("http://localhost/api/dashboard/entreprise/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Liste collaborateurs" }),
      }),
    );

    const json = (await res.json()) as { error?: string; redirect?: string };
    expect(res.status).toBe(403);
    expect(json.redirect).toBe("/super");
    expect(mockFetchContext).not.toHaveBeenCalled();
  });

  it("ne charge le contexte que pour l'org du profil", async () => {
    mockResolveAccess.mockResolvedValue({
      ok: true,
      userId: "user-a",
      organizationId: ORG_A,
    });
    mockFetchContext.mockResolvedValue({
      organization: { id: ORG_A, name: "Org A", onboarding_step: "active", edge_enterprise_tier: 3 },
      employeeCount: 1,
      employeesSample: [],
      diagnosticsActiveCount: 0,
      equipes: [],
      equipeAggregats: [],
      sessionsBctCount: 0,
    });

    const { POST } = await import("./route");
    await POST(
      new NextRequest("http://localhost/api/dashboard/entreprise/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Bonjour" }),
      }),
    );

    expect(mockFetchContext).toHaveBeenCalledWith(ORG_A);
  });
});
