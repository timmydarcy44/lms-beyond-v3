import { describe, expect, it } from "vitest";

import { normalizeWorkshopFeedback } from "@/lib/workshops/normalize-feedback";

describe("normalize workshop feedback", () => {
  it("accepte les clés lues par l'écran", () => {
    const result = normalizeWorkshopFeedback({
      criteres: [{ critere: "Verbe", statut: "reussi", commentaire: "Oui", suggestion: "" }],
      commentaire_global: "Bien.",
    });
    expect(result).toEqual({
      criteres: [{ critere: "Verbe", statut: "reussi", commentaire: "Oui", suggestion: "" }],
      commentaire_global: "Bien.",
    });
  });

  it("traduit criteria et un statut accentué", () => {
    const result = normalizeWorkshopFeedback({
      criteria: [{ criterion: "Contexte", status: "à améliorer", comment: "Manque le lieu", advice: "Précisez où." }],
      global_comment: "À reprendre.",
    });
    expect(result).toMatchObject({
      criteres: [{ critere: "Contexte", statut: "a_ameliorer", commentaire: "Manque le lieu", suggestion: "Précisez où." }],
      commentaire_global: "À reprendre.",
    });
  });
});