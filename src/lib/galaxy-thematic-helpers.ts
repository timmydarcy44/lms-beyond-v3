/** Clé de comparaison thématique (casse, accents) — regroupement apprenant & builder. */
export function normalizeThematicKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Valeur du <select> thématique : `category_id` si connu, sinon correspondance de libellé
 * (y compris insensible à la casse / accents).
 */
export function resolveThematicBuilderSelectValue(
  categoryId: string | null | undefined,
  category: string | null | undefined,
  thematics: Array<{ id: string; name: string }>,
): string {
  const id = String(categoryId ?? "").trim();
  if (id && thematics.some((c) => c.id === id)) return id;
  const name = String(category ?? "").trim();
  if (name) {
    const n = normalizeThematicKey(name);
    const m =
      thematics.find((c) => c.name === name) ??
      thematics.find((c) => normalizeThematicKey(c.name) === n);
    if (m) return m.id;
  }
  return "";
}
