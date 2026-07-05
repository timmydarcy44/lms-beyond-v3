import { describe, expect, it } from "vitest";
import {
  buildHardSkillRecord,
  computeHardSkillStats,
  levelToSelfAssessment,
  parseHardSkillPortfolio,
  resolveDisplayCategory,
} from "@/lib/hard-skills/hard-skills-portfolio";

describe("hard-skills-portfolio", () => {
  it("mappe niveau vers auto-évaluation", () => {
    expect(levelToSelfAssessment("Débutant")).toBe(1);
    expect(levelToSelfAssessment("Intermédiaire")).toBe(3);
    expect(levelToSelfAssessment("Confirmé")).toBe(4);
    expect(levelToSelfAssessment("Expert")).toBe(5);
  });

  it("résout catégorie affichage et stats", () => {
    expect(resolveDisplayCategory("Python", "Développement Technique")).toBe("Développement");
    expect(resolveDisplayCategory("Salesforce", "Vente & Négociation")).toBe("CRM");

    const records = parseHardSkillPortfolio(
      ["Python", "Excel"],
      {
        Python: { level: "Expert" },
        Excel: { level: "Confirmé" },
      },
    );
    const stats = computeHardSkillStats(records);
    expect(stats.total).toBe(2);
    expect(stats.byLevel.Expert).toBe(1);
    expect(stats.byLevel.Confirmé).toBe(1);

    const python = buildHardSkillRecord("Python", { level: "Expert", source: "catalog" });
    expect(python.proofLevel).toBe("declared");
    expect(python.selfAssessment).toBe(5);

    const justified = buildHardSkillRecord("Excel", {
      level: "Confirmé",
      proof: { type: "link", url: "https://example.com" },
    });
    expect(justified.proofLevel).toBe("justified");
  });
});
