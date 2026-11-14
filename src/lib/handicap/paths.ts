/** URL publique de l’espace référente (hors shell Control, pour laisser entrer la référente OF). */
export const HANDICAP_BASE = "/handicap";

export function handicapPath(subpath = ""): string {
  const rest = subpath.startsWith("/") ? subpath : subpath ? `/${subpath}` : "";
  return `${HANDICAP_BASE}${rest}`;
}
