import { describe, expect, it } from "vitest";
import { proposalViolatesSource } from "../proposal-safety";

const source =
  "Byound propose des formations en alternance à Caen, rythme de 3 semaines en entreprise. Les bachelors durent 3 ans.";

describe("proposalViolatesSource", () => {
  it("accepts facts present in the page", () => {
    expect(proposalViolatesSource("Formations en alternance à Caen, 3 semaines en entreprise.", source)).toBe(false);
  });
  it("rejects invented prices and rates", () => {
    expect(proposalViolatesSource("Formation à 4500 € avec 98% de réussite.", source)).toBe(true);
  });
  it("rejects hype absent from the page", () => {
    expect(proposalViolatesSource("N°1 des écoles, réussite garantie.", source)).toBe(true);
  });
});
