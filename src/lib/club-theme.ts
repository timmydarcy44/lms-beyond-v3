export type ClubTheme = {
  nom: string;
  slug: string;
  logo_url: string | null;
  logo_initiales: string;
  couleur_primaire: string;
  couleur_secondaire: string;
  couleur_accent: string;
  couleur_texte: string;
  ville: string;
  division: string;
};

export const CLUB_THEMES: Record<string, ClubTheme> = {
  "su-dives-cabourg": {
    nom: "SU Dives Cabourg",
    slug: "su-dives-cabourg",
    logo_url: null,
    logo_initiales: "SD",
    couleur_primaire: "#C8102E",
    couleur_secondaire: "#1B2A4A",
    couleur_accent: "#FFFFFF",
    couleur_texte: "#FFFFFF",
    ville: "Dives-sur-Mer",
    division: "N3 — Normandie",
  },
  "hac-football": {
    nom: "HAC Football",
    slug: "hac-football",
    logo_url: null,
    logo_initiales: "HAC",
    couleur_primaire: "#009AA6",
    couleur_secondaire: "#1A1A1A",
    couleur_accent: "#FFFFFF",
    couleur_texte: "#FFFFFF",
    ville: "Le Havre",
    division: "Ligue 1",
  },
};

export function getClubTheme(slug: string): ClubTheme {
  return CLUB_THEMES[slug] ?? CLUB_THEMES["su-dives-cabourg"];
}

export function getThemeVars(theme: ClubTheme): Record<string, string> {
  return {
    "--club-primary": theme.couleur_primaire,
    "--club-secondary": theme.couleur_secondaire,
    "--club-accent": theme.couleur_accent,
    "--club-text": theme.couleur_texte,
  };
}
