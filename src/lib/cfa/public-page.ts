export type PublicPage = {
  url: string;
  title: string;
  text: string;
  companyName: string;
  city: string;
  siret: string;
};

const MEDIA = /indeed|hellowork|linkedin|welcometothejungle|francetravail|pole-emploi|labonnealternance|apec\.|monster\.|leboncoin|lemonde|lefigaro|lesechos|usinenouvelle|cadremploi|google\.|bing\.|facebook|instagram/i;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function assertPublicHttps(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Adresse invalide.");
  }
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Seules les pages https sont lues.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host === "0.0.0.0" || host === "::1") {
    throw new Error("Adresse non autorisée.");
  }
  const parts = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (parts) {
    const a = Number(parts[1]);
    const b = Number(parts[2]);
    const blocked = a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
    if (blocked) throw new Error("Adresse non autorisée.");
  }
  return url;
}

function companyFromJsonLd(html: string) {
  const scripts = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const script of scripts) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(script[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { "@graph"?: unknown[] })["@graph"])
        ? (parsed as { "@graph": unknown[] })["@graph"]
        : [parsed];
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const record = node as Record<string, unknown>;
      if (!/JobPosting/i.test(String(record["@type"] ?? ""))) continue;
      const org = record.hiringOrganization as Record<string, unknown> | undefined;
      const name = text(org?.name);
      if (!name || MEDIA.test(name)) continue;
      const place = record.jobLocation as Record<string, unknown> | undefined;
      const address = place?.address as Record<string, unknown> | undefined;
      const siret = text(org?.identifier).replace(/\D/g, "");
      return { name, city: text(address?.addressLocality), siret: siret.length === 14 ? siret : "" };
    }
  }
  return null;
}

function meta(html: string, key: string) {
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, "i"));
  return match?.[1]?.replace(/&amp;/g, "&").trim() ?? "";
}

async function fetchHtml(url: URL, hops = 0): Promise<{ url: string; html: string }> {
  if (hops > 2) throw new Error("Cette page redirige trop loin.");
  const response = await fetch(url, {
    redirect: "manual",
    headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "ByoundCRM/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new Error("Cette page est inaccessible.");
    return fetchHtml(assertPublicHttps(new URL(location, url).toString()), hops + 1);
  }
  if (!response.ok) throw new Error("Cette page est inaccessible.");
  const type = response.headers.get("content-type") ?? "";
  if (type && !/text\/html|application\/xhtml|text\/plain/i.test(type)) throw new Error("Cette adresse ne pointe pas vers une page.");
  const length = Number(response.headers.get("content-length") ?? "0");
  if (length > 1_500_000) throw new Error("Cette page est trop lourde.");
  return { url: url.toString(), html: (await response.text()).slice(0, 1_000_000) };
}

export async function readPublicPage(rawUrl: string, companyName = ""): Promise<PublicPage> {
  const fetched = await fetchHtml(assertPublicHttps(rawUrl));
  const host = new URL(fetched.url).hostname;
  const jsonLd = companyFromJsonLd(fetched.html);
  const siteName = meta(fetched.html, "og:site_name");
  const named = companyName.trim();
  const fromSite = !MEDIA.test(host) && !MEDIA.test(siteName) ? siteName : "";
  const company = named || jsonLd?.name || fromSite;
  const title = (fetched.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const visible = fetched.html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20000);
  return {
    url: fetched.url,
    title,
    text: visible,
    companyName: company,
    city: jsonLd?.city ?? "",
    siret: jsonLd?.siret ?? "",
  };
}
