/** URL publique de l’espace référente (hors shell Control, pour laisser entrer la référente OF). */
export const HANDICAP_BASE = "/handicap";

export function handicapPath(subpath = ""): string {
  const rest = subpath.startsWith("/") ? subpath : subpath ? `/${subpath}` : "";
  return `${HANDICAP_BASE}${rest}`;
}

/**
 * Ouvre un dossier sur la page d’accueil Handicap (?dossier=).
 * Évite le segment dynamique /personnes/[id] qui 404 en soft-nav / sur certains hosts.
 */
export function handicapCasePath(caseId: string): string {
  const id = String(caseId ?? "").trim();
  if (!id) return HANDICAP_BASE;
  return `${HANDICAP_BASE}?dossier=${encodeURIComponent(id)}`;
}
