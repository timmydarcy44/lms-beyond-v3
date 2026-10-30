import { describe, expect, it } from "vitest";
import { buildAvailableSlots, parisWallToUtc } from "../available-slots";

describe("parisWallToUtc", () => {
  it("maps a winter morning in Paris to UTC+1", () => {
    expect(parisWallToUtc("2026-01-12", "09:00").toISOString()).toBe("2026-01-12T08:00:00.000Z");
  });
  it("maps a summer morning in Paris to UTC+2", () => {
    expect(parisWallToUtc("2026-07-06", "09:00").toISOString()).toBe("2026-07-06T07:00:00.000Z");
  });
});

describe("buildAvailableSlots", () => {
  const monday = "2026-11-02";
  const from = parisWallToUtc(monday, "00:00");
  const to = parisWallToUtc("2026-11-03", "00:00");
  const now = parisWallToUtc("2026-10-20", "08:00");

  it("splits a one-hour rule into duration_min slots", () => {
    const slots = buildAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "10:00", format: "visio" }],
      serviceFormats: ["visio"],
      durationMin: 30,
      from,
      to,
      now,
    });
    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
      parisWallToUtc(monday, "09:00").toISOString(),
      parisWallToUtc(monday, "09:30").toISOString(),
    ]);
  });

  it("hides a slot covered by a confirmed booking", () => {
    const slots = buildAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "10:00", format: "visio" }],
      bookings: [
        {
          startsAt: parisWallToUtc(monday, "09:00"),
          endsAt: parisWallToUtc(monday, "09:30"),
        },
      ],
      serviceFormats: ["visio"],
      durationMin: 30,
      from,
      to,
      now,
    });
    expect(slots).toHaveLength(1);
    expect(slots[0]?.startsAt.toISOString()).toBe(parisWallToUtc(monday, "09:30").toISOString());
  });

  it("keeps no slot starting in less than 2 hours", () => {
    const slots = buildAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "10:00", format: "visio" }],
      serviceFormats: ["visio"],
      durationMin: 30,
      from,
      to,
      now: parisWallToUtc(monday, "08:00"),
    });
    expect(slots).toEqual([]);
  });

  it("turns a one-off open exception into bookable slots without weekly rules", () => {
    const slots = buildAvailableSlots({
      rules: [],
      exceptions: [{ date: monday, isClosed: false, startTime: "14:00", endTime: "15:00" }],
      serviceFormats: ["visio"],
      durationMin: 60,
      from,
      to,
      now,
    });
    expect(slots).toHaveLength(1);
    expect(slots[0]?.startsAt.toISOString()).toBe(parisWallToUtc(monday, "14:00").toISOString());
  });
});
