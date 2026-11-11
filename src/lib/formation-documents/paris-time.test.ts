import { describe, expect, it } from "vitest";
import { addCivilDays, parisWallToUtc, formatParisLongDate } from "./paris-time";

describe("paris-time", () => {
  it("convertit 9h Paris (hiver) en UTC", () => {
    const d = parisWallToUtc("2026-11-09", 9, 0);
    expect(d.toISOString()).toBe("2026-11-09T08:00:00.000Z");
  });

  it("J-2 civil", () => {
    expect(addCivilDays("2026-11-09", -2)).toBe("2026-11-07");
  });

  it("formate la date longue FR", () => {
    expect(formatParisLongDate("2026-11-09")).toMatch(/lundi 9 novembre/i);
  });
});
