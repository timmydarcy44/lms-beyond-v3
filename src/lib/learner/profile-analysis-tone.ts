/** Mots et tournures interdits dans les synthèses EDGE (ton sobre, factuel). */
export const PROFILE_ANALYSIS_FORBIDDEN_PATTERNS: RegExp[] = [
  /\bexceptionnel(?:le|les|lement)?\b/gi,
  /\bfantastique?s?\b/gi,
  /\bremarquable?s?\b/gi,
  /\bextraordinaire?s?\b/gi,
  /\bincroyable?s?\b/gi,
  /\bformidable?s?\b/gi,
  /\bsensationnel(?:le|les)?\b/gi,
  /\bépoustouflant(?:e|es)?\b/gi,
  /\bmagnifique?s?\b/gi,
  /\bparfait(?:e|es|ement)?\b/gi,
  /\bunique?s?\b/gi,
  /\bsommets?\b/gi,
  /\bcoach de vie\b/gi,
  /\bparcours exceptionnel\b/gi,
  /\bprofessionnel équilibré\b/gi,
  /\bfabuleux(?:se|ses)?\b/gi,
  /\bprodigieux(?:se|ses)?\b/gi,
  /\béblouissant(?:e|es)?\b/gi,
  /\bextraordinairement\b/gi,
];

export const PROFILE_ANALYSIS_TONE_PROMPT_LINES = [
  "- Ton EDGE : direct, sobre, factuel — jamais sensationnaliste ni marketing",
  "- Interdits : exceptionnel, fantastique, remarquable, extraordinaire, incroyable, formidable, magnifique, parfait, unique, sommets, fabuleux, prodigieux, coach de vie, parcours exceptionnel, professionnel équilibré",
  "- Pas de point d'exclamation",
  "- Formulations mesurées : « solide », « cohérent », « structuré », « en progression »",
];

export function sanitizeProfileAnalysisTone(text: string): string {
  let result = text;
  for (const pattern of PROFILE_ANALYSIS_FORBIDDEN_PATTERNS) {
    result = result.replace(pattern, (match) => {
      const lower = match.toLowerCase();
      if (lower.startsWith("parfait")) return "solide";
      if (lower.startsWith("unique")) return "distinctif";
      if (lower.includes("exceptionnel")) return "marqué";
      if (lower.includes("fantastique")) return "notable";
      if (lower.includes("remarquable")) return "notable";
      if (lower.includes("extraordinaire")) return "marqué";
      if (lower.includes("incroyable")) return "notable";
      if (lower.includes("formidable")) return "solide";
      if (lower.includes("magnifique")) return "claire";
      if (lower.includes("fabuleux")) return "solide";
      if (lower.includes("prodigieux")) return "marqué";
      return "notable";
    });
  }
  return result.replace(/\s{2,}/g, " ").trim();
}
