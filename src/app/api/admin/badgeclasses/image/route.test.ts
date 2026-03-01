import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/storage/s3", () => ({
  uploadBuffer: vi.fn().mockResolvedValue("https://example.com/badge.png"),
}));

describe("POST /api/admin/badgeclasses/image", () => {
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
});
