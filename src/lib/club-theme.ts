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

const DEFAULT_SLUG = "bayeux-fc";

export const CLUB_THEMES: Record<string, ClubTheme> = {
  "bayeux-fc": {
    app_name: "Bayeux FC",
    nom: "Bayeux FC",
    slug: "bayeux-fc",
    logo_url: null,
    logo_initiales: "BFC",
    /** Jaune club — remplace l’ancien rouge. */
    couleur_primaire: "#EAB308",
    couleur_secondaire: "#1B2A4A",
    couleur_accent: "#FFFFFF",
    couleur_texte: "#0d1b2e",
    ville: "Bayeux",
    division: "N3 — Normandie",
  },
  /** Alias rétrocompat pour d’anciens slugs démo. */
  "su-dives-cabourg": {
    app_name: "Bayeux FC",
    nom: "Bayeux FC",
    slug: "bayeux-fc",
    logo_url: null,
    logo_initiales: "BFC",
    couleur_primaire: "#EAB308",
    couleur_secondaire: "#1B2A4A",
    couleur_accent: "#FFFFFF",
    couleur_texte: "#0d1b2e",
    ville: "Bayeux",
    division: "N3 — Normandie",
  },
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
