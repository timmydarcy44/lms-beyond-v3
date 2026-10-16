/** Domaine public du site Byound. */
export const BYOUND_PUBLIC_ORIGIN = "https://www.byound.fr";

export function bareHostname(host: string | null | undefined): string {
  return host?.split(":")[0]?.replace(/^www\./i, "").toLowerCase() ?? "";
}

/** edgebs.fr et byound.fr servent le même site. Les liens publics sont canoniques sur www.byound.fr. */
export function isByoundMarketingHost(host: string | null | undefined): boolean {
  const name = bareHostname(host);
  return name === "byound.fr" || name === "edgebs.fr";
}

export function isByoundCanonicalHost(host: string | null | undefined): boolean {
  return host?.split(":")[0]?.toLowerCase() === "www.byound.fr";
}
