import type { EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

export type HeaderPrimaryCta = {
  label: string;
  href: string;
};

/** Normalise pathname (strip /edge-lab en local). */
export function normalizeMarketingPathname(pathname: string | null | undefined): string {
  const raw = (pathname ?? "/").split("?")[0] || "/";
  if (raw === "/edge-lab" || raw.startsWith("/edge-lab/")) {
    const stripped = raw.slice("/edge-lab".length) || "/";
    return stripped.startsWith("/") ? stripped : `/${stripped}`;
  }
  return raw;
}

/**
 * CTA header path-aware :
 * - école / alternance / candidature → Candidater
 * - entreprises / business / tarifs → Créer un compte (B2B)
 * - home & pages ambiguës → Rejoindre (chooser 3 portes)
 */
export function resolveHeaderPrimaryCta(
  pathname: string | null | undefined,
  routes: EdgeMarketingRoutes,
): HeaderPrimaryCta {
  const path = normalizeMarketingPathname(pathname);

  if (
    path === "/ecole" ||
    path.startsWith("/ecole/") ||
    path === "/alternance" ||
    path.startsWith("/alternance/") ||
    path === "/postuler" ||
    path.startsWith("/postuler/") ||
    path === "/admissions" ||
    path.startsWith("/admissions/") ||
    path === "/vie-etudiante" ||
    path.startsWith("/vie-etudiante/") ||
    path.startsWith("/formations/bachelor") ||
    path.startsWith("/formations/bts") ||
    path.startsWith("/formations/mastere")
  ) {
    return { label: "Candidater", href: routes.ecoleCandidater };
  }

  if (
    path === "/entreprises" ||
    path.startsWith("/entreprises/") ||
    path === "/business" ||
    path.startsWith("/business/") ||
    path === "/tarifs" ||
    path.startsWith("/tarifs/")
  ) {
    return { label: "Créer un compte", href: routes.entrepriseSignup };
  }

  return { label: "Rejoindre", href: routes.rejoindre };
}

/** Connexion secondaire adaptée au contexte. */
export function resolveHeaderLoginHref(
  pathname: string | null | undefined,
  routes: EdgeMarketingRoutes,
): string {
  const path = normalizeMarketingPathname(pathname);
  const school = resolveHeaderPrimaryCta(path, routes).label === "Candidater";
  if (school) return "/particuliers/login";
  if (
    path === "/entreprises" ||
    path.startsWith("/entreprises/") ||
    path === "/business" ||
    path.startsWith("/business/") ||
    path === "/tarifs" ||
    path.startsWith("/tarifs/")
  ) {
    return `${routes.entrepriseSignup}?mode=login`;
  }
  return routes.login;
}
