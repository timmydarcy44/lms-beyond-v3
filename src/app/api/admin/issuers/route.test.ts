import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    issuerProfile: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("GET /api/admin/issuers", () => {
  it("returns empty list with header orgId", async () => {
    const request = new NextRequest("http://localhost/api/admin/issuers", {
      headers: {
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.items).toEqual([]);
  });

  it("returns ORG_MISMATCH when header and query differ", async () => {
    const request = new NextRequest("http://localhost/api/admin/issuers?organizationId=org-2", {
      headers: {
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("ORG_MISMATCH");
  });

  it("returns MISSING_ORG_ID when org header and query are missing", async () => {
    const request = new NextRequest("http://localhost/api/admin/issuers", {
      headers: {
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("MISSING_ORG_ID");
  });

  it("returns empty list with query orgId only", async () => {
    const request = new NextRequest("http://localhost/api/admin/issuers?organizationId=org-1", {
      headers: {
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.items).toEqual([]);
  });
});

describe("POST /api/admin/issuers", () => {
  it("creates Beyond", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.issuerProfile.findFirst as any).mockResolvedValue(null);
    (prisma.issuerProfile.create as any).mockResolvedValue({ id: "issuer-1", name: "Beyond" });

    const request = new NextRequest("http://localhost/api/admin/issuers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Beyond",
        url: "https://www.beyond-noschool.fr",
        email: "certification@beyond-noschool.fr",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.item?.name ?? json.issuer?.name).toBe("Beyond");
  });

  it("is idempotent for same org+name", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.issuerProfile.findFirst as any).mockResolvedValue({ id: "issuer-1", name: "Beyond" });

    const request = new NextRequest("http://localhost/api/admin/issuers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        organizationId: "org-1",
        name: "Beyond",
        url: "https://www.beyond-noschool.fr",
        email: "certification@beyond-noschool.fr",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.item?.id ?? json.issuer?.id).toBe("issuer-1");
  });

  it("rejects header/body org mismatch", async () => {
    const request = new NextRequest("http://localhost/api/admin/issuers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
        "x-org-id": "org-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: JSON.stringify({
        organizationId: "org-2",
        name: "Beyond",
        url: "https://www.beyond-noschool.fr",
        email: "certification@beyond-noschool.fr",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("ORG_MISMATCH");
  });
});
