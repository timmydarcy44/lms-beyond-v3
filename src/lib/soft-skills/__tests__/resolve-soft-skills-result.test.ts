import { describe, expect, it } from "vitest";
import {
  parseSoftSkillsScoreEntries,
  pickLatestSoftSkillsRow,
  resolveSoftSkillsResultSource,
} from "@/lib/soft-skills/resolve-soft-skills-result";

describe("resolveSoftSkillsResultSource", () => {
  it("returns salarie source when only salarie row exists", () => {
    const salarie = {
      scores: { Leadership: 12 },
      taken_at: "2026-06-01T10:00:00.000Z",
    };
    expect(resolveSoftSkillsResultSource(null, salarie)).toEqual({
      source: "salarie",
      row: salarie,
    });
  });

  it("returns apprenant source when timestamps tie", () => {
    const apprenant = {
      scores: { Empathie: 10 },
      taken_at: "2026-06-10T10:00:00.000Z",
    };
    const salarie = {
      scores: { Leadership: 14 },
      taken_at: "2026-06-10T10:00:00.000Z",
    };
    expect(resolveSoftSkillsResultSource(apprenant, salarie)).toEqual({
      source: "apprenant",
      row: apprenant,
    });
  });
});

describe("parseSoftSkillsScoreEntries", () => {
  it("ignores metadata keys like variant", () => {
    const entries = parseSoftSkillsScoreEntries({
      Leadership: 12,
      variant: "salarie",
    });
    expect(entries).toEqual([{ skill: "Leadership", score: 12 }]);
  });
});

describe("pickLatestSoftSkillsRow", () => {
  it("returns null when both rows are missing", () => {
    expect(pickLatestSoftSkillsRow(null, undefined)).toBeNull();
  });

  it("returns the only available row", () => {
    const salarie = {
      scores: { Leadership: 12 },
      taken_at: "2026-06-01T10:00:00.000Z",
    };
    expect(pickLatestSoftSkillsRow(null, salarie)).toEqual(salarie);
  });

  it("keeps the most recent row by taken_at without merging scores", () => {
    const apprenant = {
      scores: { Empathie: 10 },
      taken_at: "2026-06-10T10:00:00.000Z",
    };
    const salarie = {
      scores: { Leadership: 14, variant: "salarie" },
      taken_at: "2026-06-15T10:00:00.000Z",
    };
    expect(pickLatestSoftSkillsRow(apprenant, salarie)).toEqual(salarie);
    expect(pickLatestSoftSkillsRow(salarie, apprenant)).toEqual(salarie);

    const newerApprenant = {
      scores: { Empathie: 12 },
      taken_at: "2026-06-20T10:00:00.000Z",
    };
    expect(pickLatestSoftSkillsRow(newerApprenant, salarie)).toEqual(newerApprenant);
  });

  it("prefers apprenant when timestamps are equal or invalid", () => {
    const apprenant = {
      scores: { Empathie: 11 },
      taken_at: "invalid-date",
    };
    const salarie = {
      scores: { Leadership: 13 },
      taken_at: "also-invalid",
    };
    expect(pickLatestSoftSkillsRow(apprenant, salarie)).toEqual(apprenant);
  });
});
