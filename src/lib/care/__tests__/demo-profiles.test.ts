import { describe, expect, it } from "vitest";
import { isPlaceholderCareRow, desiredCareSlug } from "../demo-profiles";

describe("isPlaceholderCareRow", () => {
  it("detects the seeded Anaïs demo", () => {
    expect(
      isPlaceholderCareRow({
        expert_id: "c4e0a0a1-1111-4111-8111-0000000000a1",
        title: "[Nom]",
        tagline: "[Praticienne petite enfance 0–6 ans]",
        city: "[Ville]",
      }),
    ).toBe(true);
  });

  it("does not hide a real published expert with empty Care fields", () => {
    expect(
      isPlaceholderCareRow({
        expert_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        title: "",
        tagline: "",
        city: "",
      }),
    ).toBe(false);
  });
});

describe("desiredCareSlug", () => {
  it("slugifies Anaïs to anais", () => {
    expect(desiredCareSlug("Anaïs")).toBe("anais");
  });
});
