export type ClubPrestation = {
  id: string;
  label: string;
  price: number | null;
  description?: string;
  /** Nombre d'emplacements disponibles (1 = exclusif). */
  quantity: number;
};

export type ClubPrestationCategory = "matchday" | "training" | "digital" | "stade" | "dives";

export const CLUB_PRESTATION_CATALOG: Record<ClubPrestationCategory, ClubPrestation[]> = {
  matchday: [
    { id: "maillot-principal", label: "Sponsor maillot principal", price: 30000, quantity: 1 },
    { id: "maillot-manche-droite", label: "Sponsor maillot manche droite", price: 8000, quantity: 1 },
    { id: "maillot-manche-gauche", label: "Sponsor maillot manche gauche", price: 8000, quantity: 1 },
    { id: "maillot-dos-haut", label: "Sponsor maillot dos haut", price: 10000, quantity: 1 },
    { id: "maillot-dos-bas", label: "Sponsor maillot dos bas", price: 6000, quantity: 1 },
    { id: "short-avant-droit", label: "Sponsor short avant droit", price: 4000, quantity: 1 },
    { id: "short-avant-gauche", label: "Sponsor short avant gauche", price: 4000, quantity: 1 },
    { id: "short-arriere-droit", label: "Sponsor short arrière droit", price: 3000, quantity: 1 },
    { id: "short-arriere-gauche", label: "Sponsor short arrière gauche", price: 3000, quantity: 1 },
    { id: "veste-echauffement", label: "Sponsor veste échauffement", price: 5000, quantity: 1 },
    { id: "sac-equipe", label: "Sponsor sac équipe", price: 3000, quantity: 1 },
  ],
  training: [
    { id: "training-principal", label: "Sponsor maillot training principal", price: 12000, quantity: 1 },
    { id: "training-manche-droite", label: "Sponsor maillot training manche droite", price: 4000, quantity: 1 },
    { id: "training-manche-gauche", label: "Sponsor maillot training manche gauche", price: 4000, quantity: 1 },
    { id: "training-short-avant", label: "Sponsor short training avant", price: 3000, quantity: 1 },
    { id: "training-short-arriere", label: "Sponsor short training arrière", price: 3000, quantity: 1 },
    { id: "training-veste", label: "Sponsor veste training", price: 4000, quantity: 1 },
    { id: "training-pantalon", label: "Sponsor pantalon training", price: 2000, quantity: 1 },
  ],
  digital: [
    { id: "digital-logo", label: "Logo espace partenaire site web", price: 2000, quantity: 12 },
    { id: "digital-matchday", label: "Pack match day (story + post)", price: 3000, quantity: 20 },
    { id: "digital-week", label: "Pack week (2 posts/semaine)", price: 5000, quantity: 8 },
    { id: "digital-newsletter", label: "Naming newsletter", price: 2500, quantity: 1 },
  ],
  stade: [
    { id: "stade-3x1", label: "Panneau bord terrain 3m x 1m", price: 2500, quantity: 20 },
    { id: "stade-6x1", label: "Panneau bord terrain 6m x 1m", price: 4000, quantity: 10 },
    { id: "stade-bache", label: "Bâche tribune 5m x 2m", price: 6000, quantity: 8 },
    { id: "stade-presse", label: "Naming salle de presse", price: 8000, quantity: 1 },
  ],
  dives: [{ id: "dives-platform", label: "Accès plateforme Beyond Network", price: null, quantity: 99 }],
};

export const CLUB_PRESTATION_SECTIONS: { id: string; key: ClubPrestationCategory; title: string }[] = [
  { id: "match-day", key: "matchday", title: "Match Day — Maillot & Équipement" },
  { id: "training", key: "training", title: "Training" },
  { id: "digital", key: "digital", title: "Digital" },
  { id: "stade", key: "stade", title: "Stade" },
  { id: "dives", key: "dives", title: "Dives Développement" },
];

export function flattenClubPrestations(catalog = CLUB_PRESTATION_CATALOG): ClubPrestation[] {
  return Object.values(catalog).flat();
}

export type SelectedClubPrestation = {
  id: string;
  label: string;
  price: number | null;
};

export function formatPrestationLine(item: SelectedClubPrestation): string {
  if (item.price === null) return `${item.label} (INCLUS)`;
  return `${item.label} (${item.price.toLocaleString("fr-FR")}€)`;
}

export function parsePrestationLines(lines: string[]): SelectedClubPrestation[] {
  const catalog = flattenClubPrestations();
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const priced = line.match(/^(.*?)\s*\(([\d\s]+(?:[.,]\d+)?)€\)$/);
      const inclus = line.match(/^(.*?)\s*\(INCLUS\)$/i);
      if (priced) {
        const label = priced[1].trim();
        const price = Number(priced[2].replace(/\s/g, "").replace(",", "."));
        const found = catalog.find((item) => item.label === label);
        return { id: found?.id ?? `custom-${label}`, label, price: Number.isFinite(price) ? price : null };
      }
      if (inclus) {
        const label = inclus[1].trim();
        const found = catalog.find((item) => item.label === label);
        return { id: found?.id ?? `custom-${label}`, label, price: null };
      }
      const found = catalog.find(
        (item) => item.label === line || item.label.toLowerCase() === line.toLowerCase()
      );
      if (found) return { id: found.id, label: found.label, price: found.price };
      return { id: `custom-${line}`, label: line, price: null };
    });
}
