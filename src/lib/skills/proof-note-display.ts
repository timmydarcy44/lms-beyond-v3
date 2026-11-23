/**
 * Affichage apprenant des notes d’analyse de preuve.
 * Refus : raison sobre, sans coaching (« Ajoute… », « Précise… »).
 */

const COACHING_LINE =
  /^(ajoute|ajoutez|précise|précisez|donne|donnez|indique|indiquez|complète|complétez|dépose|déposez|fournis|fournissez|il faut|tu peux|vous pouvez)\b/i;

export function formatProofNoteForLearner(
  note: string | null | undefined,
  status: "refused" | "needs_more" | "validated" | "pending" | string,
): string | null {
  const raw = String(note ?? "").trim();
  if (!raw) return null;
  if (status !== "refused") return raw;

  const sentences = raw
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const kept = sentences.filter((s) => !COACHING_LINE.test(s));
  const sober = (kept.length ? kept : sentences.slice(0, 1)).join(" ").trim();
  if (!sober) {
    return "Preuve refusée : le contenu ne démontre pas cette compétence.";
  }
  // Couper si un « pour valider » / « pour obtenir » reste trop directive
  return sober
    .replace(/\s*(Pour (valider|obtenir|avancer)[^.!?]*[.!?]?)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
