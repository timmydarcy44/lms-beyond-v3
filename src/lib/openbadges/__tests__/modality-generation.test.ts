import { describe, expect, it } from "vitest";
import { quizAskedCount } from "@/lib/openbadges/badge-method-config";
import { modalityIssues, parseGeneratedModality } from "@/lib/openbadges/modality-generation";

const CASE = {
  context: "Léa, 34 ans, formatrice, prépare une session sur l'attention. Deux participants décrochent dès la troisième activité, et elle hésite entre raccourcir le déroulé ou changer de consigne.",
  learnerPrompt: "Lisez le dossier de Léa. Repérez ce qui explique le décrochage. Proposez ensuite un ajustement concret de la séance, en justifiant votre choix.",
  deliverable: { title: "Analyse et ajustement", description: "Un texte qui relie l'observation à une décision.", format: "text" },
};

describe("quizAskedCount", () => {
  const questions = Array.from({ length: 15 }, (_, index) => ({ id: String(index), prompt: "Q", choices: [] }));
  it("pose toute la banque tant que l'admin n'a pas réduit le tirage", () => {
    expect(quizAskedCount({ questionCount: 5, questions })).toBe(15);
  });
  it("respecte une limite choisie", () => {
    expect(quizAskedCount({ questionCount: 5, limitDraw: true, questions })).toBe(5);
  });
});

describe("parseGeneratedModality", () => {
  it("garde une étude de cas exploitable", () => {
    const parsed = parseGeneratedModality(CASE);
    expect(parsed?.learnerPrompt).toContain("Léa");
    expect(modalityIssues(parsed, "case_study")).toEqual([]);
  });

  it("signale une consigne trop courte", () => {
    const parsed = parseGeneratedModality({ ...CASE, learnerPrompt: "Répondez." });
    expect(modalityIssues(parsed, "case_study").join(" ")).toMatch(/deux phrases/);
  });

  it("accepte une seule question pour la vidéo", () => {
    const parsed = parseGeneratedModality({
      ...CASE,
      context: "",
      learnerPrompt: "Comment ajusteriez-vous l'atelier si deux élèves décrochent dès la troisième activité ?",
      deliverable: { title: "", description: "", format: "text" },
    });
    expect(modalityIssues(parsed, "video")).toEqual([]);
  });

  it("exige un personnage pour la mise en situation", () => {
    const parsed = parseGeneratedModality({ ...CASE, situation: { character: "", objective: "", moments: [] } });
    expect(modalityIssues(parsed, "playground", "situation").join(" ")).toMatch(/personnage/);
  });
});
