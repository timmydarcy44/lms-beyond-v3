import { describe, expect, it } from "vitest";
import { judgeLeave } from "@/lib/openbadges/badge-assessment-integrity";

describe("judgeLeave", () => {
  it("note une sortie courte sans arrêter", () => {
    expect(judgeLeave({ durationMs: 800, shortLeavesUsed: 0 })).toBe("warn");
  });

  it("arrête à la deuxième sortie", () => {
    expect(judgeLeave({ durationMs: 400, shortLeavesUsed: 1 })).toBe("stop");
  });

  it("arrête une sortie plus longue que la tolérance", () => {
    expect(judgeLeave({ durationMs: 2500, shortLeavesUsed: 0 })).toBe("stop");
  });

  it("ne bloque pas la vidéo, l'oral ni le playground", () => {
    expect(judgeLeave({ durationMs: 9000, shortLeavesUsed: 2, enforce: false })).toBe("ok");
  });
});
