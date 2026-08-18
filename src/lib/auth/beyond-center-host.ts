/** Hostname helpers for Beyond Center vs EDGE product surfaces. */

export function normalizeRequestHost(host: string | null | undefined): string {
  return (host ?? "").split(":")[0]?.replace(/^www\./i, "").toLowerCase() ?? "";
}

/** Site marketing / club Beyond Center. */
export function isBeyondCenterHostname(host: string | null | undefined): boolean {
  return normalizeRequestHost(host) === "beyondcenter.fr";
}

export function isLocalDevHostname(host: string | null | undefined): boolean {
  const h = normalizeRequestHost(host);
  return h === "localhost" || h === "127.0.0.1";
}

/** EDGE product domains — club / partenaire dashboards must not be served here. */
export function isEdgeProductHostname(host: string | null | undefined): boolean {
  const h = normalizeRequestHost(host);
  return h === "edgebs.fr" || h === "edgeonline.fr";
}

/**
 * Club & partenaire dashboards: beyondcenter.fr only.
 * Localhost is allowed so the surfaces can be developed without a hosts file.
 */
export function canServeClubPartenaireDashboards(host: string | null | undefined): boolean {
  return isBeyondCenterHostname(host) || isLocalDevHostname(host);
}

export function isClubDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard/club" || pathname.startsWith("/dashboard/club/");
}

export function isPartenaireDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard/partenaire" || pathname.startsWith("/dashboard/partenaire/");
}
