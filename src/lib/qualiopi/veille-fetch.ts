import type { VeilleKind } from "@/lib/qualiopi/veille-shared";
import { VEILLE_DEFAULT_QUERIES } from "@/lib/qualiopi/veille-shared";

export type VeilleRawSnippet = {
  title: string;
  summary: string;
  url?: string;
  sourceLabel?: string;
  isPriority?: boolean;
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchPriorityPage(url: string, title?: string | null): Promise<VeilleRawSnippet | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "ByoundQualiopiVeille/1.0",
      },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    const text = stripHtml(html).slice(0, 4500);
    if (text.length < 80) return null;
    const pageTitle =
      title?.trim() ||
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ||
      url;
    return {
      title: pageTitle.slice(0, 180),
      summary: text.slice(0, 1200),
      url,
      sourceLabel: "URL prioritaire",
      isPriority: true,
    };
  } catch {
    return null;
  }
}

async function searchBrave(query: string): Promise<VeilleRawSnippet[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!apiKey) return [];
  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", "6");
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      web?: { results?: Array<{ title?: string; description?: string; url?: string }> };
    };
    return (data.web?.results ?? [])
      .map((row) => {
        const title = String(row.title ?? "").trim();
        const summary = String(row.description ?? "").trim();
        const link = String(row.url ?? "").trim();
        if (!title && !summary) return null;
        return {
          title: title || link || "Résultat web",
          summary: summary || title,
          url: link || undefined,
          sourceLabel: "Recherche web",
          isPriority: false,
        } satisfies VeilleRawSnippet;
      })
      .filter((row): row is VeilleRawSnippet => Boolean(row));
  } catch {
    return [];
  }
}

export async function collectVeilleSnippets(input: {
  kind: VeilleKind;
  priorityUrls: Array<{ url: string; title?: string | null }>;
}): Promise<VeilleRawSnippet[]> {
  const priority: VeilleRawSnippet[] = [];
  for (const source of input.priorityUrls.slice(0, 8)) {
    const page = await fetchPriorityPage(source.url, source.title);
    if (page) priority.push(page);
  }

  const general: VeilleRawSnippet[] = [];
  for (const query of VEILLE_DEFAULT_QUERIES[input.kind]) {
    const hits = await searchBrave(query);
    for (const hit of hits) {
      if (general.some((row) => row.url && hit.url && row.url === hit.url)) continue;
      general.push(hit);
      if (general.length >= 10) break;
    }
    if (general.length >= 10) break;
  }

  return [...priority, ...general].slice(0, 16);
}
