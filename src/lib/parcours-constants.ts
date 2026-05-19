export type ParcoursFamille = "performance" | "leadership" | "humain" | "innovation";

export type ParcoursNiveau = "fondateur" | "praticien" | "expert";

export const FAMILLE_LABELS: Record<ParcoursFamille, string> = {
  performance: "Performance commerciale",
  leadership: "Leadership & Management",
  humain: "Développement humain",
  innovation: "Innovation & Produit",
};

export const NIVEAU_LABELS: Record<ParcoursNiveau, string> = {
  fondateur: "Fondateur",
  praticien: "Praticien",
  expert: "Expert",
};
