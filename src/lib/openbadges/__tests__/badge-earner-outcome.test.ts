import { describe, expect, it } from "vitest";
import { computeBadgeEarnerOutcome } from "@/lib/openbadges/badge-earner-outcome";
import type { BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";

const qcmConfig: BadgeMethodConfig = {
  methodId: "qcm",
  evaluationPrompt: "",
  quiz: {
    questions: [
      {
        id: "q1",
        prompt: "Q1",
        questionType: "single",
        choices: [
          { id: "a", label: "A", isCorrect: true },
          { id: "b", label: "B", isCorrect: false },
        ],
      },
    ],
  },
};

describe("computeBadgeEarnerOutcome", () => {
  it("awards when QCM is fully correct and integrity is clean", () => {
    const outcome = computeBadgeEarnerOutcome({
      badgeClassId: "badge-1",
      badgeName: "Test Badge",
      methodConfigs: [qcmConfig],
      submissions: [
        {
          methodResponses: [
            {
              methodId: "qcm",
              qcmAnswers: { q1: "a" },
            },
          ],
          integrityMetrics: { integrityFailed: false },
        },
      ],
    });
    expect(outcome.awarded).toBe(true);
    expect(outcome.headline).toBe("Badge obtenu");
  });

  it("does not award when QCM answer is wrong", () => {
    const outcome = computeBadgeEarnerOutcome({
      badgeClassId: "badge-1",
      badgeName: "Test Badge",
      methodConfigs: [qcmConfig],
      submissions: [
        {
          methodResponses: [
            {
              methodId: "qcm",
              qcmAnswers: { q1: "b" },
            },
          ],
          integrityMetrics: { integrityFailed: false },
        },
      ],
    });
    expect(outcome.awarded).toBe(false);
    expect(outcome.qcmScore).toEqual({ correct: 0, total: 1 });
  });

  it("awards when score meets custom passing threshold", () => {
    const configWithThreshold: BadgeMethodConfig = {
      ...qcmConfig,
      quiz: {
        ...qcmConfig.quiz!,
        questions: [
          ...Array.from({ length: 5 }, (_, i) => ({
            id: `q${i + 1}`,
            prompt: `Q${i + 1}`,
            questionType: "single" as const,
            choices: [
              { id: "a", label: "A", isCorrect: true },
              { id: "b", label: "B", isCorrect: false },
            ],
          })),
        ],
        passingScorePercent: 80,
      },
    };
    const answers = Object.fromEntries(
      ["q1", "q2", "q3", "q4", "q5"].map((id, i) => [id, i < 4 ? "a" : "b"]),
    );
    const outcome = computeBadgeEarnerOutcome({
      badgeClassId: "badge-1",
      badgeName: "Test Badge",
      methodConfigs: [configWithThreshold],
      submissions: [
        {
          methodResponses: [{ methodId: "qcm", qcmAnswers: answers }],
          integrityMetrics: { integrityFailed: false },
        },
      ],
    });
    expect(outcome.awarded).toBe(true);
    expect(outcome.qcmScore).toEqual({ correct: 4, total: 5 });
  });
});
