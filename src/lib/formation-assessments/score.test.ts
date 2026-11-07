import { describe, expect, it } from "vitest";
import { scoreAssessmentAnswers } from "@/lib/formation-assessments/score";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";

const questions: AssessmentQuestion[] = [
  { id: "s", prompt: "Scale", type: "scale", min: 1, max: 5 },
  {
    id: "c",
    prompt: "Choice",
    type: "single",
    options: ["Jamais", "Parfois", "Souvent"],
  },
  { id: "t", prompt: "Text", type: "text" },
];

describe("scoreAssessmentAnswers", () => {
  it("ignore le texte et normalise échelle + choix", () => {
    const score = scoreAssessmentAnswers(questions, {
      s: 5,
      c: "Souvent",
      t: "libre",
    });
    // scale: (5-1)/(5-1)=1 ; single: 2/2=1 → 100
    expect(score).toBe(100);
  });

  it("retourne null sans réponses scorable", () => {
    expect(scoreAssessmentAnswers(questions, { t: "only text" })).toBeNull();
  });
});
