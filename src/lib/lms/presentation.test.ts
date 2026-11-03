import { describe, expect, it } from "vitest";
import {
  cleanGameTitle,
  explicitQuestionImage,
  goalCount,
  resultHeadline,
} from "./presentation";

describe("présentation LMS", () => {
  it("n’affiche pas un titre de jeu générique", () => {
    expect(cleanGameTitle("Jeu interactif", "Les fonctions exécutives")).toBe("Les fonctions exécutives");
    expect(cleanGameTitle("Une matinée avec Léo", "Chapitre")).toBe("Une matinée avec Léo");
    expect(cleanGameTitle("", "")).toBe("Mise en pratique");
  });

  it("choisit le message selon le ratio, sans pourcentage", () => {
    expect(resultHeadline(8, 10)).toBe("Très bonne maîtrise !");
    expect(resultHeadline(10, 10)).toBe("Très bonne maîtrise !");
    expect(resultHeadline(7, 10)).toBe("Bien joué");
    expect(resultHeadline(6, 10)).toBe("Bien joué");
    expect(resultHeadline(5, 10)).toBe("On consolide ?");
  });

  it("convertit le seuil en nombre de bonnes réponses", () => {
    expect(goalCount(70, 10)).toBe(7);
  });

  it("ignore les images de remplacement", () => {
    expect(explicitQuestionImage("https://source.unsplash.com/featured/1200x1600/?education")).toBeUndefined();
    expect(explicitQuestionImage("https://cdn.byound.fr/leo.png")).toBe("https://cdn.byound.fr/leo.png");
    expect(explicitQuestionImage("")).toBeUndefined();
  });
});
