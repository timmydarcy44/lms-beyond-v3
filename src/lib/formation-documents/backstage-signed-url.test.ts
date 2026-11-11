import { describe, expect, it } from "vitest";
import {
  createBackstageSignedUrl,
  verifyBackstageToken,
} from "./backstage-signed-url";

describe("backstage-signed-url", () => {
  it("signe et vérifie un lien émargement", () => {
    const url = createBackstageSignedUrl({
      kind: "emarger",
      slotId: "slot-1",
      dossierId: "dos-1",
      expiresAtMs: Date.now() + 60_000,
    });
    const u = new URL(url);
    const bt = u.searchParams.get("bt")!;
    const sig = u.searchParams.get("sig")!;
    const verified = verifyBackstageToken(bt, sig);
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.payload.k).toBe("emarger");
      expect(verified.payload.slot).toBe("slot-1");
    }
  });

  it("refuse un jeton expiré", () => {
    const url = createBackstageSignedUrl({
      kind: "participants",
      dossierId: "dos-1",
      expiresAtMs: Date.now() - 1000,
    });
    const u = new URL(url);
    const verified = verifyBackstageToken(
      u.searchParams.get("bt")!,
      u.searchParams.get("sig")!,
    );
    expect(verified.ok).toBe(false);
  });
});
