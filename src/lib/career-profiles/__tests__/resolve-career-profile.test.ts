import { describe, expect, it } from "vitest";

import { careerTitlesMatch } from "@/lib/career-profiles/generate-career-profile-ai";
import { slugifyCareerTitle } from "@/lib/career-profiles/career-profiles-repo";

describe("career profile resolve helpers", () => {
  it("matche les titres sans tenir compte de la casse ni des accents", () => {
    expect(careerTitlesMatch("Cuisinier", "cuisinier")).toBe(true);
    expect(careerTitlesMatch("Chargé de recrutement", "charge de recrutement")).toBe(true);
  });

  it("slugifie un intitulé métier libre", () => {
    expect(slugifyCareerTitle("Cuisinier en restauration")).toBe("cuisinier-en-restauration");
  });
});
