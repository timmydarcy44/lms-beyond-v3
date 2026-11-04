import { describe, expect, it } from "vitest";

import { importFormationStructure } from "@/lib/course-builder/import-structure";

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
  });

  it("conserve un import sans atelier", () => {
    const result = importFormationStructure({
      sections: [{ title: "Module", chapters: [{ title: "Chapitre", subChapters: ["Une leçon", "Une autre"] }] }],
    });
    expect(result.warnings).toEqual([]);
    expect(result.sections[0].chapters[0].subchapters.map((item) => item.title)).toEqual(["Une leçon", "Une autre"]);
    expect(result.sections[0].chapters[0].subchapters.every((item) => item.kind == null)).toBe(true);
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
});
