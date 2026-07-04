import { describe, expect, it } from "vitest";

import { getCareerProfileBySlug } from "@/lib/career-profiles/career-profiles-data";
import { analyzeCareerFit } from "@/lib/career-profiles/career-profile-analysis";

const DISC_D_HIGH = { D: 85, I: 45, S: 30, C: 25 };

describe("analyzeCareerFit", () => {
  it("sépare hard skills et soft skills du métier", () => {
    const career = getCareerProfileBySlug("commercial-immobilier");
    expect(career).toBeDefined();

    const result = analyzeCareerFit({
      career: career!,
      discScores: DISC_D_HIGH,
    });

    expect(result.hardSkills.length).toBe(career!.key_skills.length);
    expect(result.softSkills.length).toBe(career!.soft_skills.length);
    expect(result.hardSkillsScore).toBeGreaterThan(0);
    expect(result.softSkillsScore).toBeNull();
    expect(result.softSkillsTestDone).toBe(false);
  });

  it("compare les soft skills avec les scores du test EDGE", () => {
    const career = getCareerProfileBySlug("commercial-immobilier");
    expect(career).toBeDefined();

    const result = analyzeCareerFit({
      career: career!,
      discScores: DISC_D_HIGH,
      softSkillsScores: {
        "Écoute active": 12,
        Persévérance: 11,
        "Gestion du stress": 9,
        "Communication interpersonnelle": 13,
        "Sens de l'organisation": 8,
      },
    });

    expect(result.softSkillsTestDone).toBe(true);
    expect(result.softSkillsScore).not.toBeNull();
    expect(result.softSkills.some((s) => s.skill === "écoute active" && s.status === "aligned")).toBe(true);
  });
});
