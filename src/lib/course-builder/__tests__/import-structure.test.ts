import { describe, expect, it } from "vitest";

import { importFormationStructure, parseAtelierDraftText } from "@/lib/course-builder/import-structure";

const sample = {
  sections: [
    {
      title: "Module 1",
      chapters: [
        {
          title: "Accueillir",
          subchapters: [
            { title: "La première minute", type: "text", content: "Observez avant de parler." },
            {
              type: "atelier",
              title: "Rédiger 3 objectifs de son métier",
              instructions: "Rédigez 3 objectifs pédagogiques observables.",
              scenario: "Vous accueillez un nouveau collaborateur demain.",
              example: "Être capable de conseiller une paire de chaussures.",
              fields: [
                { label: "Votre métier", type: "short" },
                { label: "Objectif 1", type: "long" },
              ],
              criteria: ["Verbe d'action", "Situation précise"],
              max_improvements: 2,
            },
          ],
        },
      ],
    },
  ],
};

describe("import formation", () => {
  it("place l'atelier après la leçon", () => {
    const result = importFormationStructure(sample);
    const subs = result.sections[0].chapters[0].subchapters;
    expect(result.warnings).toEqual([]);
    expect(subs.map((item) => item.title)).toEqual(["La première minute", "Rédiger 3 objectifs de son métier"]);
    expect(subs[0].kind).toBeUndefined();
    expect(subs[1].kind).toBe("case_study");
    expect(subs[1].workshop?.mode).toBe("atelier");
    expect(subs[1].workshop?.brief).toContain("observables");
    expect(subs[1].workshop?.fields).toHaveLength(2);
    expect(subs[1].workshop?.criteria).toHaveLength(2);
    expect(subs[1].workshop?.maxImprovements).toBe(2);
    expect(subs[1].workshop?.personnage).toBeUndefined();
    expect(subs[1].workshop?.pieces).toBeUndefined();
  });

  it("conserve un import sans atelier", () => {
    const result = importFormationStructure({
      sections: [{ title: "Module", chapters: [{ title: "Chapitre", subChapters: ["Une leçon", "Une autre"] }] }],
    });
    expect(result.warnings).toEqual([]);
    expect(result.sections[0].chapters[0].subchapters.map((item) => item.title)).toEqual(["Une leçon", "Une autre"]);
    expect(result.sections[0].chapters[0].subchapters.every((item) => item.kind == null)).toBe(true);
  });

  it("remplit un atelier depuis le JSON collé dans le formulaire", () => {
    const result = parseAtelierDraftText(JSON.stringify(sample.sections[0].chapters[0].subchapters[1]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.title).toBe("Rédiger 3 objectifs de son métier");
    expect(result.workshop.mode).toBe("atelier");
    expect(result.workshop.fields).toHaveLength(2);
  });

  it("signale un atelier incomplet sans retirer la leçon", () => {
    const result = importFormationStructure({
      sections: [
        {
          title: "Module",
          chapters: [
            {
              title: "Accueillir",
              subchapters: [
                { title: "La leçon", content: "Texte" },
                { type: "atelier", title: "Trop court", instructions: "", fields: [], criteria: [] },
              ],
            },
          ],
        },
      ],
    });
    expect(result.sections[0].chapters[0].subchapters.map((item) => item.title)).toEqual(["La leçon"]);
    expect(result.warnings[0]?.message).toContain("Accueillir");
    expect(result.warnings[0]?.message).toContain("Trop court");
  });

  it("lit le personnage, les pièces et les alias mission / situation", () => {
    const result = importFormationStructure({
      sections: [
        {
          title: "Module",
          chapters: [
            {
              title: "Budget",
              subchapters: [
                {
                  type: "atelier",
                  title: "Répondre à Claire",
                  mission: "Rédigez la réponse.",
                  situation: "Le budget est contesté.",
                  personnage: { nom: "Claire", fonction: "Responsable budget", description: "Elle veut un chiffre." },
                  pieces: [
                    { type: "mail", titre: "Demande", de: "Claire", objet: "Budget", contenu: "Justifiez." },
                    { type: "note", titre: "Mémo", contenu: "Rappel interne." },
                    { type: "donnees", titre: "Dépenses", colonnes: ["Poste", "Montant"], lignes: [["Formation", "1200"]] },
                    { type: "fichier", titre: "Devis", url: "https://cdn.example/devis.pdf" },
                  ],
                  fields: [{ label: "Réponse", type: "long" }],
                  criteria: ["Répond au besoin", "Chiffre présent"],
                },
              ],
            },
          ],
        },
      ],
    });
    const workshop = result.sections[0].chapters[0].subchapters[0].workshop;
    expect(result.warnings).toEqual([]);
    expect(workshop?.brief).toBe("Rédigez la réponse.");
    expect(workshop?.situation).toBe("Le budget est contesté.");
    expect(workshop?.personnage).toEqual({ nom: "Claire", fonction: "Responsable budget", description: "Elle veut un chiffre." });
    expect(workshop?.pieces?.map((piece) => piece.type)).toEqual(["mail", "note", "donnees", "fichier"]);
  });

  it("refuse une sixième pièce en nommant l'atelier et la pièce", () => {
    const pieces = ["A", "B", "C", "D", "E", "Annexe"].map((titre) => ({ type: "note", titre, contenu: "texte" }));
    const result = importFormationStructure({
      sections: [
        {
          title: "Module",
          chapters: [
            {
              title: "Budget",
              subchapters: [
                { title: "La leçon", content: "Texte" },
                {
                  type: "atelier",
                  title: "Répondre à Claire",
                  mission: "Rédigez.",
                  fields: [{ label: "Réponse", type: "long" }],
                  criteria: ["Clair", "Chiffré"],
                  pieces,
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.sections[0].chapters[0].subchapters.map((item) => item.title)).toEqual(["La leçon"]);
    expect(result.warnings[0]?.message).toContain("Répondre à Claire");
    expect(result.warnings[0]?.message).toContain("Annexe");
    expect(result.warnings[0]?.message).toContain("5 pièces maximum");
  });
});
