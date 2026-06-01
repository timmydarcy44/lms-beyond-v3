import { describe, expect, it } from "vitest";
import { ANONYMITY_THRESHOLD, idmcZoneFromScore, stressSignalFromScore } from "@/lib/radar-equipe/constants";

describe("radar-equipe constants", () => {
  it("enforces anonymity threshold of 5", () => {
    expect(ANONYMITY_THRESHOLD).toBe(5);
  });

  it("maps IDMC zones", () => {
    expect(idmcZoneFromScore(75)).toBe("optimal");
    expect(idmcZoneFromScore(55)).toBe("attention");
    expect(idmcZoneFromScore(40)).toBe("rupture");
  });

  it("maps stress signals", () => {
    expect(stressSignalFromScore(20)).toBe("faible");
    expect(stressSignalFromScore(60)).toBe("eleve");
    expect(stressSignalFromScore(80)).toBe("critique");
  });
});
