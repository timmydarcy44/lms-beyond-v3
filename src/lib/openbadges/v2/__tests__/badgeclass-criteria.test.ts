import { describe, expect, it } from "vitest";
import { buildBadgeClass } from "../builders";

const baseParams = {
  id: "https://example.com/api/public/badgeclasses/badge-1",
  name: "Badge 1",
  description: "Desc",
  image: "https://example.com/badge.png",
  issuerId: "https://example.com/api/public/issuers/issuer-1",
};

describe("buildBadgeClass criteria serialization", () => {
  it("criteriaUrl absent + criteriaMarkdown defined", () => {
    const jsonld = buildBadgeClass({
      ...baseParams,
      criteriaMarkdown: "Markdown criteria",
      criteriaUrl: null,
    });

    expect(jsonld.criteria?.narrative).toBe("Markdown criteria");
    expect("id" in (jsonld.criteria as Record<string, unknown>)).toBe(false);
  });

  it("criteriaUrl present + criteriaMarkdown defined", () => {
    const jsonld = buildBadgeClass({
      ...baseParams,
      criteriaMarkdown: "Markdown criteria",
      criteriaUrl: "https://example.com/criteria/badge-1",
    });

    expect(jsonld.criteria?.id).toBe("https://example.com/criteria/badge-1");
    expect(jsonld.criteria?.narrative).toBe("Markdown criteria");
  });

  it("criteriaUrl absent + criteriaMarkdown undefined", () => {
    const jsonld = buildBadgeClass({
      ...baseParams,
      criteriaUrl: null,
      criteriaMarkdown: undefined,
      criteriaText: undefined,
    });

    expect(jsonld.criteria?.narrative).toBe("");
    expect("id" in (jsonld.criteria as Record<string, unknown>)).toBe(false);
  });

  it("criteriaUrl present + criteriaMarkdown undefined", () => {
    const jsonld = buildBadgeClass({
      ...baseParams,
      criteriaUrl: "https://example.com/criteria/badge-1",
      criteriaMarkdown: undefined,
      criteriaText: undefined,
    });

    expect(jsonld.criteria?.id).toBe("https://example.com/criteria/badge-1");
    expect(jsonld.criteria?.narrative).toBe("");
  });
});
