/**
 * Filtre objectifs / texte de présentation manifestement placeholders (brouillon côté apprenant).
 */
function trimLine(s: string): string {
  return String(s ?? "")
    .replace(/\u00a0/g, " ")
    .trim();
}

/** Objectif à masquer : trop court, répétition d’un seul caractère, « test », etc. */
export function isPlaceholderObjective(raw: unknown): boolean {
  const t = trimLine(String(raw ?? ""));
  if (t.length < 3) return true;
  if (/^test$/i.test(t)) return true;
  if (/^(f|x|\.|-)+$/i.test(t)) return true;
  // « FFFF », « aaaa »
  if (/^(.)\1{2,}$/i.test(t)) return true;
  return false;
}

export function filterDisplayObjectifs(raw: unknown[] | null | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((o) => trimLine(String(o ?? ""))).filter((t) => t.length > 0 && !isPlaceholderObjective(t));
}

/** Découpe la présentation en paragraphes lisibles (double saut de ligne ou phrases longues). */
export function splitPresentationParagraphs(raw: string | null | undefined): string[] {
  const full = trimLine(String(raw ?? ""));
  if (!full) return [];
  const byDouble = full
    .split(/\n\s*\n/g)
    .map((p) => trimLine(p))
    .filter(Boolean);
  if (byDouble.length > 1) return byDouble;
  // Un seul bloc très long : couper sur les phrases si > 400 car.
  if (full.length <= 400) return [full];
  const sentences = full.split(/(?<=[.!?])\s+/).map(trimLine).filter(Boolean);
  if (sentences.length > 1) return sentences;
  return [full];
}
