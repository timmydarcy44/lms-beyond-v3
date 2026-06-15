import type { ParcoursGuideSection } from "@/lib/jessica-contentin/parcours-guide-catalog";

/** Visuels cartes programme — assets locaux (évite les liens Unsplash expirés) */
const SECTION_IMAGES = [
  "/jessica-contentin/parcours-tdah/section-01.jpg",
  "/jessica-contentin/parcours-tdah/section-02.jpg",
  "/jessica-contentin/parcours-tdah/section-03.jpg",
  "/jessica-contentin/parcours-tdah/section-04.jpg",
  "/jessica-contentin/parcours-tdah/section-05.jpg",
  "/jessica-contentin/parcours-tdah/section-06.jpg",
  "/jessica-contentin/parcours-tdah/section-07.jpg",
  "/jessica-contentin/parcours-tdah/section-08.jpg",
] as const;

export const PARCOURS_TDAH_SECTIONS: ParcoursGuideSection[] = [
  {
    id: "s1",
    title: "Section 1 — Comprendre le TDAH",
    chapters: [
      {
        title: "Chapitre 1 · Définition et caractéristiques",
        items: [
          { label: "Sous-chapitre 1.1 · Définition du TDAH : un trouble du neurodéveloppement", type: "subchapter" },
          { label: "Sous-chapitre 1.2 · Les 3 profils : inattention / hyperactivité-impulsivité / mixte", type: "subchapter" },
          { label: "Sous-chapitre 1.3 · Le cerveau TDAH : fonctions exécutives, dopamine, mémoire de travail", type: "subchapter" },
          { label: "Sous-chapitre 1.4 · Ce que le TDAH n'est pas : caprices, mauvaise volonté, mauvaise éducation", type: "subchapter" },
          { label: "Entretien expérientiel — 10-15 min", type: "entretien" },
          { label: "Ressource : Grille de profil TDAH", type: "resource" },
        ],
      },
      {
        title: "Chapitre 2 · Différenciations importantes",
        items: [
          { label: "Sous-chapitre 2.1 · TDAH et troubles du comportement : faire la différence", type: "subchapter" },
          { label: "Sous-chapitre 2.2 · TDAH et anxiété : quand l'un masque l'autre", type: "subchapter" },
          { label: "Sous-chapitre 2.3 · TDAH et opposition : comprendre le TOP", type: "subchapter" },
        ],
      },
    ],
  },
  {
    id: "s2",
    title: "Section 2 — Les comorbidités : comprendre les profils mixtes",
    chapters: [
      {
        title: "Chapitre 1 · Pourquoi le TDAH est rarement seul",
        items: [
          { label: "Sous-chapitre 1.1 · Les comorbidités : définition et fréquence (65 à 89 % des cas)", type: "subchapter" },
          { label: "Sous-chapitre 1.2 · Lire le profil unique de son enfant sans l'enfermer dans les étiquettes", type: "subchapter" },
          { label: "Ressource : Carte des comorbidités — profil de mon enfant", type: "resource" },
        ],
      },
      {
        title: "Chapitre 2 · Les troubles associés les plus fréquents",
        items: [
          { label: "Sous-chapitre 2.1 · TDAH + DYS (dyslexie, dysorthographie, dyspraxie, dyscalculie)", type: "subchapter" },
          { label: "Sous-chapitre 2.2 · TDAH + Anxiété : le cercle vicieux inattention / inquiétude", type: "subchapter" },
          { label: "Sous-chapitre 2.3 · TDAH + TSA : points communs, différences, ce qui change dans l'accompagnement", type: "subchapter" },
          { label: "Sous-chapitre 2.4 · TDAH + HPI : le profil \"2e\" — doublement exceptionnel", type: "subchapter" },
          { label: "Sous-chapitre 2.5 · TDAH + TOP : quand l'opposition devient un mode de fonctionnement", type: "subchapter" },
          { label: "Sous-chapitre 2.6 · TDAH + Troubles du sommeil : le cerveau qui ne décroche jamais", type: "subchapter" },
          { label: "Sous-chapitre 2.7 · TDAH + Troubles de l'humeur : dépression, dysrégulation émotionnelle", type: "subchapter" },
        ],
      },
    ],
  },
  {
    id: "s3",
    title: "Section 3 — Comprendre son enfant au quotidien",
    chapters: [
      {
        title: "Chapitre 1 · Observation et analyse",
        items: [
          { label: "Sous-chapitre 1.1 · Observer sans interpréter : distinguer inattention, opposition et épuisement", type: "subchapter" },
          { label: "Sous-chapitre 1.2 · Les fonctions exécutives au quotidien : ce que ça veut dire concrètement", type: "subchapter" },
          { label: "Sous-chapitre 1.3 · Identifier les déclencheurs spécifiques TDAH", type: "subchapter" },
          { label: "Sous-chapitre 1.4 · Repérer les moments de vulnérabilité : devoirs, repas, coucher, matin, transitions", type: "subchapter" },
        ],
      },
      {
        title: "Chapitre 2 · La dysrégulation émotionnelle",
        items: [
          { label: "Sous-chapitre 2.1 · Pourquoi les réactions semblent disproportionnées", type: "subchapter" },
          { label: "Sous-chapitre 2.2 · Distinguer crise émotionnelle, débordement TDAH et opposition", type: "subchapter" },
          { label: "Ressource : Grille d'observation du fonctionnement TDAH", type: "resource" },
        ],
      },
    ],
  },
  {
    id: "s4",
    title: "Section 4 — Prévenir les débordements",
    chapters: [
      {
        title: "Chapitre 1 · Structurer l'environnement",
        items: [
          { label: "Sous-chapitre 1.1 · Routines visuelles adaptées au TDAH", type: "subchapter" },
          { label: "Sous-chapitre 1.2 · Les timers et outils d'externalisation de la mémoire", type: "subchapter" },
          { label: "Sous-chapitre 1.3 · Aménager l'espace de travail et de vie", type: "subchapter" },
          { label: "Ressource : Routine visuelle TDAH personnalisable", type: "resource" },
        ],
      },
      {
        title: "Chapitre 2 · Adapter les consignes et les demandes",
        items: [
          { label: "Sous-chapitre 2.1 · Une consigne à la fois : courte, concrète, immédiate", type: "subchapter" },
          { label: "Sous-chapitre 2.2 · Anticiper les transitions : préavis, rituels de passage", type: "subchapter" },
          { label: "Sous-chapitre 2.3 · Réduire la charge cognitive : découper les tâches, externaliser", type: "subchapter" },
        ],
      },
      {
        title: "Chapitre 3 · Le renforcement positif",
        items: [
          { label: "Sous-chapitre 3.1 · Pourquoi ça marche différemment avec un enfant TDAH", type: "subchapter" },
          { label: "Sous-chapitre 3.2 · Les programmes d'habiletés parentales (PEHP) recommandés par la HAS", type: "subchapter" },
          { label: "Sous-chapitre 3.3 · Mettre en place un système de renforcement à la maison", type: "subchapter" },
          { label: "Ressource : Fiche prévention des débordements", type: "resource" },
        ],
      },
    ],
  },
  {
    id: "s5",
    title: "Section 5 — Gérer les débordements émotionnels",
    chapters: [
      {
        title: "Chapitre 1 · Comprendre ce qui se passe",
        items: [
          { label: "Sous-chapitre 1.1 · La dysrégulation émotionnelle TDAH : base neurologique", type: "subchapter" },
          { label: "Sous-chapitre 1.2 · Différencier crise TDAH, opposition, surcharge et fatigue", type: "subchapter" },
          { label: "Sous-chapitre 1.3 · Ce que ressent l'enfant pendant le débordement", type: "subchapter" },
        ],
      },
      {
        title: "Chapitre 2 · Intervenir pendant le débordement",
        items: [
          { label: "Sous-chapitre 2.1 · Se réguler soi-même d'abord", type: "subchapter" },
          { label: "Sous-chapitre 2.2 · Protocole d'intervention : sécuriser, parler moins, structurer plus", type: "subchapter" },
          { label: "Sous-chapitre 2.3 · Construire sa phrase parentale repère", type: "subchapter" },
          { label: "Ressource : Fiche gestion des débordements émotionnels", type: "resource" },
        ],
      },
      {
        title: "Chapitre 3 · Après le débordement",
        items: [
          { label: "Sous-chapitre 3.1 · Revenir sur l'événement sans culpabiliser", type: "subchapter" },
          { label: "Sous-chapitre 3.2 · Le débrief simple et visuel", type: "subchapter" },
          { label: "Sous-chapitre 3.3 · Préparer une stratégie pour la prochaine fois", type: "subchapter" },
        ],
      },
    ],
  },
  {
    id: "s6",
    title: "Section 6 — Les grands sujets du quotidien",
    chapters: [
      {
        title: "Chapitre 1 · Devoirs et fatigabilité cognitive",
        items: [
          { label: "Sous-chapitre 1.1 · Pourquoi les devoirs sont si difficiles avec un enfant TDAH", type: "subchapter" },
          { label: "Sous-chapitre 1.2 · Structurer la séance : timer, découpage, pauses", type: "subchapter" },
          { label: "Sous-chapitre 1.3 · Ce qui aide vraiment vs ce qui aggrave", type: "subchapter" },
          { label: "Ressource : Fiche devoirs TDAH", type: "resource" },
        ],
      },
      {
        title: "Chapitre 2 · École et aménagements",
        items: [
          { label: "Sous-chapitre 2.1 · Les aménagements possibles : PAP, AESH, tiers-temps", type: "subchapter" },
          { label: "Sous-chapitre 2.2 · Communiquer efficacement avec l'enseignant", type: "subchapter" },
          { label: "Sous-chapitre 2.3 · Le PPS : quand et comment le demander", type: "subchapter" },
          { label: "Ressource : Fiche école et aménagements TDAH", type: "resource" },
        ],
      },
      {
        title: "Chapitre 3 · Repas, sommeil et hygiène",
        items: [
          { label: "Sous-chapitre 3.1 · Repas : impulsivité à table, difficultés à rester assis", type: "subchapter" },
          { label: "Sous-chapitre 3.2 · Sommeil : endormissement difficile, cerveau hyperactif le soir", type: "subchapter" },
          { label: "Sous-chapitre 3.3 · Hygiène et transitions : les rituels qui aident", type: "subchapter" },
        ],
      },
      {
        title: "Chapitre 4 · Relations avec la fratrie",
        items: [
          { label: "Sous-chapitre 4.1 · Ce que vivent les frères et sœurs d'un enfant TDAH", type: "subchapter" },
          { label: "Sous-chapitre 4.2 · Équité vs égalité : expliquer sans culpabiliser", type: "subchapter" },
          { label: "Sous-chapitre 4.3 · Préserver un temps individuel pour chaque enfant", type: "subchapter" },
          { label: "Ressource : Fiche fratrie TDAH", type: "resource" },
        ],
      },
    ],
  },
  {
    id: "s7",
    title: "Section 7 — Posture parentale",
    chapters: [
      {
        title: "Chapitre 1 · Développer une posture adaptée",
        items: [
          { label: "Sous-chapitre 1.1 · Poser un cadre clair sans rigidifier : le paradoxe TDAH", type: "subchapter" },
          { label: "Sous-chapitre 1.2 · Les principes Barkley adaptés au quotidien familial", type: "subchapter" },
          { label: "Sous-chapitre 1.3 · Conséquences immédiates et cohérence : pourquoi le différé ne fonctionne pas", type: "subchapter" },
          { label: "Sous-chapitre 1.4 · Renforcer les comportements adaptés", type: "subchapter" },
        ],
      },
      {
        title: "Chapitre 2 · Préserver l'équilibre familial",
        items: [
          { label: "Sous-chapitre 2.1 · Gérer sa propre régulation émotionnelle en tant que parent", type: "subchapter" },
          { label: "Sous-chapitre 2.2 · Le burn-out parental : le reconnaître et l'éviter", type: "subchapter" },
          { label: "Sous-chapitre 2.3 · Préserver la relation de couple face à la charge du TDAH", type: "subchapter" },
          { label: "Ressource : Fiche posture parentale TDAH", type: "resource" },
        ],
      },
    ],
  },
  {
    id: "s8",
    title: "Section 8 — Entretien expérientiel",
    chapters: [
      {
        title: "Chapitre 1 · Personnalisation du parcours",
        items: [
          { label: "Sous-chapitre 1.1 · Relier les contenus à la situation vécue par la famille", type: "subchapter" },
          { label: "Sous-chapitre 1.2 · Identifier les priorités du quotidien", type: "subchapter" },
          { label: "Sous-chapitre 1.3 · Contextualiser les difficultés spécifiques à ce profil TDAH", type: "subchapter" },
          { label: "Sous-chapitre 1.4 · Construire un plan d'action réaliste pour le quotidien", type: "subchapter" },
          { label: "Ressource : Plan d'action familial TDAH", type: "resource" },
        ],
      },
    ],
  },
].map((section, index) => ({
  ...section,
  imageUrl: SECTION_IMAGES[index],
}));
