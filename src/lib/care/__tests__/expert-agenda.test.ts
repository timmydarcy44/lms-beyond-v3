import { describe, expect, it } from "vitest";
import { expandCareRulesToAgendaSlots } from "../expert-agenda";
import { parisWallToUtc } from "../available-slots";

describe("expandCareRulesToAgendaSlots", () => {
  it("turns a Monday rule into a disponible block", () => {
    const slots = expandCareRulesToAgendaSlots({
      rules: [{ id: "r1", weekday: 1, startTime: "09:00", endTime: "12:00", format: "visio" }],
      exceptions: [],
      fromYmd: "2026-11-02",
      toYmd: "2026-11-02",
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].kind).toBe("disponible");
    expect(slots[0].startsAt).toBe(parisWallToUtc("2026-11-02", "09:00").toISOString());
    expect(slots[0].endsAt).toBe(parisWallToUtc("2026-11-02", "12:00").toISOString());
  });

  it("hides a rule covered by a closed day and shows indisponible", () => {
    const slots = expandCareRulesToAgendaSlots({
      rules: [{ id: "r1", weekday: 1, startTime: "09:00", endTime: "12:00", format: "visio" }],
      exceptions: [{ id: "e1", date: "2026-11-02", isClosed: true, startTime: null, endTime: null }],
      fromYmd: "2026-11-02",
      toYmd: "2026-11-02",
    });
    expect(slots.filter((item) => item.kind === "disponible")).toHaveLength(0);
    expect(slots.filter((item) => item.kind === "indisponible")).toHaveLength(1);
  });
});
