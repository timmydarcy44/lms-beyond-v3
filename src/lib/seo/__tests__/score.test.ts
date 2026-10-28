import { describe, expect, it } from "vitest";
import {
  SEO_CHECKS,
  containsKeyword,
  foldSeoText,
  scoreSeoPage,
  seoWordCount,
  type SeoCheckId,
  type SeoPageForScore,
} from "../score";

function page(overrides: Partial<SeoPageForScore> = {}): SeoPageForScore {
  return {
    path: "/",
    title: "Formation alternance Caen — bachelor Byound School",
    meta_description:
      "Formation alternance Caen : bachelors en business et sport, rythme de trois semaines en entreprise, competences mesurables et Open Badges Byound.",
    focus_keyword: "formation alternance Caen",
    canonical_url: "https://www.byound.fr/",
    og_image_url: "https://www.byound.fr/og/accueil.jpg",
    jsonld_types: ["EducationalOrganization"],
    h1: "Vos compétences. Votre prochaine étape.",
    h2: ["Une école, une plateforme", "Bachelor Business Sport"],
    faq: [
      { question: "Quelles formations ?", answer: "Des bachelors en business et sport." },
      { question: "Quel rythme ?", answer: "Trois semaines en entreprise, une à l'école." },
    ],
    faqVisibleOnPage: true,
    ai_summary:
      "Byound est une école et une plateforme de compétences à Caen. " +
      "Les formations en alternance couvrent le business, le sport et le retail. " +
      "Le rythme alterné place trois semaines en entreprise pour une à l'école. " +
      "Les apprenants construisent un portefeuille de compétences et d'Open Badges. " +
      "Les entreprises recrutent des profils déjà opérationnels. " +
      "L'accompagnement couvre l'orientation, le financement et le suivi en entreprise. " +
      "Les équipes pédagogiques mêlent formateurs et experts de terrain. " +
      "Byound publie aussi des ressources pour les reconversions et les certifications. " +
      "Le campus et la plateforme digitale travaillent ensemble. " +
      "L'objectif est de rendre les compétences visibles et mesurables pour les recruteurs.",
    noindex: false,
    ...overrides,
  };
}

function resultOf(id: SeoCheckId, overrides: Partial<SeoPageForScore> = {}, peers: SeoPageForScore[] = []) {
  const scored = scoreSeoPage(page(overrides), peers.length ? peers : [page(overrides)]);
  const check = scored.checks.find((item) => item.id === id);
  if (!check) throw new Error(`missing check ${id}`);
  return check;
}

describe("SEO_CHECKS catalog", () => {
  it("covers every required control exactly once", () => {
    const ids = SEO_CHECKS.map((item) => item.id);
    expect(ids).toEqual([
      "title_length",
      "description_length",
      "keyword_in_title",
      "keyword_in_description",
      "single_h1",
      "min_two_h2",
      "unique_title",
      "unique_description",
      "canonical",
      "og_image",
      "faq",
      "ai_summary",
      "indexable",
      "jsonld",
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("weights sum to 100 so the score equals earned weight", () => {
    expect(SEO_CHECKS.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
    const perfect = scoreSeoPage(page());
    expect(perfect.score).toBe(100);
    expect(perfect.checks.every((item) => item.passed)).toBe(true);
  });
});

describe("title_length", () => {
  it("passes between 50 and 60 characters", () => {
    expect(resultOf("title_length").passed).toBe(true);
  });
  it("fails when empty", () => {
    const check = resultOf("title_length", { title: "" });
    expect(check.passed).toBe(false);
    expect(check.message).toMatch(/manquant/i);
  });
  it("fails under 50", () => {
    expect(resultOf("title_length", { title: "Byound école Caen" }).passed).toBe(false);
  });
  it("fails over 60", () => {
    expect(resultOf("title_length", { title: "A".repeat(61) }).passed).toBe(false);
  });
});

describe("description_length", () => {
  it("passes between 140 and 160 characters", () => {
    expect(resultOf("description_length").passed).toBe(true);
  });
  it("fails when empty or too short", () => {
    expect(resultOf("description_length", { meta_description: "" }).passed).toBe(false);
    expect(resultOf("description_length", { meta_description: "Trop court." }).passed).toBe(false);
  });
  it("fails over 160", () => {
    expect(resultOf("description_length", { meta_description: "A".repeat(161) }).passed).toBe(false);
  });
});

describe("keyword", () => {
  it("matches ignoring case and accents", () => {
    expect(containsKeyword("Formation Alternance Caen — bachelor", "formation alternance Caen")).toBe(true);
    expect(foldSeoText("École")).toBe("ecole");
  });
  it("fails title and description when the keyword is missing", () => {
    expect(resultOf("keyword_in_title", { focus_keyword: "mastere luxe paris" }).passed).toBe(false);
    expect(resultOf("keyword_in_description", { focus_keyword: "mastere luxe paris" }).passed).toBe(false);
  });
  it("fails when no keyword is set", () => {
    expect(resultOf("keyword_in_title", { focus_keyword: "" }).passed).toBe(false);
    expect(resultOf("keyword_in_description", { focus_keyword: "  " }).passed).toBe(false);
  });
});

describe("single_h1", () => {
  it("passes with one stored H1", () => {
    expect(resultOf("single_h1").passed).toBe(true);
  });
  it("fails with zero or several HTML H1", () => {
    expect(resultOf("single_h1", { headings: { h1: [], h2: ["A", "B"] } }).passed).toBe(false);
    expect(resultOf("single_h1", { headings: { h1: ["Un", "Deux"], h2: ["A", "B"] } }).passed).toBe(false);
  });
  it("prefers HTML headings over stored fields", () => {
    expect(resultOf("single_h1", { h1: "Stocké", headings: { h1: [], h2: ["A", "B"] } }).passed).toBe(false);
  });
});

describe("min_two_h2", () => {
  it("passes with two stored H2", () => {
    expect(resultOf("min_two_h2").passed).toBe(true);
  });
  it("fails with one HTML H2 even if stored fields have more", () => {
    expect(resultOf("min_two_h2", { h2: ["A", "B"], headings: { h1: ["H"], h2: ["Seul"] } }).passed).toBe(false);
  });
});

describe("unique_title and unique_description", () => {
  it("fails when another page shares the same title", () => {
    const a = page({ path: "/", title: "Même titre Byound formation Caen 12345" });
    const b = page({ path: "/business", title: "Même titre Byound formation Caen 12345" });
    expect(resultOf("unique_title", a, [a, b]).passed).toBe(false);
  });
  it("fails when another page shares the same description", () => {
    const desc = "A".repeat(150);
    const a = page({ path: "/", meta_description: desc });
    const b = page({ path: "/blog", meta_description: desc });
    expect(resultOf("unique_description", a, [a, b]).passed).toBe(false);
  });
  it("passes when titles differ", () => {
    const a = page({ path: "/", title: "Titre accueil Byound école Caen xx" });
    const b = page({ path: "/blog", title: "Titre blog Byound actualités Caen" });
    expect(resultOf("unique_title", a, [a, b]).passed).toBe(true);
  });
});

describe("canonical", () => {
  it("passes on a valid https URL", () => {
    expect(resultOf("canonical").passed).toBe(true);
  });
  it("fails when missing or not a URL", () => {
    expect(resultOf("canonical", { canonical_url: "" }).passed).toBe(false);
    expect(resultOf("canonical", { canonical_url: "byound.fr/" }).passed).toBe(false);
  });
});

describe("og_image", () => {
  it("passes with a dedicated URL", () => {
    expect(resultOf("og_image").passed).toBe(true);
  });
  it("fails when missing", () => {
    expect(resultOf("og_image", { og_image_url: "" }).passed).toBe(false);
  });
});

describe("faq", () => {
  it("passes with two visible questions", () => {
    expect(resultOf("faq").passed).toBe(true);
  });
  it("fails with fewer than two questions", () => {
    expect(resultOf("faq", { faq: [{ question: "Q", answer: "A" }] }).passed).toBe(false);
  });
  it("fails when the FAQ is not on the page", () => {
    expect(resultOf("faq", { faqVisibleOnPage: false }).passed).toBe(false);
  });
  it("treats unknown visibility as visible until the HTML crawl", () => {
    expect(resultOf("faq", { faqVisibleOnPage: undefined }).passed).toBe(true);
  });
});

describe("ai_summary", () => {
  it("counts words, not characters", () => {
    expect(seoWordCount("un deux trois")).toBe(3);
    expect(resultOf("ai_summary", { ai_summary: "court résumé de quatre-vingts caractères mais pas assez de mots ici vraiment" }).passed).toBe(false);
  });
  it("passes at 80 words", () => {
    expect(resultOf("ai_summary").passed).toBe(true);
    expect(resultOf("ai_summary", { ai_summary: Array.from({ length: 80 }, () => "mot").join(" ") }).passed).toBe(true);
  });
});

describe("indexable", () => {
  it("fails on noindex", () => {
    expect(resultOf("indexable", { noindex: true }).passed).toBe(false);
    expect(resultOf("indexable", { noindex: false }).passed).toBe(true);
  });
});

describe("jsonld", () => {
  it("fails without structured data types", () => {
    expect(resultOf("jsonld", { jsonld_types: [] }).passed).toBe(false);
    expect(resultOf("jsonld", { jsonld_types: ["FAQPage"] }).passed).toBe(true);
  });
});

describe("scoreSeoPage", () => {
  it("is the weighted share of passing checks, scaled to 100", () => {
    const scored = scoreSeoPage(page({ noindex: true, og_image_url: "" }));
    expect(scored.score).toBe(100 - 4 - 8);
    expect(scored.checks.filter((item) => !item.passed).map((item) => item.id).sort()).toEqual(["indexable", "og_image"]);
  });
});
