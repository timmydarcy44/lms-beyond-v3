import { describe, expect, it } from "vitest";
import {
  ATTENDANCE_STEP_SECONDS,
  currentRoomCode,
  deriveSlotKey,
  hotpCode,
  hotpCounter,
  verifyRoomCode,
} from "@/lib/formation-attendance/token";

const MASTER = "test-master-secret-for-attendance";

describe("attendance rotating token", () => {
  const key = deriveSlotKey("slot-1", "nonce-abc", MASTER);

  it("dérive une clé stable pour le même slot+nonce", () => {
    const a = deriveSlotKey("slot-1", "nonce-abc", MASTER);
    const b = deriveSlotKey("slot-1", "nonce-abc", MASTER);
    expect(a.equals(b)).toBe(true);
    expect(deriveSlotKey("slot-2", "nonce-abc", MASTER).equals(a)).toBe(false);
  });

  it("produit un code 4 chiffres", () => {
    const { code, counter } = currentRoomCode(key, 1_700_000_000_000);
    expect(code).toMatch(/^\d{4}$/);
    expect(counter).toBe(hotpCounter(1_700_000_000_000));
    expect(hotpCode(key, counter)).toBe(code);
  });

  it("accepte la fenêtre courante", () => {
    const now = 1_700_000_000_000;
    const { code } = currentRoomCode(key, now);
    expect(verifyRoomCode(key, code, now)).toEqual({
      ok: true,
      counter: hotpCounter(now),
    });
  });

  it("accepte la fenêtre précédente", () => {
    const now = 1_700_000_000_000;
    const prevCounter = hotpCounter(now) - 1;
    const prevCode = hotpCode(key, prevCounter);
    expect(verifyRoomCode(key, prevCode, now)).toEqual({
      ok: true,
      counter: prevCounter,
    });
  });

  it("refuse une fenêtre trop ancienne (rejeu)", () => {
    const now = 1_700_000_000_000;
    const oldCounter = hotpCounter(now) - 2;
    const oldCode = hotpCode(key, oldCounter);
    expect(verifyRoomCode(key, oldCode, now).ok).toBe(false);
  });

  it("refuse un mauvais code", () => {
    expect(verifyRoomCode(key, "0000", 1_700_000_000_000).ok).toBe(false);
  });

  it("expire après ~20 s (compteur change)", () => {
    const t0 = 1_700_000_040_000; // aligned-ish
    const c0 = hotpCounter(t0);
    const later = t0 + ATTENDANCE_STEP_SECONDS * 1000 + 50;
    expect(hotpCounter(later)).toBeGreaterThan(c0);
  });
});
