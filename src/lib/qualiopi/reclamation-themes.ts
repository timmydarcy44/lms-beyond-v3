export const RECLAMATION_THEMES = [
  "organisation",
  "outil_byound",
  "programmation",
  "contenu",
  "formateur",
  "autre",
] as const;

export type ReclamationTheme = (typeof RECLAMATION_THEMES)[number];

export const RECLAMATION_THEME_LABELS: Record<ReclamationTheme, string> = {
  organisation: "Organisation",
  outil_byound: "Outil Byound",
  programmation: "Programmation",
  contenu: "Contenu",
  formateur: "Formateur",
  autre: "Autre",
};

export function isReclamationTheme(value: string): value is ReclamationTheme {
  return (RECLAMATION_THEMES as readonly string[]).includes(value);
}

export function parseReclamationTheme(value: unknown): ReclamationTheme | null {
  const raw = String(value ?? "").trim();
  return isReclamationTheme(raw) ? raw : null;
}
