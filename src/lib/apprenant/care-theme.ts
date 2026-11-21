/** Palette Byound Care (LMS apprenant) — framboise, pas de vert. */
export const CARE_THEME = {
  bg: "#070B18",
  card: "#0F1428",
  border: "#1C2443",
  borderStrong: "#222B4D",
  text: "#F2F4FA",
  textSecondary: "#9AA3BD",
  textMuted: "#DADFEC",
  accent: "#FF5C8A",
  navActive: "#3A0F22",
  heroBorder: "#4A1E36",
  emergencyBorder: "#3A4566",
  subjects: {
    stress: "#FF5C8A",
    decision: "#8DB8FF",
    confiance: "#F2CF6B",
    equilibre: "#FFB86B",
    apprendre: "#C9C2FF",
    orienter: "#9AA3BD",
  },
} as const;

export type CareSubjectColorId = keyof typeof CARE_THEME.subjects;

/** Variables CSS réutilisables (scope `.care-theme`). */
export const CARE_THEME_CSS_VARS: Record<string, string> = {
  "--care-bg": CARE_THEME.bg,
  "--care-card": CARE_THEME.card,
  "--care-border": CARE_THEME.border,
  "--care-border-strong": CARE_THEME.borderStrong,
  "--care-text": CARE_THEME.text,
  "--care-text-secondary": CARE_THEME.textSecondary,
  "--care-text-muted": CARE_THEME.textMuted,
  "--care-accent": CARE_THEME.accent,
  "--care-nav-active": CARE_THEME.navActive,
  "--care-hero-border": CARE_THEME.heroBorder,
  "--care-emergency-border": CARE_THEME.emergencyBorder,
  "--care-subject-stress": CARE_THEME.subjects.stress,
  "--care-subject-decision": CARE_THEME.subjects.decision,
  "--care-subject-confiance": CARE_THEME.subjects.confiance,
  "--care-subject-equilibre": CARE_THEME.subjects.equilibre,
  "--care-subject-apprendre": CARE_THEME.subjects.apprendre,
  "--care-subject-orienter": CARE_THEME.subjects.orienter,
};

/** Photos hero optionnelles — absentes → dégradé framboise (pas de banque d’images). */
export const CARE_HERO_PHOTO_CANDIDATES = [
  "/care/hero-1.jpg",
  "/care/hero-2.jpg",
] as const;
