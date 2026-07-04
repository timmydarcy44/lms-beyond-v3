/** Tarifs coaching particulier EDGE — modifiables sans redéploiement UI si exposés via env plus tard. */

export const EDGE_PARTICULIER_COACHING = {
  restitution: {
    title: "Restitution personnalisée",
    duration: "45 minutes",
    features: [
      "Analyse de votre Profil comportemental EDGE",
      "Lecture du rapport",
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
      "Progression vers votre objectif",
    ],
    priceLabel: process.env.NEXT_PUBLIC_EDGE_COACHING_ACCOMPAGNEMENT_PRICE ?? "Sur devis",
    ctaLabel: "Découvrir l'accompagnement",
    href: "/dashboard/apprenant/coaching?offre=accompagnement",
  },
} as const;

export const FREE_RESOURCES_PLACEHOLDERS = [
  {
    type: "Micro-ressource",
    title: "Exercice express — reformuler avec assertivité",
    description: "3 scénarios guidés pour pratiquer une communication claire en 10 minutes.",
  },
  {
    type: "Vidéo",
    title: "Comprendre votre style de fonctionnement",
    description: "8 minutes pour lire vos résultats DISC et en tirer des actions concrètes.",
  },
  {
    type: "Défi 7 jours",
    title: "Structurer votre semaine professionnelle",
    description: "Un rituel quotidien court pour renforcer organisation et sérénité.",
  },
] as const;
