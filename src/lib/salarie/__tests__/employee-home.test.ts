import { describe, expect, it } from "vitest";
import { JADE_SOFT_SKILLS_RADAR } from "@/lib/demo/jade-dashboard-mocks";
import { resolveEmployeeNextStep } from "@/lib/salarie/employee-next-step";
import {
  softSkillMasteryPercent,
  softSkillPercentsAreFlat,
} from "@/lib/soft-skills/resolve-soft-skills-result";

function oldPercent(score: number) {
  return Math.min(100, Math.round((score / 15) * 100));
}

describe("soft skills percent scale", () => {
  it("ne plaque plus 100 % sur des scores deja en pourcentage", () => {
    const raw = JADE_SOFT_SKILLS_RADAR.map((row) => row.score);
    const before = raw.map(oldPercent);
    const after = raw.map((score) => softSkillMasteryPercent(score));
    expect(before.every((value) => value === 100)).toBe(true);
    expect(new Set(after).size).toBeGreaterThan(1);
    expect(after[0]).toBe(58);
    expect(after[1]).toBe(65);
    expect(softSkillPercentsAreFlat(after)).toBe(false);
  });

  it("garde l'echelle /15 pour un vrai test", () => {
    expect(softSkillMasteryPercent(12)).toBe(80);
    expect(softSkillMasteryPercent(15)).toBe(100);
    expect(softSkillPercentsAreFlat([15, 15, 15])).toBe(true);
  });
});

describe("resolveEmployeeNextStep", () => {
  const bilan = { name: "DISC", href: "/dashboard/salarie/test-disc", questionCount: 24 };
  const formation = { title: "CCP1", href: "/cours/ccp1", nextLeafTitle: "1.3.1", complete: false };
  const upcoming = { title: "Coaching individuel", dateLabel: "24 octobre", href: null };

  it("cas 1 bilan avant la formation", () => {
    expect(resolveEmployeeNextStep({ pendingBilan: bilan, formation, upcoming }).kind).toBe("bilan");
  });

  it("cas 2 formation en cours", () => {
    const step = resolveEmployeeNextStep({ pendingBilan: null, formation, upcoming });
    expect(step.kind).toBe("formation");
    expect(step.title).toContain("CCP1");
  });

  it("cas 3 coaching planifie", () => {
    expect(
      resolveEmployeeNextStep({
        pendingBilan: null,
        formation: { ...formation, complete: true },
        upcoming,
      }).kind,
    ).toBe("coaching");
  });

  it("cas 4 rien de prevu", () => {
    expect(
      resolveEmployeeNextStep({ pendingBilan: null, formation: null, upcoming: null }).kind,
    ).toBe("empty");
  });
});
