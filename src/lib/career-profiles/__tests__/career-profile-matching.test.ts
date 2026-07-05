import { describe, expect, it } from "vitest";
import { getCareerProfileBySlug } from "@/lib/career-profiles/career-profiles-data";
import { analyzeCareerMatching } from "@/lib/career-profiles/career-profile-matching";

const DISC_D_HIGH = { D: 85, I: 45, S: 30, C: 25 };

describe("analyzeCareerMatching", () => {
  it("classifie chaque compétence dans une seule colonne (4 buckets)", () => {
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
      ...result.consolidate,
      ...result.develop,
      ...result.unevaluated,
    ]);

    expect(allSkills.size).toBe(
      result.strengths.length +
        result.consolidate.length +
        result.develop.length +
        result.unevaluated.length,
    );

    const buckets = [
      result.strengths,
      result.consolidate,
      result.develop,
      result.unevaluated,
    ];
    for (let i = 0; i < buckets.length; i++) {
      for (let j = i + 1; j < buckets.length; j++) {
        for (const skill of buckets[i]) {
          expect(buckets[j]).not.toContain(skill);
        }
      }
    }
  });

  it("propose toujours des axes de consolidation sur un profil très fort", () => {
    const career = getCareerProfileBySlug("commercial-immobilier");
    expect(career).toBeDefined();

    const result = analyzeCareerMatching({
      career: career!,
      discScores: DISC_D_HIGH,
      softSkillsScores: {
        "Écoute active": 13,
        Persévérance: 12,
        "Communication interpersonnelle": 13,
        Proactivité: 12,
        Empathie: 12,
        "Gestion du stress": 11,
      },
      hardSkills: ["CRM", "Prospection"],
      skillsMetadata: { CRM: { level: "Expert" }, Prospection: { level: "Expert" } },
    });

    expect(result.consolidate.length + result.develop.length + result.unevaluated.length).toBeGreaterThan(0);
    expect(result.nextPriority).not.toBeNull();
  });
});
