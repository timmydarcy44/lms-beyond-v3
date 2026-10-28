import { bareHostname } from "@/lib/edge-site/byound-host";

/** Origine canonique du site public Byound Care (domaine Vercel). */
export const CARE_PUBLIC_ORIGIN = "https://byoundcare.fr";

export const CARE_PUBLIC_PREFIXES = ["/praticiens", "/reserver", "/reservation"] as const;

export function isByoundCareHostname(host: string | null | undefined) {
  return bareHostname(host) === "byoundcare.fr";
}

export function isByoundCareWwwHostname(host: string | null | undefined) {
  return host?.split(":")[0]?.toLowerCase() === "www.byoundcare.fr";
}

export function careAppToPublicPath(pathname: string) {
  if (pathname === "/care" || pathname === "/care/") return "/";
  if (pathname.startsWith("/care/")) return pathname.slice("/care".length) || "/";
  return pathname;
}

export function carePublicToAppPath(pathname: string) {
  if (pathname === "/" || pathname === "") return "/care";
  return `/care${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function isCarePublicPath(pathname: string) {
  if (pathname === "/") return true;
  return CARE_PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function toCareHref(href: string, publicHost: boolean) {
  if (!publicHost || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return href;
  }
  const url = new URL(href, CARE_PUBLIC_ORIGIN);
  if (url.pathname === "/care" || url.pathname.startsWith("/care/")) {
    url.pathname = careAppToPublicPath(url.pathname);
  }
  if (url.searchParams.get("from") === "/care") url.searchParams.set("from", "/");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function careAbsoluteUrl(internalPath: string) {
  const [pathAndQuery, hash] = internalPath.split("#");
  const [path, query] = pathAndQuery.split("?");
  const publicPath = careAppToPublicPath(path || "/");
  const search = query ? `?${query}` : "";
  const fragment = hash ? `#${hash}` : "";
  return `${CARE_PUBLIC_ORIGIN}${publicPath === "/" ? "/" : publicPath}${search}${fragment}`;
}
