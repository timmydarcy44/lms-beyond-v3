import { describe, expect, it } from "vitest";
import { clampGatePercent, moduleGateMessage, unmetGateForLesson, unmetGateForModule } from "@/lib/lms/module-gate";

const modules = [
  {
    lessons: [
      { id: "a", title: "Cours" },
      { id: "q1", title: "Quiz du module 1", quiz_id: "test-1", gate_next_module: true, gate_min_percent: 80 },
    ],
  },
  {
    lessons: [{ id: "b", title: "Suite" }],
  },
  {
    lessons: [{ id: "c", title: "Fin" }],
  },
];

describe("module gate", () => {
  it("garde 80 par défaut et borne le seuil", () => {
    expect(clampGatePercent(undefined)).toBe(80);
    expect(clampGatePercent(140)).toBe(100);
    expect(clampGatePercent(0)).toBe(1);
  });

  it("ferme le module suivant sous 80 et l’ouvre au seuil", () => {
    expect(unmetGateForModule(modules, 1, { "test-1": 70 })?.lessonId).toBe("q1");
    expect(unmetGateForModule(modules, 1, { "test-1": 80 })).toBeNull();
    expect(unmetGateForLesson(modules, "a", { "test-1": 0 })).toBeNull();
  });

  it("ne laisse pas sauter un module encore fermé", () => {
    const gate = unmetGateForModule(modules, 2, {});
    expect(gate?.testId).toBe("test-1");
    expect(moduleGateMessage(gate!)).toContain("80 %");
    expect(moduleGateMessage(gate!)).toContain("Quiz du module 1");
  });
});
