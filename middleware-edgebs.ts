import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Préfixe interne Next.js — ne pas confondre avec les URLs publiques edgebs.fr. */
export const EDGE_LAB_PREFIX = "/edge-lab";

/** Chemins historiques + marketing (sans /formations* → catalogue edgeonline). */
const EDGE_BS_PUBLIC_PREFIXES: readonly string[] = [
  "/parcours",
  "/edge-online",
  "/online",
  "/entreprises",
  "/tarifs",
  "/orientation",
  "/votre-orientation",
  "/postuler",
  "/apprenants",
  "/alternance",
  "/admissions",
  "/financement",
  "/vie-etudiante",
  "/certifications",
  "/business",
  "/formateurs-experts",
  "/a-propos",
  "/notre-mission",
  "/ressources",
  "/blog",
  "/guides",
  "/webinaires",
  "/contact",
];

const STATIC_FILE_RE = /\.(png|jpe?g|webp|svg|ico|pdf|gif|css|js|mjs|woff2?|ttf|eot|map)$/i;

export function isEdgeBsHostname(host: string): boolean {
  const h = host.split(":")[0]?.replace(/^www\./i, "").toLowerCase() ?? "";
  return h === "edgebs.fr";
}

export function shouldSkipEdgeBsMiddleware(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  if (STATIC_FILE_RE.test(pathname)) return true;
  return false;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isEdgeBsMarketingPath(pathname: string): boolean {
  return EDGE_BS_PUBLIC_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function isEdgeBsOnlineCatalogPath(pathname: string): boolean {
  return (
    pathname === "/edgeonline" ||
    pathname.startsWith("/edgeonline/") ||
    pathname === "/formations" ||
    pathname.startsWith("/formations/")
  );
}

/** /edge-lab/foo → /foo si foo est une route marketing publique (pas les assets). */
export function edgeLabToCleanPath(pathname: string): string | null {
  if (!pathname.startsWith(`${EDGE_LAB_PREFIX}/`)) return null;
  if (STATIC_FILE_RE.test(pathname)) return null;
  const stripped = pathname.slice(EDGE_LAB_PREFIX.length);
  if (!stripped || stripped === "/") return "/";
  if (!isEdgeBsMarketingPath(stripped)) return null;
  return stripped;
}

/**
 * Routage edgebs.fr : redirects propres + rewrites internes.
 * Retourne null si aucune règle ne s'applique.
 */
export function handleEdgeBsRouting(request: NextRequest): NextResponse | null {
  const url = request.nextUrl;
  const pathname = url.pathname;

  if (shouldSkipEdgeBsMiddleware(pathname)) {
    return null;
  }

  if (pathname === EDGE_LAB_PREFIX || pathname === `${EDGE_LAB_PREFIX}/`) {
    return NextResponse.redirect(new URL(`/${url.search}`, request.url), 301);
  }

  const cleanTarget = edgeLabToCleanPath(pathname);
  if (cleanTarget) {
    return NextResponse.redirect(new URL(`${cleanTarget}${url.search}`, request.url), 301);
  }

  if (isEdgeBsOnlineCatalogPath(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-url-pathname", pathname);
    requestHeaders.set("x-org-slug", "edgelab");
    requestHeaders.set("x-site-tenant", "edgeonline");

    const rewriteUrl = url.clone();
    if (pathname === "/edgeonline" || pathname.startsWith("/edgeonline/")) {
      rewriteUrl.pathname = pathname;
    } else {
      rewriteUrl.pathname = `/edgeonline${pathname}`.replace(/\/{2,}/g, "/");
    }
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  if (pathname === "/" || isEdgeBsMarketingPath(pathname)) {
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = pathname === "/" ? EDGE_LAB_PREFIX : `${EDGE_LAB_PREFIX}${pathname}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  return null;
}
