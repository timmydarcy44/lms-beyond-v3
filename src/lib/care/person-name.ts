const PARTICLES = new Set(["de", "du", "des", "la", "le", "von", "van"]);

function formatWord(word: string, index: number) {
  const lower = word.toLocaleLowerCase("fr-FR");
  if (index > 0 && PARTICLES.has(lower)) return lower;
  return lower.replace(/(^|[-'’])(\p{L})/gu, (_match, separator: string, char: string) => {
    return `${separator}${char.toLocaleUpperCase("fr-FR")}`;
  });
}

/** Casse normale pour un nom affiché (même règle que les écrans Care). */
export function formatPersonName(value: string | null | undefined) {
  const cleaned = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!cleaned || cleaned.includes("@")) return "";
  return cleaned.split(" ").map(formatWord).join(" ");
}

export function personInitials(firstName: string, lastName = "") {
  const first = formatPersonName(firstName);
  const last = formatPersonName(lastName);
  const a = first.charAt(0);
  const b = last.charAt(0) || first.charAt(1);
  return `${a}${b}`.toLocaleUpperCase("fr-FR");
}
