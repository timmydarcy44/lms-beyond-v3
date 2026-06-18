export type IdmcAxisKey = "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7" | "A8";
export type IdmcLikertValue = 0 | 1 | 2 | 3;
export type IdmcVariant = "learner" | "employee";

export type IdmcQuestion = {
  axis: IdmcAxisKey;
  order: number;
  text: string;
  reversed?: boolean;
};

export type IdmcResponse = {
  axis: IdmcAxisKey;
  question_index: number;
  text: string;
  value: IdmcLikertValue;
  score: number;
  reversed: boolean;
};

export const IDMC_LIKERT_OPTIONS: Array<{ label: string; value: IdmcLikertValue }> = [
  { label: "Jamais", value: 0 },
  { label: "Parfois", value: 1 },
  { label: "Souvent", value: 2 },
  { label: "Toujours", value: 3 },
];

export const IDMC_AXES_LABELS: Record<IdmcAxisKey, string> = {
  A1: "Connaissance de soi",
  A2: "Maîtrise des méthodes",
  A3: "Adaptation au contexte",
  A4: "Organisation et anticipation",
  A5: "Traitement de l'information",
  A6: "Résolution de difficultés",
  A7: "Suivi de progression",
  A8: "Auto-évaluation finale",
};

export const IDMC_LEARNER_QUESTIONS: IdmcQuestion[] = [
  { axis: "A1", order: 1, text: "Quand je reçois un résultat décevant, je suis capable d'identifier précisément les points sur lesquels j'ai perdu des points." },
  { axis: "A1", order: 2, text: "Je connais les moments de la journée où je suis le plus concentré(e) et j'organise mon travail en conséquence." },
  { axis: "A1", order: 3, text: "Avant d'aborder un nouveau sujet, je suis capable d'évaluer si j'ai les bases suffisantes pour le comprendre." },
  { axis: "A1", order: 4, text: "Je commence souvent une tâche sans avoir vérifié que j'avais bien compris ce qu'on attendait de moi.", reversed: true },
  { axis: "A1", order: 5, text: "Je sais distinguer ce que j'ai vraiment compris de ce que j'ai simplement mémorisé sans comprendre." },
  { axis: "A2", order: 1, text: "Mes prises de notes sont organisées de façon à pouvoir les réutiliser facilement lors des révisions." },
  { axis: "A2", order: 2, text: "J'ai une méthode de révision que j'adapte selon la matière et dont je mesure l'efficacité." },
  { axis: "A2", order: 3, text: "Je connais et applique les critères d'évaluation attendus par mes formateurs avant de rendre un travail." },
  { axis: "A2", order: 4, text: "J'utilise des techniques concrètes (associations, schémas, répétition espacée) pour mémoriser des informations clés." },
  { axis: "A2", order: 5, text: "Je construis mes plans ou argumentaires de façon structurée avant de commencer à rédiger." },
  { axis: "A3", order: 1, text: "Quand j'aborde un nouveau cours, je cherche spontanément à faire le lien avec ce que je vis ou ai déjà vécu." },
  { axis: "A3", order: 2, text: "Je change de méthode de travail selon qu'il s'agit d'un cas pratique, d'un exercice théorique ou d'un projet." },
  { axis: "A3", order: 3, text: "Je mobilise mes points forts dans certaines matières pour surmonter mes difficultés dans d'autres." },
  { axis: "A3", order: 4, text: "J'adapte ma vitesse de lecture selon que le passage est central ou secondaire dans le sujet." },
  { axis: "A3", order: 5, text: "Je choisis mes outils de travail (tableau, schéma, fiche, tableur) en fonction du problème à résoudre, pas par habitude." },
  { axis: "A4", order: 1, text: "Je planifie mes échéances suffisamment à l'avance pour ne pas me retrouver en situation de rush." },
  { axis: "A4", order: 2, text: "Avant de démarrer une tâche, je rassemble tout ce dont j'ai besoin pour ne pas être interrompu(e) en cours de route." },
  { axis: "A4", order: 3, text: "Je définis clairement ce que je veux avoir accompli avant de commencer à travailler." },
  { axis: "A4", order: 4, text: "J'ai tendance à démarrer directement sans planifier les étapes, ce qui me fait parfois perdre du temps.", reversed: true },
  { axis: "A4", order: 5, text: "J'estime le temps nécessaire pour chaque partie de mon travail avant de me lancer." },
  { axis: "A5", order: 1, text: "Quand un passage est complexe, je ralentis volontairement ma lecture plutôt que de le survoler." },
  { axis: "A5", order: 2, text: "Je cherche d'abord à comprendre l'idée générale d'un texte avant de me concentrer sur les détails." },
  { axis: "A5", order: 3, text: "Pour comprendre un concept abstrait, je construis spontanément un exemple concret lié à ma vie ou à mon secteur." },
  { axis: "A5", order: 4, text: "Je suis capable de reformuler avec mes propres mots ce que je viens d'apprendre, sans regarder mes notes." },
  { axis: "A5", order: 5, text: "J'utilise des supports visuels (schémas, tableaux, cartes mentales) pour organiser et retenir l'information." },
  { axis: "A6", order: 1, text: "Quand je suis bloqué(e), je demande de l'aide à un formateur ou un pair plutôt que de rester seul(e) face au problème." },
  { axis: "A6", order: 2, text: "Quand je vois qu'une méthode ne fonctionne pas, je change d'approche sans attendre d'être complètement bloqué(e)." },
  { axis: "A6", order: 3, text: "Quand je perds le fil d'une explication, je reviens au début plutôt que de continuer sans comprendre." },
  { axis: "A6", order: 4, text: "Je décompose les problèmes complexes en sous-questions simples pour les traiter une par une." },
  { axis: "A6", order: 5, text: "Après une erreur, j'identifie précisément ce qui l'a causée pour éviter de la reproduire." },
  { axis: "A7", order: 1, text: "Pendant un travail long, je fais des pauses régulières pour vérifier que je suis toujours sur la bonne voie." },
  { axis: "A7", order: 2, text: "Je contrôle la qualité de ce que je produis au fur et à mesure, pas seulement à la fin." },
  { axis: "A7", order: 3, text: "Avant de rendre un travail, je vérifie que j'ai bien répondu à tous les points de la consigne." },
  { axis: "A7", order: 4, text: "Il m'arrive de terminer un exercice sans vérifier si ma méthode était vraiment la plus adaptée.", reversed: true },
  { axis: "A7", order: 5, text: "Quand je vois que le temps me manque, j'ajuste mes objectifs pour terminer l'essentiel plutôt que de tout bâcler." },
  { axis: "A8", order: 1, text: "Juste après un exercice ou un examen, je suis capable d'estimer mon niveau de performance de façon réaliste." },
  { axis: "A8", order: 2, text: "Une fois une tâche terminée, je prends le temps de résumer ce que j'en ai appris." },
  { axis: "A8", order: 3, text: "Je suis capable de dire honnêtement si j'ai vraiment donné le meilleur de moi-même sur un travail." },
  { axis: "A8", order: 4, text: "J'analyse mes erreurs passées pour en tirer des règles concrètes applicables à mes prochains travaux." },
  { axis: "A8", order: 5, text: "Je termine souvent un travail sans vraiment réfléchir à ce que j'aurais pu faire différemment.", reversed: true },
];

export const IDMC_EMPLOYEE_QUESTIONS: IdmcQuestion[] = [
  { axis: "A1", order: 1, text: "Quand je reçois un retour critique sur un projet, je suis capable d'identifier précisément les points à améliorer." },
  { axis: "A1", order: 2, text: "Je connais les moments de la journée où je suis le plus efficace et j'organise mes tâches en conséquence." },
  { axis: "A1", order: 3, text: "Avant d'aborder un nouveau sujet, je suis capable d'évaluer si j'ai les compétences suffisantes pour le comprendre." },
  { axis: "A1", order: 4, text: "Je commence souvent une tâche sans avoir vérifié que j'avais bien compris ce qu'on attendait de moi.", reversed: true },
  { axis: "A1", order: 5, text: "Je sais distinguer ce que j'ai vraiment compris de ce que j'ai simplement lu ou survolé sans assimiler." },
  { axis: "A2", order: 1, text: "Mes prises de notes sont organisées de façon à pouvoir les réutiliser facilement lors de réunions, rapports ou présentations." },
  { axis: "A2", order: 2, text: "J'ai une méthode de travail que j'adapte selon le type de mission (rapport, présentation, projet, analyse) et dont j'évalue l'efficacité." },
  { axis: "A2", order: 3, text: "Je connais et j'applique les critères d'attente de mes managers ou de mes clients avant de livrer un travail." },
  { axis: "A2", order: 4, text: "J'utilise des techniques concrètes (associations, schémas, répétition, synthèses) pour mémoriser des informations clés." },
  { axis: "A2", order: 5, text: "Je construis mes plans de travail ou mes argumentaires de façon structurée avant de commencer à rédiger ou présenter un livrable." },
  { axis: "A3", order: 1, text: "Quand j'aborde un nouveau projet, je cherche spontanément à faire le lien avec mes expériences professionnelles passées." },
  { axis: "A3", order: 2, text: "Je change de méthode de travail selon qu'il s'agit d'un cas pratique, d'un exercice théorique ou d'un projet concret." },
  { axis: "A3", order: 3, text: "Je mobilise mes points forts dans certaines missions pour compenser mes difficultés dans d'autres domaines." },
  { axis: "A3", order: 4, text: "J'adapte ma vitesse de lecture selon que l'information est centrale ou secondaire pour le projet." },
  { axis: "A3", order: 5, text: "Je choisis mes outils de travail (tableau, schéma, fiche, tableur, maquette) en fonction du problème à résoudre, pas par habitude." },
  { axis: "A4", order: 1, text: "Je planifie mes missions et livrables suffisamment à l'avance pour éviter la dernière-minute et le stress de dernière minute." },
  { axis: "A4", order: 2, text: "Avant de démarrer une tâche, je rassemble tout ce dont j'ai besoin pour ne pas être interrompu(e) en cours de route." },
  { axis: "A4", order: 3, text: "Je définis clairement ce que je veux avoir accompli avant de commencer à travailler." },
  { axis: "A4", order: 4, text: "J'ai tendance à démarrer directement sans planifier les étapes, ce qui me fait parfois perdre du temps ou de la qualité.", reversed: true },
  { axis: "A4", order: 5, text: "J'estime le temps nécessaire pour chaque partie de mon travail avant de me lancer." },
  { axis: "A5", order: 1, text: "Quand un passage ou une information est complexe, je ralentis volontairement ma lecture plutôt que de le survoler." },
  { axis: "A5", order: 2, text: "Je cherche d'abord à comprendre l'idée générale d'un texte, d'un rapport ou d'une présentation avant de me concentrer sur les détails." },
  { axis: "A5", order: 3, text: "Pour comprendre un concept abstrait, je construis spontanément un exemple concret lié à mon activité professionnelle." },
  { axis: "A5", order: 4, text: "Je suis capable de reformuler avec mes propres mots ce que je viens d'apprendre, sans regarder mes notes." },
  { axis: "A5", order: 5, text: "J'utilise des supports visuels (schémas, tableaux, cartes mentales) pour organiser et retenir l'information." },
  { axis: "A6", order: 1, text: "Quand je suis bloqué(e) sur un projet, je demande de l'aide à un manager, un collègue ou un expert plutôt que de rester seul(e)." },
  { axis: "A6", order: 2, text: "Quand je vois qu'une méthode de travail ne fonctionne pas, je change d'approche sans attendre d'être complètement bloqué(e)." },
  { axis: "A6", order: 3, text: "Quand je perds le fil d'une explication, je reviens en amont plutôt que de continuer sans comprendre." },
  { axis: "A6", order: 4, text: "Je décompose les problèmes complexes en sous-questions ou sous-étapes simples pour les traiter une par une." },
  { axis: "A6", order: 5, text: "Après une erreur ou un écart de livraison, j'identifie précisément ce qui l'a causée pour éviter de la reproduire." },
  { axis: "A7", order: 1, text: "Pendant un travail long, je fais des points intermédiaires pour vérifier que je suis toujours sur la bonne voie." },
  { axis: "A7", order: 2, text: "Je contrôle la qualité de ce que je produis au fur et à mesure, pas seulement à la fin." },
  { axis: "A7", order: 3, text: "Avant de rendre un livrable, je vérifie que j'ai bien répondu à tous les points attendus." },
  { axis: "A7", order: 4, text: "Il m'arrive de terminer un travail sans vérifier si ma méthode était vraiment la plus adaptée.", reversed: true },
  { axis: "A7", order: 5, text: "Quand je vois que le temps me manque, j'ajuste mes objectifs pour livrer l'essentiel plutôt que de tout bâcler." },
  { axis: "A8", order: 1, text: "Juste après la livraison d'un projet, je suis capable d'estimer mon niveau de performance de façon réaliste." },
  { axis: "A8", order: 2, text: "Une fois une tâche terminée, je prends le temps de résumer ce que j'en ai appris pour mes prochaines missions." },
  { axis: "A8", order: 3, text: "Je suis capable de dire honnêtement si j'ai vraiment donné le meilleur de moi-même sur un travail." },
  { axis: "A8", order: 4, text: "J'analyse mes erreurs ou retards passés pour en tirer des règles concrètes applicables à mes prochains projets." },
  { axis: "A8", order: 5, text: "Je termine souvent un travail sans vraiment réfléchir à ce que j'aurais pu faire différemment.", reversed: true },
];

export const IDMC_QUESTIONS: Record<IdmcVariant, IdmcQuestion[]> = {
  learner: IDMC_LEARNER_QUESTIONS,
  employee: IDMC_EMPLOYEE_QUESTIONS,
};

export const IDMC_QUESTION_COUNT = IDMC_LEARNER_QUESTIONS.length;

/** Alternance → learner ; Freelance, Emploi, Reconversion, Autre (ou vide) → employee. */
export function resolveIdmcVariantFromTypeProfil(typeProfil: string | null | undefined): IdmcVariant {
  return String(typeProfil ?? "").trim().toLowerCase() === "alternance" ? "learner" : "employee";
}

export function getIdmcQuestions(variant: IdmcVariant): IdmcQuestion[] {
  return IDMC_QUESTIONS[variant];
}

const EMPTY_POINTS = (): Record<IdmcAxisKey, number> => ({
  A1: 0,
  A2: 0,
  A3: 0,
  A4: 0,
  A5: 0,
  A6: 0,
  A7: 0,
  A8: 0,
});

export function computeIdmcResultFromResponses(responses: IdmcResponse[]) {
  const axisPoints = EMPTY_POINTS();
  for (const response of responses) {
    axisPoints[response.axis] += response.score;
  }
  const axisPercentages = {} as Record<IdmcAxisKey, number>;
  (Object.keys(axisPoints) as IdmcAxisKey[]).forEach((key) => {
    axisPercentages[key] = Math.round((axisPoints[key] / 15) * 100);
  });
  const totalPoints = Object.values(axisPoints).reduce((sum, value) => sum + value, 0);
  const globalScore = (totalPoints / 120) * 100;
  let level = "Maîtrise experte";
  if (globalScore < 40) level = "Maîtrise à construire";
  else if (globalScore < 60) level = "Maîtrise en développement";
  else if (globalScore < 80) level = "Maîtrise opérationnelle";
  return { axisPoints, axisPercentages, globalScore, level };
}
