import { describe, expect, it } from "vitest";
import { computePunctuality } from "./punctuality";

describe("computePunctuality", () => {
  it("uses scheduled start when trainer opens early", () => {
    const r = computePunctuality({
      startsAt: "2026-11-07T09:00:00.000Z",
      openedAt: "2026-11-07T08:55:00.000Z",
      signedAt: "2026-11-07T09:04:00.000Z",
    });
    expect(r.punctualityRefAt.toISOString()).toBe("2026-11-07T09:00:00.000Z");
    expect(r.onTime).toBe(true);
    expect(r.minutesLate).toBe(0);
  });

  it("does not mark the room late when trainer opens after scheduled start", () => {
    const r = computePunctuality({
      startsAt: "2026-11-07T09:00:00.000Z",
      openedAt: "2026-11-07T09:15:00.000Z",
      signedAt: "2026-11-07T09:18:00.000Z",
    });
    expect(r.punctualityRefAt.toISOString()).toBe("2026-11-07T09:15:00.000Z");
    expect(r.onTime).toBe(true);
    expect(r.minutesLate).toBe(0);
    expect(r.minutesAfterScheduledStart).toBe(18);
  });

  it("counts learner lateness after grace from punctuality ref", () => {
    const r = computePunctuality({
      startsAt: "2026-11-07T09:00:00.000Z",
      openedAt: "2026-11-07T09:00:00.000Z",
      signedAt: "2026-11-07T09:35:00.000Z",
    });
    expect(r.onTime).toBe(false);
    expect(r.minutesLate).toBe(30);
    expect(r.minutesAfterScheduledStart).toBe(35);
  });
});
