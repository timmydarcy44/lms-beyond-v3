import { describe, expect, it } from "vitest";
import { toPublicBadgeClassView } from "@/lib/openbadges/public-badge-class";

describe("toPublicBadgeClassView", () => {
  it("renders structured criteria instead of stringifying the array", () => {
    const view = toPublicBadgeClassView({
      id: "a1000001-0000-4000-8000-000000000001",
      name: "Profil comportemental EDGE",
      description: "Un profil croisé.",
      criteria: [{ label: "Profil croisé complet", description: "Compléter les tests DISC, IDMC et soft skills." }],
      evaluation_config: {
        criteria: [{ label: "Profil croisé complet", description: "Compléter les tests DISC, IDMC et soft skills." }],
        level: 1,
      },
    });

    expect(view?.criteriaMarkdown).toBe("");
    expect(view?.criteriaMarkdown).not.toContain("[object Object]");
    expect(view?.structuredCriteria).toEqual([
      {
        id: "c-0",
        label: "Profil croisé complet",
        description: "Compléter les tests DISC, IDMC et soft skills.",
      },
    ]);
  });

  it("keeps a real criteria narrative when it is a string", () => {
    const view = toPublicBadgeClassView({
      id: "abc",
      name: "Badge",
      criteria: "Avoir terminé le parcours.",
      evaluation_config: { criteria: [{ label: "Parcours", description: "Modules validés." }] },
    });
    expect(view?.criteriaMarkdown).toBe("Avoir terminé le parcours.");
    expect(view?.structuredCriteria[0]?.label).toBe("Parcours");
  });
});
