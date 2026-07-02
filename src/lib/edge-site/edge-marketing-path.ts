import { MARKETING_PAGE_REGISTRY } from "@/lib/edge-site/marketing-page-registry";
import type { EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { EDGE_MARKETING_PATHS } from "@/lib/edge-site/marketing-routes";

export const EDGE_LAB_INTERNAL_PREFIX = "/edge-lab";

/** Chemins publics historiques (hors registre marketing premium). */
export const EDGE_BS_LEGACY_PUBLIC_PREFIXES = [
  "/parcours",
  "/edge-online",
  "/online",
  "/entreprises",
  "/tarifs",
  "/orientation",
  "/votre-orientation",
  "/postuler",
] as const;

export function isEdgeBsPublicHost(host: string | null | undefined): boolean {
  const h = host?.split(":")[0]?.replace(/^www\./i, "").toLowerCase() ?? "";
  return h === "edgebs.fr";
}

/** Préfixe affiché dans les liens : vide sur edgebs.fr, /edge-lab en local. */
export function edgeLinkBase(host: string | null | undefined): string {
  if (isEdgeBsPublicHost(host)) return "";
  if (typeof window !== "undefined" && isEdgeBsPublicHost(window.location.host)) return "";
  return EDGE_LAB_INTERNAL_PREFIX;
}

export function edgeMarketingHref(path: string, host?: string | null): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const base = edgeLinkBase(host);
  if (base === "") return path;
  if (path === "/") return base;
  return `${base}${path}`;
}

export function matchesPublicPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isEdgeLabStaticAsset(pathname: string): boolean {
  return /\.(png|jpe?g|webp|svg|ico|pdf|gif)$/i.test(pathname);
}

/** Chemins edgebs.fr réécrits vers /edge-lab/* (hors catalogue /formations → edgeonline). */
export function getEdgeBsMarketingRewritePrefixes(): string[] {
  const fromRegistry = MARKETING_PAGE_REGISTRY.map((entry) => `/${entry.path}`);
  const filtered = fromRegistry.filter(
    (path) => path !== "/formations" && !path.startsWith("/formations/"),
  );
  return [...new Set([...EDGE_BS_LEGACY_PUBLIC_PREFIXES, ...filtered])];
}

export function isEdgeBsMarketingPublicPath(pathname: string): boolean {
  return getEdgeBsMarketingRewritePrefixes().some((prefix) =>
    matchesPublicPrefix(pathname, prefix),
  );
}

/** true si /edge-lab/foo doit rediriger vers /foo sur edgebs.fr. */
export function shouldStripEdgeLabPrefix(pathname: string): boolean {
  if (!pathname.startsWith(`${EDGE_LAB_INTERNAL_PREFIX}/`)) return false;
  if (isEdgeLabStaticAsset(pathname)) return false;
  const stripped = pathname.slice(EDGE_LAB_INTERNAL_PREFIX.length) || "/";
  return stripped === "/" || isEdgeBsMarketingPublicPath(stripped);
}

export function resolveMarketingContentHref(
  path: string,
  routes: EdgeMarketingRoutes,
): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;

  const hashIndex = path.indexOf("#");
  const pathOnly = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";

  for (const [key, segment] of Object.entries(EDGE_MARKETING_PATHS)) {
    const segmentPath = segment.split("#")[0];
    if (segmentPath === pathOnly || segment === path) {
      const resolved = routes[key as keyof EdgeMarketingRoutes];
      return hash ? `${resolved.split("#")[0]}${hash}` : resolved;
    }
  }

  return path;
}
