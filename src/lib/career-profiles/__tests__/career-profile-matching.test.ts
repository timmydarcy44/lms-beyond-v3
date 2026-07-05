import { describe, expect, it } from "vitest";
import { getCareerProfileBySlug } from "@/lib/career-profiles/career-profiles-data";
import { analyzeCareerMatching } from "@/lib/career-profiles/career-profile-matching";

const DISC_D_HIGH = { D: 85, I: 45, S: 30, C: 25 };

describe("analyzeCareerMatching", () => {
  it("classifie chaque compétence dans une seule colonne", () => {
    const career = getCareerProfileBySlug("commercial-immobilier");
    expect(career).toBeDefined();

    const result = analyzeCareerMatching({
      career: career!,
      discScores: DISC_D_HIGH,
      softSkillsScores: {
        "Écoute active": 12,
        Persévérance: 5,
        "Communication interpersonnelle": 13,
        Proactivité: 4,
      },
      hardSkills: ["CRM"],
      skillsMetadata: { CRM: { level: "Expert" } },
    });

    const allSkills = new Set([
      ...result.strengths,
      ...result.gaps,
      ...result.unevaluated,
    ]);

    expect(allSkills.size).toBe(
      result.strengths.length + result.gaps.length + result.unevaluated.length,
    );

    for (const skill of result.strengths) {
      expect(result.gaps).not.toContain(skill);
      expect(result.unevaluated).not.toContain(skill);
    }
    for (const skill of result.gaps) {
      expect(result.strengths).not.toContain(skill);
      expect(result.unevaluated).not.toContain(skill);
    }
  });
});
