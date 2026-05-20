/** Préfixe URL : vide sur edgeonline.fr (réécriture middleware) ; `/edgeonline` en dev ou sur les autres domaines (route App Router réelle). */
export type EdgeOnlineHrefPrefix = "" | "/edgeonline";

const EDGE_ONLINE_PUBLIC_HOSTS = new Set(["edgeonline.fr", "www.edgeonline.fr"]);
const EDGE_BS_HOSTS = new Set(["edgebs.fr", "www.edgebs.fr"]);

export function getEdgeOnlineHrefPrefixFromHost(hostHeader: string | null | undefined): EdgeOnlineHrefPrefix {
  const h = String(hostHeader ?? "")
    .split(",")[0]
    ?.trim()
    .split(":")[0]
    ?.toLowerCase() ?? "";
  if (EDGE_ONLINE_PUBLIC_HOSTS.has(h)) return "";
  if (EDGE_BS_HOSTS.has(h)) return "/edgeonline";
  return "/edgeonline";
}

/** Préfixe effectif : priorité au chemin affiché (edgeonline.fr), sinon au host (edgebs.fr). */
export function resolveEdgeOnlineHrefPrefix(
  pathname: string | null | undefined,
  hostHeader?: string | null,
): EdgeOnlineHrefPrefix {
  const fromPath = getEdgeOnlineHrefPrefixFromPathname(pathname);
  if (fromPath) return fromPath;
  return getEdgeOnlineHrefPrefixFromHost(hostHeader);
}

/**
 * Dans le navigateur : si l’URL affichée commence par `/edgeonline`, on doit préfixer les liens relatifs même sans connaître le host (évite hydration host-specific).
 */
export function getEdgeOnlineHrefPrefixFromPathname(pathname: string | null | undefined): EdgeOnlineHrefPrefix {
  const p = String(pathname ?? "");
  if (p === "/edgeonline" || p.startsWith("/edgeonline/")) return "/edgeonline";
  return "";
}

export function edgeOnlinePublicHref(path: string, prefix: EdgeOnlineHrefPrefix): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!prefix) return p;
  if (p === "/") return prefix;
  if (p === prefix || p.startsWith(`${prefix}/`)) return p;
  return `${prefix}${p}`.replace(/\/{2,}/g, "/");
}
