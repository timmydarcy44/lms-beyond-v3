import { describe, expect, it } from "vitest";
import { formatEuro, normalizeMoneyText } from "@/lib/money/format-euro";

describe("formatEuro", () => {
  it("formate les milliers sans U+202F", () => {
    const a = formatEuro(249_000);
    const b = formatEuro(1_240_000);
    expect(a).toMatch(/2 490,00\s*€/);
    expect(b).toMatch(/12 400,00\s*€/);
    expect(a).not.toContain("\u202f");
    expect(a).not.toContain("\u00a0");
    expect(a).not.toContain("/");
  });

  it("normalizeMoneyText remplace les espaces fins", () => {
    expect(normalizeMoneyText("2\u202f490,00\u00a0€")).toBe("2 490,00 €");
  });
});
