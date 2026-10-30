import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { byoundSeoCatalog, loadSeoPage, type SeoHeadingsCache } from "@/lib/seo/byound-seo";
import { extractPageText, faqVisibility, parsePageHeadings } from "@/lib/seo/parse-html";
import { getServiceRoleClient } from "@/lib/supabase/server";

const TTL_MS = 24 * 60 * 60 * 1000;

export function headingsCacheStale(cachedAt: string | null) {
  if (!cachedAt) return true;
  const time = new Date(cachedAt).getTime();
  if (Number.isNaN(time)) return true;
  return Date.now() - time > TTL_MS;
}

export async function fetchPublishedHtml(path: string) {
  const url = `${BYOUND_PUBLIC_ORIGIN}${path === "/" ? "/" : path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ByoundSeoBot/1.0", Accept: "text/html" },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

export function headingsCacheFromHtml(html: string, questions: string[]): SeoHeadingsCache {
  const headings = parsePageHeadings(html);
  const text = extractPageText(html);
  const visibility = faqVisibility(questions, text);
  return {
    h1: headings.h1,
    h2: headings.h2,
    h3: headings.h3,
    faq_visible: visibility.allVisible,
    text,
  };
}

export async function refreshHeadingsForPath(path: string, force = false) {
  const page = await loadSeoPage(path);
  if (!force && !headingsCacheStale(page.headings_cached_at)) return page.headings_cache;
  const html = await fetchPublishedHtml(path);
  const questions = page.faq.map((item) => item.question);
  const cache = headingsCacheFromHtml(html, questions);
  const db = getServiceRoleClient();
  const now = new Date().toISOString();
  if (db) {
    const existing = await db.from("site_seo_pages").select("path").eq("path", path).maybeSingle();
    if (existing.data) {
      await db.from("site_seo_pages").update({ headings_cache: cache, headings_cached_at: now }).eq("path", path);
    } else {
      await db.from("site_seo_pages").insert({
        path,
        headings_cache: cache,
        headings_cached_at: now,
        h2: [],
        keywords: [],
        faq: [],
        noindex: false,
      });
    }
  }
  return cache;
}

export async function refreshStaleHeadings(limit = 8) {
  const catalog = byoundSeoCatalog();
  let refreshed = 0;
  for (const item of catalog) {
    if (refreshed >= limit) break;
    const page = await loadSeoPage(item.path);
    if (!headingsCacheStale(page.headings_cached_at)) continue;
    try {
      await refreshHeadingsForPath(item.path, true);
      refreshed += 1;
    } catch (error) {
      console.warn("[seo] headings", item.path, error instanceof Error ? error.message : error);
    }
  }
  return { refreshed };
}
