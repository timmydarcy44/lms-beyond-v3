import { describe, expect, it } from "vitest";
import {
  enrichMethodConfigsFromRaw,
  getQcmPassingScorePercent,
  parseMethodConfigs,
} from "@/lib/openbadges/badge-method-config";

describe("parseMethodConfigs", () => {
  it("preserves passingScorePercent on QCM quiz config", () => {
    const configs = parseMethodConfigs([
      {
        methodId: "qcm",
        evaluationPrompt: "",
        quiz: {
          passingScorePercent: 60,
          questions: [],
        },
      },
    ]);
    expect(configs).toHaveLength(1);
    expect(configs[0].quiz?.passingScorePercent).toBe(60);
    expect(getQcmPassingScorePercent(configs[0])).toBe(60);
  });

  it("coerces string passingScorePercent", () => {
    const configs = parseMethodConfigs([
      {
        methodId: "qcm",
        evaluationPrompt: "",
        quiz: { passingScorePercent: "60", questions: [] },
      },
    ]);
    expect(configs[0].quiz?.passingScorePercent).toBe(60);
  });

  it("enrichMethodConfigsFromRaw restores threshold from raw JSON", () => {
    const raw = [
      {
        methodId: "qcm",
        evaluationPrompt: "",
        quiz: { passingScorePercent: 60, questions: [{ id: "q1" }] },
      },
    ];
    const parsed = parseMethodConfigs([
      { methodId: "qcm", evaluationPrompt: "", quiz: { questions: [{ id: "q1" }] } },
    ]);
    const enriched = enrichMethodConfigsFromRaw(parsed, raw);
    expect(getQcmPassingScorePercent(enriched[0])).toBe(60);
  });
});
