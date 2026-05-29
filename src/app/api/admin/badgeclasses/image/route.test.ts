import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const uploadBuffer = vi.fn().mockResolvedValue("https://example.com/badge.png");
const supabaseUpload = vi.fn().mockResolvedValue({ error: null });
const getPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: "https://supabase.example/storage/v1/object/public/public/openbadges/x.png" },
});

vi.mock("@/lib/storage/s3", () => ({
  uploadBuffer: (...args: unknown[]) => uploadBuffer(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServiceRoleClient: vi.fn(() => ({
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => supabaseUpload(...args),
        getPublicUrl: (...args: unknown[]) => getPublicUrl(...args),
      }),
    },
  })),
}));

describe("POST /api/admin/badgeclasses/image", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    uploadBuffer.mockClear();
    supabaseUpload.mockClear();
  });

  it("returns MISSING_ORG_ID when org header is missing", async () => {
    const form = new FormData();
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
      },
      body: form,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("MISSING_ORG_ID");
  });

  it("returns MISSING_FILE when no file is provided", async () => {
    const form = new FormData();
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
        "x-org-id": "org-1",
      },
      body: form,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("MISSING_FILE");
  });

  it("uploads to Supabase when S3 is not configured", async () => {
    vi.stubEnv("S3_BUCKET", "");
    const form = new FormData();
    const png = new File([new Uint8Array([137, 80, 78, 71])], "badge.png", { type: "image/png" });
    form.append("file", png);
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: {
        "x-user-id": "user-1",
        "x-user-role": "SUPER_ADMIN",
        "x-org-id": "org-1",
      },
      body: form,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.provider).toBe("supabase");
    expect(json.imageUrl).toContain("supabase.example");
    expect(supabaseUpload).toHaveBeenCalled();
    expect(uploadBuffer).not.toHaveBeenCalled();
  });
});
