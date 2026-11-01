import { describe, expect, it } from "vitest";
import { assessGeneratedBadge } from "@/lib/openbadges/badge-quality";
import { buildCourseSource, htmlToMarkedText } from "@/lib/openbadges/course-source";
import type { GeneratedBadge } from "@/lib/openbadges/badge-catalog";

describe("course source", () => {
  it("keeps pedagogical objectives and labels callouts", () => {
    const text = htmlToMarkedText('<div class="bg-red-50"><p><strong>Définition :</strong> La neuroéducation relie cerveau et pédagogie.</p></div><iframe src="https://youtube.com/x"></iframe>');
    expect(text).toContain("[Définition] La neuroéducation relie cerveau et pédagogie.");
    expect(text).not.toContain("iframe");
    const source = buildCourseSource({
      title: "Fondamentaux",
      builder_snapshot: {
        general: { objectifs: ["Repérer les obstacles à l'attention dans une séance."], prerequisites: ["Avoir enseigné."] },
        sections: [{
          title: "L'attention · 6 h",
          chapters: [{
            title: "Obstacles",
            content: "",
            subchapters: [{ title: "Bruit", content: "<p>Le bruit coupe l'attention.</p>", interview_context: "Léa prépare une séance de 45 minutes.", interview_objectives: "Repérer deux obstacles." }],
          }],
        }],
      },
    });
    expect(source.objectives).toEqual(["Repérer les obstacles à l'attention dans une séance."]);
    expect(source.prerequisites).toEqual(["Avoir enseigné."]);
    expect(source.sections[0].text).toContain("# Section 1 · L'attention · 6 h");
    expect(source.sections[0].text).toContain("### Bruit");
    expect(source.sections[0].text).toContain("[Entretien expérientiel]");
    expect(source.interviews[0].objectives).toContain("Repérer");
  });
});

describe("badge quality", () => {
  it("rejects a vague criterion and a playground outside AI", () => {
    const badge = {
      name: "Attention",
      description: "La personne adapte une séance.",
      domain: "Neuroéducation",
      level: 2,
      criteria: [{ label: "Comprendre l'attention", description: "", expectedOutcome: "Il comprend.", sourceModule: "L'attention" }],
      competencies: [{ name: "Attention", definition: "Tenir une séance." }],
      methods: [{ id: "playground" as const, criterionIndexes: [0], learnerPrompt: "Discutez avec l'IA. Montrez votre raisonnement.", deliverables: [] }],
      questions: [],
    } satisfies GeneratedBadge;
    const issues = assessGeneratedBadge(badge, { minCriteria: 4, maxCriteria: 6, aiTopic: false, askedQuestions: 4 });
    expect(issues.some((issue) => issue.includes("interdit"))).toBe(true);
    expect(issues.some((issue) => issue.includes("seuil"))).toBe(true);
    expect(issues.some((issue) => issue.includes("15 mots"))).toBe(true);
    expect(issues.some((issue) => issue.includes("bac à sable"))).toBe(true);
    expect(issues.some((issue) => issue.includes("mise en pratique"))).toBe(true);
  });
});
