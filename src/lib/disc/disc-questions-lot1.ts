import type { DiscQuestion } from "@/lib/disc/disc-questions-types";

/** Lot 1 — questions 1 à 10 */
export const DISC_QUESTIONS_LOT1: DiscQuestion[] = [
  {
    id: 1,
    situation:
      "En réunion, votre manager annonce un objectif ambitieux à atteindre d'ici la fin du mois.",
    options: [
      { label: "D", text: "Je propose tout de suite un plan d'action concret pour y arriver." },
      { label: "I", text: "Je mobilise l'équipe en mettant en avant les bénéfices du défi." },
      { label: "S", text: "Je demande comment intégrer cet objectif sans bouleverser le rythme actuel." },
      { label: "C", text: "Je vérifie les données disponibles avant de m'engager sur une trajectoire." },
    ],
  },
  {
    id: 2,
    situation:
      "Un collègue vous demande de l'aide alors que vous avez déjà plusieurs dossiers urgents en cours.",
    options: [
      { label: "D", text: "Je lui indique clairement ce que je peux faire et dans quel délai." },
      { label: "I", text: "Je trouve un moment pour en discuter et le rassurer sur la suite." },
      { label: "S", text: "Je l'écoute d'abord et j'ajuste mon planning pour l'accompagner." },
      { label: "C", text: "Je lui demande les détails pour évaluer l'impact sur mes priorités." },
    ],
  },
  {
    id: 3,
    situation:
      "Lors d'une présentation client, une information importante s'avère incorrecte au dernier moment.",
    options: [
      { label: "D", text: "Je reprends la main et reformule la proposition de façon directe." },
      { label: "I", text: "Je détends l'atmosphère tout en corrigeant le message avec tact." },
      { label: "S", text: "Je propose une pause pour revoir le contenu calmement avec l'équipe." },
      { label: "C", text: "Je vérifie les sources et corrige la slide avant de continuer." },
    ],
  },
  {
    id: 4,
    situation:
      "Votre équipe doit choisir entre deux méthodes de travail pour un projet récurrent.",
    options: [
      { label: "D", text: "Je tranche rapidement pour éviter de perdre du temps." },
      { label: "I", text: "J'anime un échange pour que chacun exprime son point de vue." },
      { label: "S", text: "Je favorise la solution qui limite les changements pour l'équipe." },
      { label: "C", text: "Je compare les deux options selon des critères objectifs." },
    ],
  },
  {
    id: 5,
    situation:
      "Un client exprime une insatisfaction sur un livrable que vous avez produit.",
    options: [
      { label: "D", text: "Je demande ce qui doit être corrigé en priorité et je m'y mets." },
      { label: "I", text: "Je cherche à comprendre son ressenti et à restaurer la confiance." },
      { label: "S", text: "Je prends le temps d'écouter avant de proposer une solution." },
      { label: "C", text: "Je reprends le cahier des charges point par point avec lui." },
    ],
  },
  {
    id: 6,
    situation:
      "Vous intégrez une nouvelle équipe et devez vous présenter devant le groupe.",
    options: [
      { label: "D", text: "Je vais droit au but en expliquant ce que j'apporte au projet." },
      { label: "I", text: "Je crée du lien en partageant mon énergie et mon enthousiasme." },
      { label: "S", text: "Je reste sobre et montre que je suis là pour coopérer sereinement." },
      { label: "C", text: "Je détaille mon parcours et mes compétences de façon structurée." },
    ],
  },
  {
    id: 7,
    situation:
      "Un imprévu technique bloque une livraison prévue demain matin.",
    options: [
      { label: "D", text: "Je décide des contournements possibles et je réorganise les priorités." },
      { label: "I", text: "Je coordonne l'équipe en gardant un ton positif malgré la pression." },
      { label: "S", text: "Je rassure les personnes concernées et stabilise le plan d'action." },
      { label: "C", text: "J'analyse la cause du blocage avant toute décision." },
    ],
  },
  {
    id: 8,
    situation:
      "Vous recevez un retour négatif sur votre façon de communiquer en réunion.",
    options: [
      { label: "D", text: "Je demande des exemples précis pour ajuster ce qui gêne." },
      { label: "I", text: "Je discute ouvertement pour comprendre l'impact sur les autres." },
      { label: "S", text: "Je réfléchis calmement avant de modifier mes habitudes." },
      { label: "C", text: "Je note les observations et je définis des règles de communication." },
    ],
  },
  {
    id: 9,
    situation:
      "Deux membres de l'équipe sont en désaccord sur la répartition des tâches.",
    options: [
      { label: "D", text: "Je tranche et je répartis les rôles pour relancer le projet." },
      { label: "I", text: "Je facilite le dialogue pour trouver un terrain d'entente." },
      { label: "S", text: "Je cherche une solution équilibrée qui préserve la cohésion." },
      { label: "C", text: "Je m'appuie sur les critères du projet pour arbitrer objectivement." },
    ],
  },
  {
    id: 10,
    situation:
      "On vous confie la responsabilité d'un dossier que personne n'a voulu prendre.",
    options: [
      { label: "D", text: "J'accepte le défi et je fixe mes propres jalons de réussite." },
      { label: "I", text: "Je vois l'occasion de valoriser le travail auprès des autres." },
      { label: "S", text: "Je m'organise progressivement pour tenir la mission sur la durée." },
      { label: "C", text: "J'évalue les risques et je structure le dossier méthodiquement." },
    ],
  },
];
