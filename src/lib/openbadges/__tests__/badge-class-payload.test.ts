import { describe, expect, it } from "vitest";
import { parseBadgeEvaluationConfig } from "@/lib/openbadges/badge-class-payload";

describe("parseBadgeEvaluationConfig", () => {
  it("accepts valid payload", () => {
    const result = parseBadgeEvaluationConfig({
      level: 2,
      evaluationMethods: ["video"],
      validatorExpertId: "expert-uuid",
      methodConfigs: [
        {
          methodId: "video",
          evaluationPrompt: "Analyser la démonstration orale et la clarté.",
        },
      ],
      receivability: { expectedModalities: "" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.level).toBe(2);
      expect(result.data.evaluationMethods).toEqual(["video"]);
      expect(result.data.expectedModalities).toContain("Vidéo");
    }
  });

  it("rejects missing methods", () => {
    const result = parseBadgeEvaluationConfig({
      level: 1,
      evaluationMethods: [],
      validatorExpertId: "x",
    });
    expect(result.ok).toBe(false);
  });
});
