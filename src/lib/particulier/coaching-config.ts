/** Tarifs accompagnement particulier EDGE — configurables via variables d'environnement. */

export const EDGE_PARTICULIER_COACHING = {
  restitution: {
    title: "Restitution personnalisée",
    duration: "45 minutes",
    features: [
      "Analyse de votre Profil comportemental EDGE",
      "Lecture du rapport et du métier cible",
      "Plan d'action prioritaire",
    ],
    priceLabel: process.env.NEXT_PUBLIC_EDGE_COACHING_RESTITUTION_PRICE ?? "À partir de 89 €",
    ctaLabel: "Réserver une restitution",
    href: "/dashboard/apprenant/coaching?offre=restitution",
  },
  accompagnement: {
    title: "Accompagnement EDGE",
    duration: "Plusieurs séances",
    features: [
      "Suivi personnalisé",
      "Exercices ciblés",
      "Progression vers votre métier cible",
    ],
    priceLabel: process.env.NEXT_PUBLIC_EDGE_COACHING_ACCOMPAGNEMENT_PRICE ?? "Sur devis",
    ctaLabel: "Découvrir l'accompagnement",
    href: "/dashboard/apprenant/coaching?offre=accompagnement",
  },
} as const;
