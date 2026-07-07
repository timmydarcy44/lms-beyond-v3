/** Conseils concrets par compétence — approche concierge, sans parcours complexe. */

const GENERIC_TIPS = [
  "Identifiez une situation réelle où cette compétence vous a fait défaut.",
  "Demandez un retour précis à une personne de confiance sur ce point.",
  "Fixez un objectif mesurable sur 2 à 4 semaines.",
  "Documentez une preuve concrète de progression (projet, mission, résultat).",
];

const SKILL_TIPS: Record<string, string[]> = {
  communication: [
    "Préparez 3 messages clés avant chaque échange professionnel important.",
    "Enregistrez-vous 2 minutes pour évaluer clarté et structure.",
    "Reformulez systématiquement ce que vous avez compris de l'interlocuteur.",
    "Entraînez-vous à synthétiser en 30 secondes (pitch court).",
  ],
  créativité: [
    "Bloquez 20 minutes par semaine pour une exploration sans contrainte.",
    "Collectez 5 références inspirantes liées à votre secteur.",
    "Testez une idée à petite échelle avant de la présenter.",
    "Croisez deux domaines différents pour générer une proposition originale.",
  ],
  creativite: [
    "Bloquez 20 minutes par semaine pour une exploration sans contrainte.",
    "Collectez 5 références inspirantes liées à votre secteur.",
    "Testez une idée à petite échelle avant de la présenter.",
  ],
  influence: [
    "Identifiez les 3 décideurs clés autour de votre objectif.",
    "Préparez un argumentaire centré sur les bénéfices pour l'autre.",
    "Pratiquez l'écoute active avant de proposer une solution.",
    "Obtenez un petit accord avant de viser une décision plus large.",
  ],
  organisation: [
    "Listez vos 3 priorités de la semaine chaque lundi matin.",
    "Découpez une tâche complexe en étapes de moins de 45 minutes.",
    "Utilisez un tableau simple : à faire / en cours / terminé.",
  ],
  négociation: [
    "Définissez votre marge de manœuvre avant chaque échange.",
    "Préparez 2 scénarios : idéal et acceptable.",
    "Posez des questions ouvertes pour comprendre les motivations réelles.",
  ],
  negociation: [
    "Définissez votre marge de manœuvre avant chaque échange.",
    "Préparez 2 scénarios : idéal et acceptable.",
    "Posez des questions ouvertes pour comprendre les motivations réelles.",
  ],
  prospection: [
    "Ciblez 10 contacts qualifiés plutôt que 50 contacts génériques.",
    "Personnalisez le premier message avec un élément spécifique au prospect.",
    "Planifiez 3 relances structurées sur 2 semaines.",
  ],
  leadership: [
    "Clarifiez l'objectif commun avant de distribuer les tâches.",
    "Demandez un feedback court après chaque coordination d'équipe.",
    "Identifiez un comportement de leader à renforcer cette semaine.",
  ],
  empathie: [
    "Reformulez les émotions perçues avant de répondre.",
    "Posez une question sur le contexte personnel de l'autre.",
    "Évitez les solutions immédiates : validez d'abord le ressenti.",
  ],
};

function normalizeSkillKey(skill: string): string {
  return skill
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getSkillGapTips(skillName: string, max = 5): string[] {
  const key = normalizeSkillKey(skillName);
  const exact = SKILL_TIPS[key];
  if (exact) return exact.slice(0, max);

  for (const [pattern, tips] of Object.entries(SKILL_TIPS)) {
    if (key.includes(pattern) || pattern.includes(key)) return tips.slice(0, max);
  }

  if (key.includes("commun")) return (SKILL_TIPS.communication ?? GENERIC_TIPS).slice(0, max);
  if (key.includes("creat")) return (SKILL_TIPS.creativite ?? GENERIC_TIPS).slice(0, max);
  if (key.includes("negoc")) return (SKILL_TIPS.negociation ?? GENERIC_TIPS).slice(0, max);
  if (key.includes("organ")) return (SKILL_TIPS.organisation ?? GENERIC_TIPS).slice(0, max);
  if (key.includes("prospec")) return (SKILL_TIPS.prospection ?? GENERIC_TIPS).slice(0, max);
  if (key.includes("leader")) return (SKILL_TIPS.leadership ?? GENERIC_TIPS).slice(0, max);

  return GENERIC_TIPS.slice(0, Math.min(max, 4));
}

export function getSkillGapWhyImportant(skillName: string, objectiveLabel: string): string {
  return `Cette compétence influence directement votre progression vers « ${objectiveLabel} ». La travailler en priorité vous rapproche d'un profil crédible pour ce projet.`;
}
