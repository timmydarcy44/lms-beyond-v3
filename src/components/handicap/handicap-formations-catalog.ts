/** Formations affichées sous /dashboard/ecole/handicap/formations */
export type HandicapFormationCard = {
  slug: string;
  title: string;
  subtitle: string;
  durationLabel: string;
  badge?: string;
};

export const HANDICAP_FORMATIONS_CATALOG: HandicapFormationCard[] = [
  {
    slug: "referent-handicap-certifie-beyond",
    title: "Référent Handicap Certifié Beyond",
    subtitle:
      "Neurosciences cliniques et outils pratiques — 4 blocs, 14 modules, certification Open Badge.",
    durationLabel: "~60 h · 100 % en ligne",
    badge: "Certifiante",
  },
  {
    slug: "sensibilisation-equipes-inclusion",
    title: "Sensibilisation équipes — inclusion",
    subtitle: "Bases de la diversité cognitive et du droit du travail adapté (parcours d’introduction).",
    durationLabel: "~8 h · accès court",
    badge: "Bientôt",
  },
];
