/** Palette Lot 2 — Espace Byound Handicap (accent = framboise Byound Care). */
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
  /** Rose framboise Care (`--care-accent`). */
  accent: "#CE0058",
  accentDark: "#8E003D",
  /** Texte / icônes sur fond accent. */
  accentOn: "#FFFFFF",
  accentSoft: "rgba(206,0,88,0.14)",
  accentSoftBorder: "rgba(206,0,88,0.28)",
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

export const STATUS_PILL: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(206,0,88,0.16)", color: "#CE0058" },
  plan: { bg: "rgba(206,0,88,0.16)", color: "#CE0058" },
  request: { bg: "rgba(242,207,107,0.15)", color: "#F2CF6B" },
  interview: { bg: "rgba(141,184,255,0.15)", color: "#8DB8FF" },
  review: { bg: "rgba(141,184,255,0.15)", color: "#8DB8FF" },
  closed: { bg: "rgba(108,117,147,0.2)", color: "#6C7593" },
};
