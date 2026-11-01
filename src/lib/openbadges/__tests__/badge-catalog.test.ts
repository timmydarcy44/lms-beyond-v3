import { describe, expect, it } from "vitest";
import { publishChecklist } from "@/lib/openbadges/badge-builder";
import {
  BYOUND_ALIGNMENT_TARGET_TYPE,
  competencyAlignments,
  competencyPageUrl,
  draftCompetenciesBlockPublish,
  dropCopiedQuestions,
  nextSeriesLevel,
  repairGeneratedBadge,
  seriesPrerequisite,
  suggestDomain,
} from "@/lib/openbadges/badge-catalog";

describe("badge catalog", () => {
  it("suggests a near domain before creating one", () => {
    const domains = [{ name: "Intelligence artificielle" }];
    expect(suggestDomain("intelligence artificielle", domains).exact?.name).toBe("Intelligence artificielle");
    expect(suggestDomain("Intelligence artificelle", domains).near?.name).toBe("Intelligence artificielle");
    expect(suggestDomain("Cuisine", domains)).toEqual({ exact: null, near: null });
  });

  it("rejects a quiz question copied from the course", () => {
    const source = "Quel est le premier geste pour cadrer un prompt efficace ?";
    const result = dropCopiedQuestions([
      { prompt: source },
      { prompt: "Quelle limite fixez-vous avant d'envoyer un prompt à un modèle ?" },
    ], [source]);
    expect(result.rejected).toHaveLength(1);
    expect(result.kept).toHaveLength(1);
  });

  it("proposes the next level and locks the previous one", () => {
    expect(nextSeriesLevel([1, 2, 3])).toBe(4);
    const previous = seriesPrerequisite("AI Prompting", 4, [
      { id: "a", name: "Prompt 3", seriesName: "AI Prompting", level: 3 },
      { id: "b", name: "Autre", seriesName: "Vente", level: 3 },
    ]);
    expect(previous?.id).toBe("a");
    expect(seriesPrerequisite("AI Prompting", 1, [])).toBeNull();
  });

  it("blocks publication while a competency is still a draft", () => {
    expect(draftCompetenciesBlockPublish([{ status: "draft" }])).toBe(true);
    const checks = publishChecklist({
      name: "Prompt",
      level: "4",
      description: "Atteste une compétence.",
      criteria: [{ label: "Cadrer", expectedOutcome: "Un prompt borné" }],
      competencies: [{ name: "Cadrage", status: "draft" }],
      methods: ["case_study"],
      instructionsComplete: true,
      questionsReviewed: true,
      deliverableCount: 1,
      uncoveredCount: 0,
      qcmOnlyCount: 0,
      hasExpert: true,
      hasDelay: true,
      hasImage: false,
    });
    expect(checks.find((item) => item.id === "competency-validation")?.ok).toBe(false);
    expect(checks.find((item) => item.id === "competency-validation")?.required).toBe(true);
  });

  it("covers every criterion, drops quiz deliverables and writes a real instruction", () => {
    const repaired = repairGeneratedBadge({
      name: "Neuroéducation",
      description: "Atteste une pratique.",
      level: 1,
      criteria: [
        { label: "Observer", description: "", expectedOutcome: "Un fait observé." },
        { label: "Ajuster", description: "", expectedOutcome: "Un geste ajusté." },
      ],
      competencies: [],
      methods: [{
        id: "qcm",
        criterionIndexes: [1],
        learnerPrompt: "Fondamentaux de la neuroéducation",
        deliverables: [{ title: "Quiz de connaissances", description: "", format: "text" }],
      }],
      questions: [],
    });
    const covered = new Set(repaired.methods.flatMap((method) => method.criterionIndexes));
    expect([...covered].sort()).toEqual([0, 1]);
    expect(repaired.methods.find((method) => method.id === "qcm")?.deliverables).toEqual([]);
    expect(repaired.methods.every((method) => method.learnerPrompt.length >= 80)).toBe(true);
  });

  it("points Open Badges 3.0 alignment at the Byound competency page", () => {
    const [alignment] = competencyAlignments([{ name: "Cadrage", slug: "cadrage", definition: "Borner une demande." }]);
    expect(alignment.targetType).toBe(BYOUND_ALIGNMENT_TARGET_TYPE);
    expect(alignment.targetType).toBe("CFItem");
    expect(alignment.targetUrl).toBe(competencyPageUrl("cadrage"));
    expect(alignment.targetUrl).toBe("https://www.byound.fr/competences/cadrage");
    expect(alignment.targetFramework).toBe("Référentiel de compétences Byound");
    const many = competencyAlignments([
      { name: "Observer", slug: "observer", definition: "Voir." },
      { name: "Concevoir", slug: "concevoir", definition: "Proposer." },
      { name: "Évaluer", slug: "evaluer", definition: "Mesurer." },
    ]);
    expect(many).toHaveLength(3);
    expect(many.map((item) => item.targetName)).toEqual(["Observer", "Concevoir", "Évaluer"]);
  });
});
