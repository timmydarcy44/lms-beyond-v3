import type { BeyondIndexQuestion } from "./types";

export const BEYOND_INDEX_AXES = [
  { id: "competences" as const, label: "Compétences", shortLabel: "Compétences" },
  { id: "formation" as const, label: "Formation", shortLabel: "Formation" },
  { id: "ia" as const, label: "IA & innovation", shortLabel: "IA" },
  { id: "recrutement" as const, label: "Recrutement", shortLabel: "Recrutement" },
  { id: "transmission" as const, label: "Transmission", shortLabel: "Transmission" },
  { id: "vision-rh" as const, label: "Vision RH", shortLabel: "Vision RH" },
];

export const BEYOND_INDEX_QUESTIONS: BeyondIndexQuestion[] = [
  {
    id: "q1",
    axisId: "competences",
    type: "scale",
    label: "À quel point connaissez-vous les compétences réelles de chaque collaborateur ?",
    maxPoints: 20,
    scaleLabels: { min: "Je ne sais pas", max: "Je sais tout" },
  },
  {
    id: "q2",
    axisId: "competences",
    type: "single",
    label: "Disposez-vous d'un référentiel de compétences formalisé et à jour ?",
    maxPoints: 15,
    options: [
      { id: "none", label: "Non, rien de formalisé", points: 0 },
      { id: "building", label: "En cours de construction", points: 7 },
      { id: "active", label: "Oui, et il est utilisé", points: 15 },
    ],
  },
  {
    id: "q3",
    axisId: "competences",
    type: "multi",
    label: "Quels outils utilisez-vous pour évaluer vos collaborateurs ?",
    maxPoints: 14,
    options: [
      { id: "annual", label: "Entretiens annuels classiques", points: 2 },
      { id: "psychometric", label: "Tests psychométriques (DISC, etc.)", points: 5 },
      { id: "360", label: "Évaluations 360°", points: 4 },
      { id: "situation", label: "Mise en situation / livrables", points: 5 },
      { id: "none", label: "Aucun outil structuré", points: 0, exclusive: true },
    ],
  },
  {
    id: "q4",
    axisId: "formation",
    type: "scale",
    label: "Dans quelle mesure mesurez-vous l'impact réel de vos formations ?",
    maxPoints: 20,
    scaleLabels: { min: "Jamais mesuré", max: "Mesuré systématiquement" },
  },
  {
    id: "q5",
    axisId: "formation",
    type: "single",
    label: "Les parcours de formation sont-ils adaptés au profil individuel de chaque collaborateur ?",
    maxPoints: 12,
    options: [
      { id: "same", label: "Catalogue identique pour tous", points: 0 },
      { id: "some", label: "Quelques adaptations ponctuelles", points: 6 },
      { id: "personalized", label: "Parcours individualisés systématiques", points: 12 },
    ],
  },
  {
    id: "q6",
    axisId: "formation",
    type: "multi",
    label: "Comment vos collaborateurs valident-ils une compétence acquise ?",
    maxPoints: 11,
    options: [
      { id: "attendance", label: "Attestation de présence", points: 1 },
      { id: "qcm", label: "QCM / test de fin de formation", points: 2 },
      { id: "deliverable", label: "Livrable ou mise en pratique évaluée", points: 4 },
      { id: "badge", label: "Badge ou certification reconnue", points: 5 },
      { id: "none", label: "Aucune validation formelle", points: 0, exclusive: true },
    ],
  },
  {
    id: "q7",
    axisId: "ia",
    type: "scale",
    label: "À quelle fréquence vos collaborateurs utilisent-ils l'IA dans leur travail ?",
    maxPoints: 20,
    scaleLabels: { min: "Jamais", max: "Quotidiennement" },
  },
  {
    id: "q8",
    axisId: "ia",
    type: "single",
    label: "Votre organisation a-t-elle une politique IA formalisée ?",
    maxPoints: 10,
    options: [
      { id: "none", label: "Non, aucune politique", points: 0 },
      { id: "thinking", label: "Réflexion en cours", points: 5 },
      { id: "formal", label: "Oui, politique claire et communiquée", points: 10 },
    ],
  },
  {
    id: "q9",
    axisId: "recrutement",
    type: "scale",
    label:
      "À quel point identifiez-vous avec précision les compétences critiques manquantes avant de recruter ?",
    maxPoints: 20,
    scaleLabels: { min: "On recrute au feeling", max: "Analyse fine et structurée" },
  },
  {
    id: "q10",
    axisId: "recrutement",
    type: "single",
    label: "Évaluez-vous les soft skills et le potentiel lors de vos recrutements ?",
    maxPoints: 12,
    options: [
      { id: "cv", label: "Non, CV + entretien uniquement", points: 0 },
      { id: "sometimes", label: "Parfois, selon le poste", points: 5 },
      { id: "systematic", label: "Oui, systématiquement avec outils dédiés", points: 12 },
    ],
  },
  {
    id: "q11",
    axisId: "transmission",
    type: "scale",
    label:
      "Dans quelle mesure les savoirs stratégiques de vos experts sont-ils documentés et accessibles ?",
    maxPoints: 20,
    scaleLabels: { min: "Tout est dans les têtes", max: "Tout est formalisé" },
  },
  {
    id: "q12",
    axisId: "transmission",
    type: "single",
    label:
      "Existe-t-il un processus actif de transmission des connaissances entre générations de collaborateurs ?",
    maxPoints: 12,
    options: [
      { id: "none", label: "Non, chacun se débrouille", points: 0 },
      { id: "informal", label: "Initiatives isolées et informelles", points: 5 },
      { id: "structured", label: "Oui, programme structuré et suivi", points: 12 },
    ],
  },
  {
    id: "q13",
    axisId: "vision-rh",
    type: "multi",
    label: "Quels sont vos principaux enjeux RH pour les 2 prochaines années ?",
    maxPoints: 9,
    maxSelections: 3,
    options: [
      { id: "retain", label: "Fidéliser les talents clés", points: 2 },
      { id: "ai-skills", label: "Développer les compétences IA", points: 3 },
      { id: "mobility", label: "Structurer la mobilité interne", points: 2 },
      { id: "onboarding", label: "Améliorer l'onboarding", points: 2 },
      { id: "turnover", label: "Réduire le turnover", points: 2 },
      { id: "performance", label: "Mesurer la performance autrement", points: 3 },
    ],
  },
  {
    id: "q14",
    axisId: "vision-rh",
    type: "scale",
    label:
      "Dans quelle mesure la direction considère-t-elle la gestion des compétences comme un enjeu stratégique ?",
    maxPoints: 20,
    scaleLabels: { min: "Sujet purement RH", max: "Priorité stratégique" },
  },
  {
    id: "q15",
    axisId: "vision-rh",
    type: "single",
    label:
      "Disposez-vous d'un budget dédié au développement des compétences, distinct du plan de formation obligatoire ?",
    maxPoints: 12,
    options: [
      { id: "mandatory", label: "Non, uniquement l'obligatoire", points: 0 },
      { id: "occasional", label: "Budget ponctuel selon les années", points: 5 },
      { id: "dedicated", label: "Oui, budget annuel dédié et planifié", points: 12 },
    ],
  },
];

export const ORG_SIZE_OPTIONS = [
  { id: "1-10", label: "1 – 10 personnes" },
  { id: "11-50", label: "11 – 50 personnes" },
  { id: "51-200", label: "51 – 200 personnes" },
  { id: "201-500", label: "201 – 500 personnes" },
  { id: "500+", label: "500+ personnes" },
];
