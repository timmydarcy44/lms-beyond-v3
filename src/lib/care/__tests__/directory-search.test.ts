import { describe, expect, it } from "vitest";
import {
  careWhereLabel,
  compareCareDirectory,
  matchesCareDirectory,
  parseCareDirectoryQuery,
} from "../directory-search";
import type { CareDirectoryRow } from "../types";

function row(overrides: Partial<CareDirectoryRow> = {}): CareDirectoryRow {
  return {
    expert_id: "a",
    slug: "jessica-contentin",
    display_name: "Jessica Contentin",
    title: "Psychopédagogue certifiée en neuroéducation",
    tagline: "Parents et adolescents",
    headline: "",
    avatar_url: null,
    domains: ["famille", "carriere"],
    city: "Caen",
    offers_cabinet: true,
    offers_visio: true,
    publics: ["Parents", "0–3 ans"],
    badge_count: 4,
    min_price_cents: 0,
    member_since: null,
    ...overrides,
  };
}

describe("matchesCareDirectory", () => {
  it("matches name, city and domain labels without accents", () => {
    expect(matchesCareDirectory(row(), parseCareDirectoryQuery({ q: "caen" }))).toBe(true);
    expect(matchesCareDirectory(row(), parseCareDirectoryQuery({ q: "parentalite" }))).toBe(true);
    expect(matchesCareDirectory(row(), parseCareDirectoryQuery({ q: "Petite enfance" }))).toBe(true);
    expect(matchesCareDirectory(row(), parseCareDirectoryQuery({ q: "lyon" }))).toBe(false);
  });
  it("filters domain and format from the URL", () => {
    expect(matchesCareDirectory(row(), parseCareDirectoryQuery({ domaine: "famille" }))).toBe(true);
    expect(matchesCareDirectory(row(), parseCareDirectoryQuery({ domaine: "couple" }))).toBe(false);
    expect(matchesCareDirectory(row({ offers_cabinet: false }), parseCareDirectoryQuery({ format: "cabinet" }))).toBe(false);
  });
});

describe("compareCareDirectory", () => {
  it("puts profiles with badges first, then the nearest slot", () => {
    const withBadge = row({ expert_id: "1", badge_count: 2, display_name: "B" });
    const without = row({ expert_id: "2", badge_count: 0, display_name: "A" });
    const slots = { "1": "2026-11-10T09:00:00.000Z", "2": "2026-11-02T09:00:00.000Z" };
    expect(compareCareDirectory(withBadge, without, slots) < 0).toBe(true);
  });
});

describe("careWhereLabel", () => {
  it("says visio only when there is no cabinet", () => {
    expect(careWhereLabel(row({ offers_cabinet: false, offers_visio: true }))).toBe("Visio uniquement");
    expect(careWhereLabel(row())).toBe("Caen · visio");
  });
});
