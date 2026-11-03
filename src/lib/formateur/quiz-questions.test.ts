import { describe, expect, it } from "vitest";

import { sanitizeEditableQuizQuestions, toEditableQuizQuestions } from "./quiz-questions";

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

  it("refuse une liste vide", () => {
    expect(sanitizeEditableQuizQuestions([])).toBeNull();
  });
});
