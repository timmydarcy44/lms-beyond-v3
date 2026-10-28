import { describe, expect, it } from "vitest";
import { nextOpenDays, parisDateKey } from "../working-days";
import { hasCareText } from "../profile-format";

describe("nextOpenDays", () => {
  it("keeps the next four days that have slots, including weekends", () => {
    const slots = [
      "2026-10-30T08:00:00.000Z",
      "2026-10-31T08:00:00.000Z",
      "2026-11-02T08:00:00.000Z",
      "2026-11-03T08:00:00.000Z",
      "2026-11-04T08:00:00.000Z",
      "2026-11-05T08:00:00.000Z",
    ];
    expect(nextOpenDays(slots, 4)).toEqual(["2026-10-30", "2026-10-31", "2026-11-02", "2026-11-03"]);
    expect(parisDateKey("2026-10-31T08:00:00.000Z")).toBe("2026-10-31");
  });
});

describe("hasCareText", () => {
  it("treats blank strings as empty sections", () => {
    expect(hasCareText("  ")).toBe(false);
    expect(hasCareText("Bio réelle")).toBe(true);
  });
});
