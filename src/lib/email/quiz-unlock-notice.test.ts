import { describe, expect, it } from "vitest";
import { quizUnlockSentence } from "@/lib/email/quiz-unlock-notice";

describe("quiz unlock email", () => {
  it("annonce le score et le module ouvert", () => {
    expect(quizUnlockSentence(80, "Neuroéducation")).toBe(
      "Bravo, votre score au quiz est de 80%, votre accès pour le module Neuroéducation est ouvert.",
    );
  });

  it("arrondit le score", () => {
    expect(quizUnlockSentence(79.6, "Module 2")).toContain("80%");
  });
});
