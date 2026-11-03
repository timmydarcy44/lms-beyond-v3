import { describe, expect, it } from "vitest";

import { quizDatabaseId, sanitizeEditableQuizQuestions, toEditableQuizQuestions } from "./quiz-questions";

describe("questions de quiz éditables", () => {
  it("relit une question enregistrée par le générateur", () => {
    const [question] = toEditableQuizQuestions([
      {
        question: "Le sommeil consolide les apprentissages.",
        options: ["Vrai", "Faux"],
        correct: 0,
        explication: "La nuit fixe ce qui a été vu.",
        type: "vrai_faux",
      },
    ]);
    expect(question?.question).toBe("Le sommeil consolide les apprentissages.");
    expect(question?.options).toEqual(["Vrai", "Faux"]);
    expect(question?.correct).toBe(0);
  });

  it("relit aussi le format du lecteur", () => {
    const [question] = toEditableQuizQuestions([
      {
        title: "Quelle zone filtre l’attention ?",
        options: [
          { value: "0", label: "Le cortex préfrontal" },
          { value: "1", label: "Le cervelet" },
        ],
        correct_answer: 1,
        explanation: "Il trie ce qui mérite d’être gardé.",
      },
    ]);
    expect(question?.question).toBe("Quelle zone filtre l’attention ?");
    expect(question?.options[1]).toBe("Le cervelet");
    expect(question?.correct).toBe(1);
    expect(question?.explication).toBe("Il trie ce qui mérite d’être gardé.");
  });

  it("retrouve l’identifiant dans le lien du quiz", () => {
    expect(
      quizDatabaseId({
        content: '<p><a href="/quiz?testId=123e4567-e89b-12d3-a456-426614174000">Ouvrir</a></p>',
      }),
    ).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("refuse une liste vide", () => {
    expect(sanitizeEditableQuizQuestions([])).toBeNull();
  });
});
