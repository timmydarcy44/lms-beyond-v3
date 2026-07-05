import { describe, expect, it } from "vitest";

import {
  computeProfilEdgeMaturity,
  isIdentityComplete,
  isProfessionalProjectComplete,
  parseProfessionalProject,
} from "@/lib/particulier/profil-edge-maturity";

describe("profil-edge-maturity", () => {
  it("calcule 92% quand hard skills manquants", () => {
    const maturity = computeProfilEdgeMaturity({
      profile: {
        first_name: "Jessica",
        last_name: "Martin",
        email: "j@test.fr",
        phone: "0600000000",
        city: "Paris",
        avatar_url: "https://example.com/a.jpg",
        professional_project: {
          objectif: "CDI",
          metier_vise: "Commercial",
          secteur: "Immobilier",
          mobilite: "Locale",
          disponibilite: "Immédiate",
        },
        hard_skills: [],
      },
      hasDisc: true,
      hasSoftSkills: true,
      hasIdmc: true,
      experiencesCount: 1,
      diplomasCount: 1,
    });

    expect(maturity.totalPercent).toBe(85);
    expect(maturity.blocks.find((b) => b.id === "hard_skills")?.complete).toBe(false);
  });

  it("valide identité et projet professionnel", () => {
    expect(
      isIdentityComplete({
        first_name: "A",
        last_name: "B",
        email: "a@b.fr",
        phone: "1",
        city: "Paris",
        avatar_url: "x",
      }),
    ).toBe(true);

    expect(
      isProfessionalProjectComplete(
        parseProfessionalProject({
          objectif: "x",
          metier_vise: "y",
          secteur: "z",
          mobilite: "a",
          disponibilite: "b",
        }),
      ),
    ).toBe(true);
  });
});
