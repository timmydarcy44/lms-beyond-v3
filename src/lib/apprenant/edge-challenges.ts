/**
 * Défis EDGE — chaque compétence devient un défi jouable.
 * L'IA choisit dynamiquement le format ; ici on expose les formats
 * disponibles (front) et la terminologie officielle (jamais « simulation »).
 */

export const EDGE_CHALLENGE_TERMS = {
  challenge: "Défi EDGE",
  interactive: "Session interactive",
  interview: "Entretien EDGE",
  validation: "Validation EDGE",
  aiChallenge: "Challenge IA",
} as const;

export type EdgeChallengeFormat = {
  id: string;
  emoji: string;
  label: string;
  /** Durée indicative. */
  meta?: string;
};

/** Formats de défi proposés au clic sur une compétence. */
export const EDGE_CHALLENGE_FORMATS: EdgeChallengeFormat[] = [
  { id: "story", emoji: "🎤", label: "Raconter une expérience vécue", meta: "5 min" },
  { id: "situation", emoji: "💬", label: "Répondre à une situation professionnelle", meta: "10 min" },
  { id: "proof", emoji: "📄", label: "Déposer une preuve" },
  { id: "video", emoji: "🎥", label: "Envoyer une vidéo" },
  { id: "ai", emoji: "🧠", label: "Répondre aux questions de l'IA", meta: "10 min" },
  { id: "quickchallenge", emoji: "🎯", label: "Réaliser un défi de 10 minutes", meta: "10 min" },
];

/**
 * L'IA choisit dynamiquement un format « recommandé » selon la compétence.
 * (Front : sélection déterministe en attendant le moteur IA côté serveur.)
 */
export function pickRecommendedChallenge(skill: string): EdgeChallengeFormat {
  let hash = 0;
  for (let i = 0; i < skill.length; i += 1) hash = (hash + skill.charCodeAt(i)) % EDGE_CHALLENGE_FORMATS.length;
  return EDGE_CHALLENGE_FORMATS[hash];
}

/**
 * Variété du coach IA : angles d'interaction possibles (jamais toujours les
 * mêmes questions). Utilisé pour présenter ce que le défi peut contenir.
 */
export const EDGE_COACH_ANGLES = [
  "Raconter une expérience",
  "Justifier une décision",
  "Convaincre",
  "Répondre à une objection",
  "Face à un recruteur",
  "Face à un client",
  "Donner un exemple concret",
] as const;

/** Débrief structuré renvoyé en fin de défi. */
export const EDGE_CHALLENGE_DEBRIEF_SECTIONS = [
  "Vos points forts",
  "Vos axes d'amélioration",
  "Votre niveau estimé",
  "Les prochaines actions",
] as const;
