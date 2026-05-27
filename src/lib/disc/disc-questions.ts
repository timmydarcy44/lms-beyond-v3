export type DiscLabel = "D" | "I" | "S" | "C";

export const DISC_QUESTIONS: Array<{ options: Array<{ t: string; v: DiscLabel }> }> = [
  { options: [{ t: "J'agis vite pour des résultats", v: "D" }, { t: "J'enthousiasme les autres", v: "I" }, { t: "Je garde un rythme stable", v: "S" }, { t: "Je vérifie la précision", v: "C" }] },
  { options: [{ t: "J'analyse logiquement", v: "C" }, { t: "Je suis à l'écoute", v: "S" }, { t: "Je vais droit au but", v: "D" }, { t: "Je suis amical", v: "I" }] },
  { options: [{ t: "J'aime la routine claire", v: "S" }, { t: "J'aime être reconnu", v: "I" }, { t: "Je respecte les règles", v: "C" }, { t: "Je prends des risques", v: "D" }] },
  { options: [{ t: "Je perds patience vite", v: "D" }, { t: "Je déteste l'improvisation", v: "C" }, { t: "Je déteste être seul", v: "I" }, { t: "Je cherche l'harmonie", v: "S" }] },
  { options: [{ t: "Je suis loyal/fiable", v: "S" }, { t: "Je décide avec assurance", v: "D" }, { t: "Je vérifie la qualité", v: "C" }, { t: "Je motive par l'optimisme", v: "I" }] },
  { options: [{ t: "J'aime influencer", v: "I" }, { t: "Je suis les protocoles", v: "C" }, { t: "Je contrôle la situation", v: "D" }, { t: "Je suis prévisible", v: "S" }] },
  { options: [{ t: "Je suis patient", v: "S" }, { t: "Je suis compétitif", v: "D" }, { t: "J'aime convaincre", v: "I" }, { t: "J'analyse les preuves", v: "C" }] },
  { options: [{ t: "Je suis réservé", v: "C" }, { t: "Je suis discret", v: "S" }, { t: "Je suis direct", v: "D" }, { t: "J'exprime mes émotions", v: "I" }] },
  { options: [{ t: "Focus Résultats", v: "D" }, { t: "Focus Méthodes", v: "S" }, { t: "Focus Logique", v: "C" }, { t: "Focus Relation", v: "I" }] },
  { options: [{ t: "Je suis charismatique", v: "I" }, { t: "Je suis pointilleux", v: "C" }, { t: "Je suis déterminé", v: "D" }, { t: "Je suis posé", v: "S" }] },
  { options: [{ t: "J'aime collaborer", v: "I" }, { t: "J'aime l'autonomie", v: "D" }, { t: "J'aime la structure", v: "C" }, { t: "J'aime la bienveillance", v: "S" }] },
  { options: [{ t: "Je demande de la rigueur", v: "C" }, { t: "Je fais des compliments", v: "I" }, { t: "Je pousse au dépassement", v: "D" }, { t: "Je sécurise les autres", v: "S" }] },
  { options: [{ t: "Je suis instinctif", v: "I" }, { t: "Je suis systématique", v: "C" }, { t: "Je décide vite", v: "D" }, { t: "Je prends mon temps", v: "S" }] },
  { options: [{ t: "Haine du changement", v: "S" }, { t: "Haine de l'erreur", v: "D" }, { t: "Haine du désordre", v: "C" }, { t: "Haine de l'isolement", v: "I" }] },
  { options: [{ t: "Focus Chiffres", v: "C" }, { t: "Focus Objectifs", v: "D" }, { t: "Focus Plaisir", v: "I" }, { t: "Focus Expérience", v: "S" }] },
  { options: [{ t: "Coéquipier fiable", v: "S" }, { t: "Leader directif", v: "D" }, { t: "Expert technique", v: "C" }, { t: "Animateur né", v: "I" }] },
  { options: [{ t: "Besoin de perfection", v: "C" }, { t: "Besoin de calme", v: "S" }, { t: "Besoin d'exigence", v: "D" }, { t: "Besoin de nouveauté", v: "I" }] },
  { options: [{ t: "Réagit par l'émotion", v: "I" }, { t: "Réagit par la critique", v: "C" }, { t: "Réagit par l'agacement", v: "D" }, { t: "Réagit par le retrait", v: "S" }] },
  { options: [{ t: "Valeur : Patience", v: "S" }, { t: "Valeur : Logique", v: "C" }, { t: "Valeur : Force", v: "D" }, { t: "Valeur : Créativité", v: "I" }] },
  { options: [{ t: "Priorité : Relation", v: "I" }, { t: "Priorité : Temps", v: "D" }, { t: "Priorité : Zéro erreur", v: "C" }, { t: "Priorité : Paix", v: "S" }] },
];

export const DISC_QUESTION_COUNT = DISC_QUESTIONS.length;
