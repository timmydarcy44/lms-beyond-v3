import type { AssessmentQuestion } from "@/lib/formation-assessments/types";

const LIKERT4 = [
  "Pas du tout satisfait",
  "Peu satisfait",
  "Satisfait",
  "Très satisfait",
] as const;

const ACCORD4 = [
  "Pas du tout d'accord",
  "Plutôt pas d'accord",
  "Plutôt d'accord",
  "Tout à fait d'accord",
] as const;

function likert(
  id: string,
  prompt: string,
  labels: readonly string[] = LIKERT4,
): AssessmentQuestion {
  return {
    id,
    prompt,
    type: "single",
    options: [...labels],
  };
}

/** Questions PDF Byound — évaluation à chaud (fin de formation). */
export const EVAL_CHAUD_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "intro",
    prompt:
      "Ce questionnaire nous permet de connaître votre avis sur la formation. Environ 5 minutes — vos réponses aident à améliorer nos formations.",
    type: "section",
    sectionLabel: "Qualiopi · Indicateur 30",
  },
  // 1 Organisation
  likert("c1_infos", "Informations reçues avant la formation (programme, convocation, livret d'accueil)"),
  likert("c1_materiel", "Conditions matérielles ou accès à la plateforme en ligne"),
  likert("c1_rythme", "Rythme et durée de la formation"),
  likert("c1_assistance", "Réactivité de l'assistance pédagogique et technique"),
  // 2 Contenu
  likert("c2_adequation", "Adéquation du contenu avec vos attentes"),
  likert("c2_clarte", "Clarté et progression des contenus"),
  likert("c2_supports", "Qualité des supports (vidéos, documents, exercices)"),
  likert("c2_equilibre", "Équilibre entre apports théoriques et mise en pratique"),
  // 3 Formatrice
  likert("c3_maitrise", "La formatrice / le formateur — maîtrise du sujet"),
  likert("c3_explications", "Clarté des explications"),
  likert("c3_ecoute", "Disponibilité et écoute"),
  likert("c3_adaptation", "Adaptation à votre profil et à votre rythme"),
  // 4 Objectifs
  {
    id: "c4_objectifs",
    prompt: "Les objectifs annoncés dans le programme ont-ils été atteints ?",
    type: "single",
    options: ["Totalement", "En grande partie", "Partiellement", "Pas du tout"],
  },
  {
    id: "c4_appris",
    prompt: "Avez-vous appris de nouvelles choses ?",
    type: "single",
    options: ["Beaucoup", "Assez", "Peu", "Pas du tout"],
  },
  {
    id: "c4_capable",
    prompt: "Vous sentez-vous capable d'utiliser ce que vous avez appris ?",
    type: "single",
    options: ["Oui, tout à fait", "Plutôt oui", "Plutôt non", "Non"],
  },
  // 5 Accessibilité
  {
    id: "c5_access",
    prompt: "Avez-vous eu besoin d'adaptations (handicap, contraintes particulières) ?",
    type: "single",
    options: [
      "Non",
      "Oui, et elles ont été satisfaisantes",
      "Oui, mais elles n'ont pas été suffisantes",
    ],
  },
  // 6 Global
  {
    id: "c6_note",
    prompt: "Note globale de la formation (0 = très insatisfait, 10 = très satisfait)",
    type: "nps",
    min: 0,
    max: 10,
  },
  {
    id: "c6_reco",
    prompt: "Recommanderiez-vous cette formation à une personne de votre entourage ?",
    type: "single",
    options: ["Oui", "Non"],
  },
  {
    id: "c6_apprecie",
    prompt: "Ce que vous avez le plus apprécié :",
    type: "text",
  },
  {
    id: "c6_ameliorer",
    prompt: "Ce que nous pourrions améliorer :",
    type: "text",
  },
  {
    id: "c6_info",
    prompt: "Souhaitez-vous être informé(e) d'autres formations Byound ?",
    type: "single",
    options: ["Oui", "Non"],
  },
];

/** Questions PDF Byound — évaluation à froid (J+90). */
export const EVAL_FROID_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "intro",
    prompt:
      "Il y a quelques mois, vous avez suivi une formation Byound. Ce questionnaire nous aide à mesurer la mise en pratique et l'impact dans la durée (~5 min).",
    type: "section",
    sectionLabel: "Qualiopi · Indicateurs 30 et 32",
  },
  likert("f1_competences", "La formation m'a permis de développer de nouvelles compétences", ACCORD4),
  likert("f1_aise", "Je me sens plus à l'aise sur le sujet qu'avant la formation", ACCORD4),
  likert("f1_utile", "Ce que j'ai appris est utile dans ma situation actuelle", ACCORD4),
  likert("f1_besoins", "Avec le recul, la formation correspondait à mes besoins réels", ACCORD4),
  {
    id: "f2_pratique",
    prompt: "Depuis la fin de la formation, mettez-vous en œuvre les compétences acquises ?",
    type: "single",
    options: ["Régulièrement", "Occasionnellement", "Pas encore", "Non"],
  },
  {
    id: "f2_exemples",
    prompt: "Donnez un ou deux exemples concrets de situations où vous les avez utilisées :",
    type: "text",
  },
  {
    id: "f3_freins",
    prompt: "Qu'est-ce qui a pu limiter la mise en pratique ?",
    type: "multi",
    options: [
      "Aucun frein",
      "Manque de temps",
      "Manque d'occasions",
      "Besoin d'approfondir certains points",
      "Contexte professionnel ou personnel",
      "Autre",
    ],
  },
  {
    id: "f3_autre",
    prompt: "Si « Autre », précisez :",
    type: "text",
  },
  {
    id: "f4_impact",
    prompt:
      "La formation a-t-elle fait avancer votre projet professionnel (reconversion, nouvelle mission, évolution…) ?",
    type: "single",
    options: ["Beaucoup", "Un peu", "Pas encore", "Non"],
  },
  {
    id: "f4_change",
    prompt: "Décrivez en quelques mots ce qui a changé pour vous :",
    type: "text",
  },
  {
    id: "f5_note",
    prompt: "Note globale de la formation aujourd'hui (0 = très insatisfait, 10 = très satisfait)",
    type: "nps",
    min: 0,
    max: 10,
  },
  {
    id: "f5_reco",
    prompt: "Recommanderiez-vous cette formation ?",
    type: "single",
    options: ["Oui", "Non"],
  },
  {
    id: "f5_modifier",
    prompt: "Avec le recul, que faudrait-il ajouter ou modifier dans la formation ?",
    type: "text",
  },
  {
    id: "f6_recontact",
    prompt: "Souhaitez-vous être recontacté(e) pour approfondir ou compléter votre formation ?",
    type: "single",
    options: ["Oui", "Non"],
  },
  {
    id: "f6_sujet",
    prompt: "Si oui, sur quel sujet ?",
    type: "text",
  },
];
