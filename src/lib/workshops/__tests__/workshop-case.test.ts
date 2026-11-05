import { describe, expect, it } from "vitest";

import { readWorkshopConfig, workshopCaseBrief } from "@/lib/workshops/workshop-block";

describe("cas d'atelier", () => {
  it("transmet le cas et seulement le titre d'un fichier", () => {
    const text = workshopCaseBrief({
      situation: "Le budget est contesté.",
      personnage: { nom: "Claire", fonction: "Responsable budget", description: "Elle veut un chiffre." },
      pieces: [
        { id: "1", type: "mail", titre: "Demande", de: "Claire", objet: "Budget", contenu: "Justifiez le poste formation." },
        { id: "2", type: "fichier", titre: "Devis signé", url: "https://cdn.example/devis.pdf" },
      ],
    });
    expect(text).toContain("Le budget est contesté.");
    expect(text).toContain("Claire");
    expect(text).toContain("Justifiez le poste formation.");
    expect(text).toContain("Devis signé");
    expect(text).not.toContain("cdn.example");
  });

  it("ignore un atelier sans personnage ni pièces", () => {
    const workshop = readWorkshopConfig({ mode: "atelier", brief: "Mission", situation: "Récit", fields: [], criteria: [], maxImprovements: 2 });
    expect(workshop?.personnage).toBeUndefined();
    expect(workshop?.pieces).toBeUndefined();
    expect(workshopCaseBrief(workshop)).toBe("Situation :\nRécit");
  });
});
