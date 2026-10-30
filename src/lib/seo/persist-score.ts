import { getServiceRoleClient } from "@/lib/supabase/server";
import { byoundSeoCatalog, loadSeoPage, type SeoPageRecord } from "@/lib/seo/byound-seo";
import { faqVisibility } from "@/lib/seo/parse-html";
import { scoreSeoPage, type SeoCheckResult, type SeoPageForScore, type SeoScorePeer } from "@/lib/seo/score";

export function toSeoPageForScore(page: SeoPageRecord): SeoPageForScore {
  const cache = page.headings_cache;
  return {
    path: page.path,
    title: page.title,
    meta_description: page.meta_description,
    focus_keyword: page.focus_keyword,
    canonical_url: page.canonical_url,
    og_image_url: page.og_image_url,
    jsonld_types: page.jsonld_types,
    h1: page.h1,
    h2: page.h2,
    headings: cache
      ? { h1: cache.h1 ?? [], h2: cache.h2 ?? [], h3: cache.h3 ?? [] }
      : null,
    faq: page.faq,
    faqVisibleOnPage: cache?.text
      ? faqVisibility(
          page.faq.map((item) => item.question),
          cache.text,
        ).allVisible
      : typeof cache?.faq_visible === "boolean"
        ? cache.faq_visible
        : undefined,
    ai_summary: page.ai_summary,
    noindex: page.noindex,
  };
}

function missingTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache|column .* does not exist/i.test(error.message ?? "");
}

export async function persistSeoScore(page: SeoPageRecord, peers: SeoScorePeer[]): Promise<SeoCheckResult[]> {
  const scored = scoreSeoPage(toSeoPageForScore(page), peers);
  const db = getServiceRoleClient();
  if (!db) return scored.checks;

  const scoreUpdate = await db.from("site_seo_pages").update({ score: scored.score }).eq("path", page.path);
  if (scoreUpdate.error && !missingTable(scoreUpdate.error)) {
    console.warn("[seo] score update", scoreUpdate.error.message);
  }

  const now = new Date().toISOString();
  const rows = scored.checks.map((check) => ({
    path: page.path,
    check_id: check.id,
    passed: check.passed,
    message: check.message,
    category: check.category,
    weight: check.weight,
    computed_at: now,
  }));

  const del = await db.from("seo_page_checks").delete().eq("path", page.path);
  if (del.error) {
    if (!missingTable(del.error)) console.warn("[seo] checks delete", del.error.message);
    return scored.checks;
  }
  const ins = await db.from("seo_page_checks").insert(rows);
  if (ins.error && !missingTable(ins.error)) console.warn("[seo] checks insert", ins.error.message);
  return scored.checks;
}

export async function rescoreAllSeoPages(): Promise<{ pages: number; score: number }> {
  const catalog = byoundSeoCatalog();
  const pages = await Promise.all(catalog.map((item) => loadSeoPage(item.path)));
  const peers: SeoScorePeer[] = pages.map((item) => ({
    path: item.path,
    title: item.title,
    meta_description: item.meta_description,
  }));
  let total = 0;
  for (const page of pages) {
    const checks = await persistSeoScore(page, peers);
    const scored = scoreSeoPage(toSeoPageForScore(page), peers);
    total += scored.score;
    void checks;
  }
  return { pages: pages.length, score: pages.length ? Math.round(total / pages.length) : 0 };
}
