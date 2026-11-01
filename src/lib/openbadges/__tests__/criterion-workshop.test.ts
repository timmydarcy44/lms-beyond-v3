import { describe, expect, it } from "vitest";
import { bindCriterionSource, formatSectionSource, presentationIsShort, proposeButtonState, workshopCriteria } from "@/lib/openbadges/criterion-workshop";

const solid = (label: string, source: string) => ({
  label,
  expectedOutcome: "La personne produit au moins deux éléments concrets que l'expert peut vérifier dans la copie rendue.",
  source,
});

describe("criterion workshop", () => {
  it("asks for a longer presentation under two sentences", () => {
    expect(presentationIsShort("Le badge atteste une pratique.")).toBe(true);
    expect(presentationIsShort("La personne observe un apprenant. Elle propose un plan. Elle mesure le progrès.")).toBe(false);
  });

  it("keeps four to six distinct criteria and names the section", () => {
    const result = workshopCriteria([
      solid("Repérer les signes d'un besoin", "Section 2 · L'attention"),
      solid("Repérer les signes concrets d'un besoin", "Section 2 · L'attention"),
      { label: "Comprendre l'attention", expectedOutcome: "Il comprend.", source: "Section 2 · L'attention" },
      { label: "Analyser et concevoir un plan", expectedOutcome: "La personne produit au moins deux actions que l'expert peut vérifier dans la copie.", source: "Section 7 · Byound Care" },
      solid("Analyser une difficulté cognitive", "Section 1 · Le cerveau qui apprend"),
      solid("Concevoir un plan d'accompagnement", "Section 7 · La méthode d'accompagnement"),
      solid("Mesurer les progrès observés", "Section 6 · Apprendre à apprendre"),
      solid("Orienter vers un autre professionnel", "Section 7 · La méthode d'accompagnement"),
    ]);
    expect(result.kept).toHaveLength(5);
    expect(result.kept.map((item) => item.label)).not.toContain("Comprendre l'attention");
    expect(result.kept.map((item) => item.label)).not.toContain("Analyser et concevoir un plan");
    expect(result.issues.some((issue) => issue.includes("recoupe"))).toBe(true);
    const withThreshold = workshopCriteria([
      { label: "Repérer au moins deux signes", expectedOutcome: "La personne produit au moins deux éléments concrets que l'expert peut vérifier dans la copie rendue.", source: "Section 2 · L'attention" },
    ]);
    expect(withThreshold.kept).toHaveLength(0);
    expect(formatSectionSource(2, "L'attention · 6 h")).toBe("Section 2 · L'attention");
  });

  it("shows the propose button only once the name and the attestation are filled", () => {
    expect(proposeButtonState({ name: "Attention", description: "", keptCount: 0 })).toBe("hidden");
    expect(proposeButtonState({ name: "", description: "Une phrase assez longue pour compter.", keptCount: 0 })).toBe("hidden");
    expect(proposeButtonState({ name: "Attention", description: "Une seule phrase assez longue.", keptCount: 0 })).toBe("short");
    expect(proposeButtonState({
      name: "Attention",
      description: "La personne observe un apprenant. Elle propose un plan. Elle mesure le progrès.",
      keptCount: 0,
    })).toBe("propose");
    expect(proposeButtonState({ name: "Attention", description: "Courte.", keptCount: 0, courseId: "course-1" })).toBe("propose");
    expect(proposeButtonState({ name: "Attention", description: "La personne observe un apprenant. Elle propose un plan concret.", keptCount: 2 })).toBe("more");
  });

  it("binds a criterion to its section or to the presentation sentence", () => {
    const sections = [
      { index: 2, title: "L'attention · 6 h" },
      { index: 7, title: "La méthode d'accompagnement Byound Care" },
    ];
    expect(bindCriterionSource("section 2, l'attention", { sections })).toBe("Section 2 · L'attention");
    const presentation = "La personne observe un apprenant en situation réelle. Elle propose un plan d'accompagnement adapté. Elle mesure ensuite le progrès visible.";
    expect(bindCriterionSource("proposer un plan d'accompagnement adapté au besoin", { presentation })).toBe("Elle propose un plan d'accompagnement adapté.");
  });
});
