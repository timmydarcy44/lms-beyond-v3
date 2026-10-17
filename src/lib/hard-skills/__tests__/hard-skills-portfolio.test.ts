import { describe, expect, it } from "vitest";
import {
  buildHardSkillRecord,
  computeHardSkillStats,
  getSkillDeclarationStatus,
  levelToSelfAssessment,
  listCatalogEntries,
  mergeDeclaredPortfolio,
  parseHardSkillPortfolio,
  resolveDisplayCategory,
  searchCatalogEntries,
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

  it("statut déclaration sans faux prouvée ni badge imaginaire", () => {
    expect(getSkillDeclarationStatus(undefined).label).toBe("Déclarée");
    expect(
      getSkillDeclarationStatus({ proof: { type: "document", note: "Fichier : note.pdf" } }).label,
    ).toBe("Preuve déposée");
    expect(getSkillDeclarationStatus({ proofLevel: "justified" }, { badgeEarned: true }).label).toBe("Badge obtenu");
  });

  it("fusionne les doublons en gardant le niveau le plus haut et les preuves", () => {
    const merged = mergeDeclaredPortfolio(
      ["Cold Calling", "Prospection téléphonique"],
      {
        "Cold Calling": {
          level: "Confirmé",
          proof: { type: "document", note: "Script" },
        },
        "Prospection téléphonique": {
          level: "Intermédiaire",
          proofs: [
            {
              id: "p2",
              type: "link",
              title: "Appels",
              url: "https://example.com/appels",
              createdAt: "2026-01-02T00:00:00.000Z",
            },
          ],
        },
      },
    );
    expect(merged.names).toEqual(["Prospection téléphonique"]);
    expect(merged.meta["Prospection téléphonique"]?.level).toBe("Confirmé");
    expect(merged.proofsBefore).toBe(2);
    expect(merged.proofsAfter).toBe(2);
    expect(merged.meta["Prospection téléphonique"]?.legacySnapshots?.["Cold Calling"]).toBeTruthy();
  });

  it("retire le scraping du catalogue public et retrouve un alias", () => {
    expect(listCatalogEntries().some((entry) => entry.name.toLowerCase().includes("phantombuster"))).toBe(false);
    expect(searchCatalogEntries("cold calling").some((entry) => entry.name === "Prospection téléphonique")).toBe(true);
    expect(searchCatalogEntries("fomo").some((entry) => entry.name === "Créer une urgence légitime")).toBe(true);
  });
});
