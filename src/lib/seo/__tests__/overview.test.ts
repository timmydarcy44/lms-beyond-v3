import { describe, expect, it } from "vitest";
import { filterSeoPages, failingPriorityCards, seoGroupForPath, type SeoListedPage } from "../overview";
import type { SeoCheckResult } from "../score";

function check(id: SeoCheckResult["id"], passed: boolean, message = id): SeoCheckResult {
  return { id, label: id, category: "contenu", weight: 1, passed, message };
}

function page(partial: Partial<SeoListedPage> & Pick<SeoListedPage, "path">): SeoListedPage {
  return {
    label: partial.path,
    group: "Marque",
    score: 36,
    checks: [],
    impressions: 0,
    clicks: 0,
    ...partial,
  };
}

describe("seoGroupForPath", () => {
  it("splits Marque, Business and Apprenants", () => {
    expect(seoGroupForPath("/")).toBe("Marque");
    expect(seoGroupForPath("/business")).toBe("Business");
    expect(seoGroupForPath("/entreprises")).toBe("Business");
    expect(seoGroupForPath("/admissions")).toBe("Apprenants");
    expect(seoGroupForPath("/formations/bachelor")).toBe("Apprenants");
  });
});

describe("failingPriorityCards", () => {
  it("counts pages per failing check and flags counts above 20", () => {
    const pages = Array.from({ length: 21 }, (_, i) =>
      page({
        path: `/p-${i}`,
        checks: [check("faq", false, "FAQ"), check("og_image", i < 3, "image")],
      }),
    );
    const cards = failingPriorityCards(pages);
    expect(cards[0]).toMatchObject({ id: "faq", count: 21, hot: true });
    expect(cards.find((item) => item.id === "og_image")).toMatchObject({ count: 18, hot: false });
  });
});

describe("filterSeoPages", () => {
  const pages = [
    page({ path: "/", label: "Accueil", group: "Marque", score: 36, checks: [check("faq", false)], impressions: 100, clicks: 10 }),
    page({ path: "/business", label: "Business", group: "Business", score: 51, checks: [check("og_image", false)], impressions: 20, clicks: 2 }),
    page({ path: "/admissions", label: "Admissions", group: "Apprenants", score: 20, checks: [check("faq", false)], impressions: 50, clicks: 8 }),
  ];

  it("filters by group, search and failing check, default sort by score asc", () => {
    const byFaq = filterSeoPages(pages, { query: "", group: "Toutes", checkId: "faq", sort: "score" });
    expect(byFaq.map((item) => item.path)).toEqual(["/admissions", "/"]);
    const search = filterSeoPages(pages, { query: "busi", group: "Toutes", checkId: null, sort: "score" });
    expect(search.map((item) => item.path)).toEqual(["/business"]);
    const business = filterSeoPages(pages, { query: "", group: "Business", checkId: null, sort: "impressions" });
    expect(business.map((item) => item.path)).toEqual(["/business"]);
  });
});
