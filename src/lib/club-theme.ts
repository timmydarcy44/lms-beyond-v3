export const ESR_LOGO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Beyond/Football%20Club%20Rochelais.png";

/** Maroon from the Football Club Rochelais / ESR crest. */
export const ESR_PRIMARY = "#8B1A2B";
export const ESR_PRIMARY_DARK = "#5C1018";

export type ClubTheme = {
  /** Nom de la plateforme (sans logo). */
  app_name: string;
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

const DEFAULT_SLUG = "esr";

const ESR_THEME: ClubTheme = {
  app_name: "Football Club Rochelais",
  nom: "ESR",
  slug: "esr",
  logo_url: ESR_LOGO_URL,
  logo_initiales: "ESR",
  couleur_primaire: ESR_PRIMARY,
  couleur_secondaire: "#1A0A0D",
  couleur_accent: "#FFFFFF",
  couleur_texte: "#FFFFFF",
  ville: "La Rochelle",
  division: "Régional — Atlantique",
};

export const CLUB_THEMES: Record<string, ClubTheme> = {
  esr: ESR_THEME,
  "football-club-rochelais": { ...ESR_THEME, slug: "football-club-rochelais" },
  /** Alias rétrocompat (ancien thème démo). */
  "bayeux-fc": { ...ESR_THEME, slug: "bayeux-fc" },
  "su-dives-cabourg": { ...ESR_THEME, slug: "su-dives-cabourg" },
};

export function getClubTheme(slug: string): ClubTheme {
  return CLUB_THEMES[slug] ?? CLUB_THEMES[DEFAULT_SLUG];
}

export function getThemeVars(theme: ClubTheme): Record<string, string> {
  return {
    "--club-primary": theme.couleur_primaire,
    "--club-secondary": theme.couleur_secondaire,
    "--club-accent": theme.couleur_accent,
    "--club-text": theme.couleur_texte,
  };
}
