/** Palette Lot 2 — Espace Byound Handicap */
export const HANDICAP_THEME = {
  bg: "#0A0F1E",
  sidebar: "#080C19",
  card: "#111831",
  inner: "#0B1122",
  border: "#1A2340",
  borderSoft: "#26304F",
  text: "#F2F4FA",
  muted: "#9AA3BD",
  tertiary: "#6C7593",
  accent: "#5EDCC3",
  accentDark: "#14836E",
  green: "#6BE39B",
  amber: "#F2CF6B",
  blue: "#8DB8FF",
  violet: "#C9C2FF",
  red: "#FF8A9B",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  request: "Demande",
  interview: "Entretien",
  plan: "Plan",
  active: "Plan actif",
  review: "Évaluation",
  closed: "Clos",
};
