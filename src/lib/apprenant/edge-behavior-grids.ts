/**
 * Grilles de comportements observables EDGE — base de la validation compétence.
 * EDGE n'évalue plus des réponses : il observe des comportements dans des situations.
 */

export type BehaviorDefinition = {
  key: string;
  label: string;
  description: string;
};

export type BehaviorGrid = {
  skillKey: string;
  skillLabel: string;
  behaviors: BehaviorDefinition[];
};

export const VALIDATION_RULES = {
  /** Comportements minimum observés pour valider une compétence. */
  minBehaviorsObserved: 4,
  /** Missions distinctes minimum (contextes variés). */
  minDistinctMissions: 2,
  /** Observations minimum par comportement pour le considérer acquis. */
  minObservationsPerBehavior: 1,
} as const;

const GRIDS: BehaviorGrid[] = [
  {
    skillKey: "communication",
    skillLabel: "Communication",
    behaviors: [
      { key: "reformule", label: "Reformule", description: "Reprend les propos de l'autre pour vérifier sa compréhension." },
      { key: "questions_ouvertes", label: "Pose des questions ouvertes", description: "Explore le besoin sans fermer le dialogue." },
      { key: "verifie_comprehension", label: "Vérifie la compréhension", description: "S'assure que le message est bien reçu des deux côtés." },
      { key: "adapte_discours", label: "Adapte son discours", description: "Ajuste ton, vocabulaire ou niveau de détail à l'interlocuteur." },
      { key: "repond_objections", label: "Répond aux objections", description: "Traite les résistances sans esquiver." },
      { key: "conclut_echange", label: "Conclut un échange", description: "Synthétise et propose une suite concrète." },
    ],
  },
  {
    skillKey: "leadership",
    skillLabel: "Leadership",
    behaviors: [
      { key: "decide", label: "Décide", description: "Tranche avec clarté quand la situation l'exige." },
      { key: "explique", label: "Explique", description: "Donne du sens et du contexte à la décision." },
      { key: "ecoute", label: "Écoute", description: "Prend en compte les points de vue avant d'agir." },
      { key: "recadre", label: "Recadre", description: "Ramène l'échange vers l'objectif ou les priorités." },
      { key: "priorise", label: "Priorise", description: "Hiérarchise les enjeux et les actions." },
      { key: "responsabilise", label: "Responsabilise", description: "Confie des actions claires et suit l'engagement." },
    ],
  },
  {
    skillKey: "esprit_critique",
    skillLabel: "Esprit critique",
    behaviors: [
      { key: "analyse_faits", label: "Analyse les faits", description: "S'appuie sur des éléments vérifiables." },
      { key: "verifie_hypotheses", label: "Vérifie les hypothèses", description: "Teste les suppositions avant de conclure." },
      { key: "compare_options", label: "Compare plusieurs options", description: "Pèse des alternatives avant de trancher." },
      { key: "justifie_decision", label: "Justifie sa décision", description: "Argumente le choix avec des critères explicites." },
      { key: "identifie_biais", label: "Identifie les biais", description: "Repère les angles morts ou les raccourcis cognitifs." },
    ],
  },
  {
    skillKey: "negociation",
    skillLabel: "Négociation",
    behaviors: [
      { key: "prepare_echange", label: "Prépare l'échange", description: "Anticipe les enjeux et les marges de manœuvre." },
      { key: "comprend_motivations", label: "Comprend les motivations", description: "Explore les intérêts de l'autre partie." },
      { key: "reformule", label: "Reformule", description: "Valide sa compréhension avant de proposer." },
      { key: "propose_options", label: "Propose des options", description: "Ouvre des pistes de compromis créatives." },
      { key: "ancre_valeur", label: "Ancre la valeur", description: "Justifie sa position par des bénéfices concrets." },
      { key: "conclut_accord", label: "Conclut un accord", description: "Formalise les engagements mutuels." },
    ],
  },
  {
    skillKey: "influence",
    skillLabel: "Influence",
    behaviors: [
      { key: "identifie_interlocuteurs", label: "Identifie les bons interlocuteurs", description: "Cible les décideurs pertinents." },
      { key: "argumente_benefices", label: "Argumente par les bénéfices", description: "Parle en termes de valeur pour l'autre." },
      { key: "cherche_adhesion", label: "Cherche l'adhésion", description: "Favorise l'alignement plutôt que l'imposition." },
      { key: "adapte_discours", label: "Adapte son discours", description: "Ajuste le message au profil de l'audience." },
      { key: "repond_objections", label: "Répond aux objections", description: "Traite les résistances avec méthode." },
      { key: "conclut_echange", label: "Conclut un échange", description: "Obtient un engagement ou une prochaine étape." },
    ],
  },
];

const GENERIC_GRID: BehaviorGrid = {
  skillKey: "generique",
  skillLabel: "Compétence professionnelle",
  behaviors: [
    { key: "comprend_avant_agir", label: "Comprend avant d'agir", description: "Explore la situation avant de répondre." },
    { key: "structure_message", label: "Structure son message", description: "Organise sa pensée de façon claire." },
    { key: "repond_objections", label: "Répond aux objections", description: "Traite les résistances sans esquiver." },
    { key: "justifie_decision", label: "Justifie sa décision", description: "Appuie ses choix sur des critères explicites." },
    { key: "conclut_echange", label: "Conclut un échange", description: "Propose une suite concrète." },
    { key: "adapte_discours", label: "Adapte son discours", description: "Ajuste son approche à l'interlocuteur." },
  ],
};

function normalizeKey(skill: string): string {
  return skill
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchGrid(skill: string): BehaviorGrid {
  const key = normalizeKey(skill);
  for (const grid of GRIDS) {
    if (key === grid.skillKey || key.includes(grid.skillKey) || grid.skillKey.includes(key)) {
      return { ...grid, skillLabel: skill };
    }
  }
  if (key.includes("commun")) return { ...GRIDS[0], skillLabel: skill };
  if (key.includes("leader") || key.includes("management") || key.includes("equipe")) {
    return { ...GRIDS[1], skillLabel: skill };
  }
  if (key.includes("critique") || key.includes("analyt") || key.includes("decision")) {
    return { ...GRIDS[2], skillLabel: skill };
  }
  if (key.includes("negoc") || key.includes("commercial") || key.includes("vente")) {
    return { ...GRIDS[3], skillLabel: skill };
  }
  if (key.includes("influ")) return { ...GRIDS[4], skillLabel: skill };
  return { ...GENERIC_GRID, skillLabel: skill };
}

export function getBehaviorGrid(skill: string): BehaviorGrid {
  return matchGrid(skill);
}

export function behaviorGridBlockForPrompt(grid: BehaviorGrid): string {
  const lines = grid.behaviors.map((b) => `- [${b.key}] ${b.label} : ${b.description}`).join("\n");
  return `GRILLE DE COMPORTEMENTS OBSERVABLES — ${grid.skillLabel} :\n${lines}\n\nNe cherche PAS une bonne réponse. Observe si l'apprenant manifeste ces comportements dans la situation.`;
}

export function behaviorByKey(grid: BehaviorGrid, key: string): BehaviorDefinition | undefined {
  return grid.behaviors.find((b) => b.key === key);
}
