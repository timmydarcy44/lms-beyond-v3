import { describe, expect, it } from "vitest";

import {
  computeProfilEdgeMaturity,
  isIdentityComplete,
  isProfessionalProjectComplete,
  parseProfessionalProject,
} from "@/lib/particulier/profil-edge-maturity";

describe("profil-edge-maturity", () => {
  it("calcule 90% sans hard skills (hors complétion) quand diplômes manquants", () => {
    const maturity = computeProfilEdgeMaturity({
      profile: {
        first_name: "Jessica",
        last_name: "Martin",
        email: "j@test.fr",
        phone: "0600000000",
        city: "Paris",
        avatar_url: "https://example.com/a.jpg",
        professional_project: {
          edge_profession: "commercial",
          edge_secteur: "immobilier",
          edge_projet_libre: "Je vise un poste de commercial immobilier B2B.",
        },
        type_profil: null,
        hard_skills: [],
      },
      hasDisc: true,
      hasSoftSkills: true,
      hasIdmc: true,
      experiencesCount: 1,
      diplomasCount: 0,
    });

    // 20 identité + 20 projet + 30 tests + 20 expériences + 0 diplômes
    expect(maturity.totalPercent).toBe(90);
    expect(maturity.blocks.find((b) => b.id === "hard_skills")).toBeUndefined();
    expect(maturity.blocks.find((b) => b.id === "diplomes")?.complete).toBe(false);
  });

  it("valide identité et projet professionnel v2 même sans type_profil", () => {
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
          edge_profession: "commercial",
          edge_secteur: "sport",
          edge_projet_libre: "J'aimerai être business developer dans le sport.",
        }),
        null,
      ),
    ).toBe(true);
  });
});
