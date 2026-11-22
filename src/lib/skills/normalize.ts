/** Normalise un libellé pour comparaison (minuscules, sans accents ni ponctuation). */
export function normalizeSkillText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
