import { describe, expect, it } from "vitest";
import { publishChecklist } from "@/lib/openbadges/badge-builder";
import { buildCriteriaNarrative, criterionCoverage, prunePractices, qcmOnlyBlocksAward } from "@/lib/openbadges/criterion-coverage";
import { gradingPromptFromCriteria } from "@/lib/openbadges/grading-guard";

const criteria = ["c1", "c2", "c3", "c4", "c5"].map((id) => ({ id }));

describe("criterion coverage", () => {
  it("marks a criterion uncovered, qcm-only, or covered", () => {
    const rows = criterionCoverage(criteria, [
      { id: "case_study", criterionIds: ["c1", "c2", "c3"] },
      { id: "qcm", criterionIds: ["c3", "c4"] },
    ]);
    expect(rows.find((row) => row.id === "c1")?.tone).toBe("covered");
    expect(rows.find((row) => row.id === "c3")?.tone).toBe("covered");
    expect(rows.find((row) => row.id === "c4")?.tone).toBe("qcm");
    expect(rows.find((row) => row.id === "c5")?.tone).toBe("missing");
  });

  it("blocks publication while a criterion is uncovered", () => {
    const blocked = publishChecklist({
      name: "Prompt",
      level: "1",
      description: "Atteste une compétence.",
      criteria: [{ label: "Structurer", expectedOutcome: "Un prompt complet" }],
      competencies: [{ name: "Prompt", status: "validated" }],
      methods: ["qcm"],
      instructionsComplete: true,
      questionsReviewed: true,
      deliverableCount: 1,
      uncoveredCount: 1,
      qcmOnlyCount: 1,
      hasExpert: true,
      hasDelay: true,
      hasImage: false,
    });
    expect(blocked.find((item) => item.id === "coverage")?.ok).toBe(false);
    expect(blocked.find((item) => item.id === "coverage")?.required).toBe(true);
    expect(blocked.find((item) => item.id === "qcm-only")?.required).toBe(false);
    const open = publishChecklist({
      name: "Prompt",
      level: "1",
      description: "Atteste une compétence.",
      criteria: [{ label: "Structurer", expectedOutcome: "Un prompt complet" }],
      competencies: [{ name: "Prompt", status: "validated" }],
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
    expect(open.find((item) => item.id === "coverage")?.ok).toBe(true);
  });

  it("rebalances weights when a criterion is removed", () => {
    const result = prunePractices({
      case_study: {
        criteria: [
          { criterionId: "c1", weight: 50 },
          { criterionId: "c2", weight: 50 },
        ],
        deliverables: [],
      },
    }, ["c1"]);
    expect(result.practices.case_study.criteria).toEqual([{ criterionId: "c1", weight: 100 }]);
    expect(result.warnings[0]).toContain("recalculés");
  });

  it("writes a narrative that names only the linked criteria", () => {
    const narrative = buildCriteriaNarrative({
      criteria: [
        { label: "Structurer", expectedOutcome: "Rôle, contexte, tâche, format" },
        { label: "Adapter", expectedOutcome: "Le prompt change selon le public" },
      ],
      methods: [
        { id: "case_study", criterionLabels: ["Structurer", "Adapter"], detail: "" },
        { id: "qcm", criterionLabels: ["Structurer"], detail: "seuil 80 %" },
      ],
      passRule: "Règle de réussite : chaque épreuve doit être réussie.",
    });
    expect(narrative).toContain("étude de cas");
    expect(narrative).toContain("Structurer, Adapter");
    expect(narrative).toContain("questionnaire (seuil 80 %)");
    expect(narrative).toContain("Rôle, contexte, tâche, format");
    expect(narrative).toContain("chaque épreuve doit être réussie");
    expect(narrative).not.toContain("Ignorer");
  });

  it("asks for a practical exam only when that option is on", () => {
    const rows = criterionCoverage(criteria, [
      { id: "case_study", criterionIds: ["c1"] },
      { id: "qcm", criterionIds: ["c4"] },
    ]);
    expect(qcmOnlyBlocksAward(false, rows)).toBe(false);
    expect(qcmOnlyBlocksAward(true, rows)).toBe(true);
    expect(qcmOnlyBlocksAward(true, rows.filter((row) => row.tone !== "qcm"))).toBe(false);
  });

  it("builds a grading prompt from the checked criteria only", () => {
    const prompt = gradingPromptFromCriteria([
      { label: "Structurer", expectedOutcome: "Un plan", weight: 60 },
      { label: "Adapter", expectedOutcome: "Le public change", weight: 40 },
    ]);
    expect(prompt).toContain("Structurer (60 %)");
    expect(prompt).toContain("Adapter (40 %)");
    expect(prompt).not.toContain("Convaincre");
  });
});
