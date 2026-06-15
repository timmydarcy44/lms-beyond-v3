import {
  JESSICA_PARCOURS_HERO_IMAGE,
  JESSICA_RESOURCE_SLIDER_IMAGES,
} from "@/lib/jessica-contentin/media-urls";
import { PARCOURS_TDAH_SECTIONS } from "@/lib/jessica-contentin/parcours-guide-tdah-syllabus";

export type ParcoursGuideModule = {
  id: string;
  title: string;
  items: string[];
};

export type ParcoursGuideSyllabusItem = {
  label: string;
  type?: "subchapter" | "resource" | "entretien";
};

export type ParcoursGuideChapter = {
  title: string;
  items: ParcoursGuideSyllabusItem[];
};

export type ParcoursGuideSection = {
  id: string;
  title: string;
  imageUrl?: string;
  chapters: ParcoursGuideChapter[];
};

export type ParcoursDownloadResourceSlide = {
  id: string;
  title: string;
  description: string;
  detail: string;
  imageUrl: string;
};

export type ParcoursGuide = {
  slug: string;
  kicker: string;
  title: string;
  subtitle: string;
  cardTag: string;
  imageUrl: string;
  /** Cours LMS lié (accès via enrollments) */
  courseId?: string;
  courseSlug?: string;
  price: number;
  /** Recherche catalogue si catalogItemId absent */
  catalogLookupTitle?: string;
  catalogItemId?: string | null;
  contentId?: string | null;
  /** Lien après achat */
  startHref?: string;
  intro: string[];
  objectives: string[];
  modules: ParcoursGuideModule[];
  /** Programme détaillé (sections / chapitres) — affiché à la place des modules si présent */
  sections?: ParcoursGuideSection[];
  entretien: string;
  livrables: string[];
  downloadResourceSlides?: ParcoursDownloadResourceSlide[];
  promesse: string;
};

export const PARCOURS_GUIDES: ParcoursGuide[] = [
  {
    slug: "enfant-tsa",
    kicker: "Parcours parental digitalisé",
    title: "Avoir un enfant avec un TSA : comprendre, accompagner, ajuster",
    subtitle:
      "Un parcours pour les parents d'un enfant présentant un trouble du spectre de l'autisme ou des particularités compatibles.",
    cardTag: "Parents · TSA · Guidance parentale",
    imageUrl: "/jessica-contentin/parcours-enfant-tsa-hero.png",
    courseId: "7b692c0f-4df8-4839-83a5-55ade0eb8ae0",
    courseSlug: "avoir-un-enfant-avec-un-tsa-comprendre-accompagner-ajuster",
    contentId: "7b692c0f-4df8-4839-83a5-55ade0eb8ae0",
    price: 249,
    catalogLookupTitle: "TSA",
    startHref:
      "/formations/avoir-un-enfant-avec-un-tsa-comprendre-accompagner-ajuster/play/chapter-1780909102856-0-0",
    intro: [
      "Ce parcours s'adresse aux parents d'un enfant présentant un trouble du spectre de l'autisme ou des particularités de fonctionnement compatibles avec un TSA. Il a pour objectif de leur apporter des repères clairs, des outils concrets et un espace de contextualisation de leur vécu parental.",
      "Le parcours associe des contenus pédagogiques accessibles, des supports pratiques, des exercices d'observation du quotidien et un entretien expérientiel permettant d'adapter les apports à la situation réelle de la famille. Un assistant IA intégré permet également aux parents de poser leurs questions, de reformuler les notions abordées et de retrouver facilement les outils proposés.",
    ],
    objectives: [
      "Comprendre le fonctionnement TSA de l'enfant.",
      "Identifier les situations de surcharge, de crise ou de blocage.",
      "Mettre en place des repères visuels, temporels et émotionnels.",
      "Adapter les réponses parentales face aux crises, aux colères et aux rigidités.",
      "Mieux accompagner les repas, les devoirs, l'hygiène, les rituels, les relations avec la fratrie et l'école.",
      "Développer une posture parentale plus sécurisante, cohérente et ajustée.",
    ],
    modules: [
      {
        id: "m1",
        title: "Module 1 — Comprendre le TSA",
        items: [
          "Définition du trouble du spectre de l'autisme.",
          "Particularités de communication, d'interaction sociale, de flexibilité, de sensorialité et de régulation émotionnelle.",
          "Différence entre caprice, opposition, anxiété, surcharge et meltdown.",
        ],
      },
      {
        id: "m2",
        title: "Module 2 — Comprendre son enfant au quotidien",
        items: [
          "Identifier les déclencheurs.",
          "Observer les besoins sensoriels, émotionnels et cognitifs.",
          "Repérer les moments de vulnérabilité : transitions, fatigue, imprévus, bruit, devoirs, repas, séparation.",
          "Créer une grille d'observation familiale.",
        ],
      },
      {
        id: "m3",
        title: "Module 3 — Prévenir les crises",
        items: [
          "Mettre en place des routines visuelles.",
          "Anticiper les changements.",
          "Adapter les consignes.",
          "Réduire la surcharge.",
          "Construire un environnement plus prévisible.",
        ],
      },
      {
        id: "m4",
        title: "Module 4 — Réagir pendant une crise",
        items: [
          "Sécuriser sans surstimuler.",
          "Parler moins, parler mieux.",
          "Différencier crise émotionnelle, opposition et surcharge.",
          "Construire une phrase parentale repère.",
          "Créer un protocole familial de gestion de crise.",
        ],
      },
      {
        id: "m5",
        title: "Module 5 — Après la crise",
        items: [
          "Revenir sur l'événement sans culpabiliser.",
          "Utiliser un débrief simple et visuel.",
          "Identifier ce qui a aidé ou aggravé.",
          "Préparer une stratégie pour la prochaine fois.",
        ],
      },
      {
        id: "m6",
        title: "Module 6 — Les grands sujets du quotidien",
        items: [
          "Repas et sélectivité alimentaire.",
          "Hygiène et sensorialité.",
          "Devoirs et fatigabilité cognitive.",
          "Rituels et besoin de prévisibilité.",
          "Relations avec la fratrie.",
          "Sommeil et transitions.",
          "École et aménagements possibles.",
        ],
      },
      {
        id: "m7",
        title: "Module 7 — Posture parentale",
        items: [
          "Poser un cadre clair sans rigidifier.",
          "Renforcer les comportements adaptés.",
          "Adapter les principes de guidance parentale, notamment certains repères issus de la méthode Barkley, au fonctionnement TSA.",
          "Préserver l'équilibre familial.",
        ],
      },
    ],
    entretien:
      "Un entretien individuel permet de relier les contenus du parcours à la situation vécue par la famille. Il permet d'identifier les priorités, de contextualiser les difficultés rencontrées et de construire un plan d'action réaliste pour le quotidien.",
    downloadResourceSlides: [
      {
        id: "download-grille",
        title: "Télécharger des ressources",
        description:
          "Grilles d'observation, fiches pratiques et outils personnalisables à conserver sur votre téléphone ou à imprimer.",
        detail:
          "La grille d'observation vous aide à repérer les besoins sensoriels, émotionnels et comportementaux de votre enfant.",
        imageUrl: JESSICA_RESOURCE_SLIDER_IMAGES.grilleObservation,
      },
      {
        id: "anchor-protocole",
        title: "Ancrer les connaissances dans la réalité familiale",
        description:
          "Reliez les apports du parcours à votre vécu : protocoles, routines et plans d'action concrets pour la maison.",
        detail:
          "Le protocole en 5 étapes vous guide pas à pas pendant une crise, sans surstimulation.",
        imageUrl: JESSICA_RESOURCE_SLIDER_IMAGES.protocoleCrise,
      },
      {
        id: "anchor-alimentation",
        title: "Ancrer les connaissances dans la réalité familiale",
        description:
          "Des stratégies progressives pour le quotidien : repas, devoirs, fratrie, transitions et rituels.",
        detail:
          "Chaque fiche traduit la théorie en gestes concrets adaptés au fonctionnement TSA de votre enfant.",
        imageUrl: JESSICA_RESOURCE_SLIDER_IMAGES.strategiesAlimentaires,
      },
      {
        id: "annotate-devoirs",
        title: "Annoter les ressources",
        description:
          "Personnalisez vos outils : séquences devoirs, checklists de séance, organisation familiale.",
        detail:
          "Notez ce qui fonctionne chez vous et construisez des routines réalistes, étape par étape.",
        imageUrl: JESSICA_RESOURCE_SLIDER_IMAGES.ficheDevoirs,
      },
      {
        id: "anchor-fratrie",
        title: "Ancrer les connaissances dans la réalité familiale",
        description:
          "Organisez le quotidien fraternel : équité, temps individuel et repères partagés pour toute la famille.",
        detail:
          "La fiche fratrie vous aide à identifier ce qui fonctionne, ce qui génère des tensions et comment préserver l'équilibre.",
        imageUrl: JESSICA_RESOURCE_SLIDER_IMAGES.organisationFratrie,
      },
    ],
    livrables: [
      "Une grille d'observation du fonctionnement de l'enfant.",
      "Une fiche « prévenir une crise ».",
      "Une fiche « que faire pendant une crise ».",
      "Une routine visuelle personnalisable.",
      "Une fiche devoirs.",
      "Une fiche repas.",
      "Une fiche fratrie.",
      "Une fiche école.",
      "Un plan d'action familial personnalisé.",
    ],
    promesse:
      "Permettre aux parents de mieux comprendre le fonctionnement de leur enfant, de se sentir moins seuls face aux situations complexes et de disposer de repères concrets pour accompagner le quotidien avec plus de clarté, de stabilité et de confiance.",
  },
  {
    slug: "enfant-tdah",
    kicker: "Parcours parental TDAH",
    title: "Avoir un enfant avec un TDAH : comprendre, accompagner, ajuster",
    subtitle:
      "Un parcours pour les parents d'un enfant présentant un trouble du déficit de l'attention avec ou sans hyperactivité.",
    cardTag: "Parents · TDAH · Guidance parentale",
    imageUrl: "/jessica-contentin/parcours-tdah/hero.jpg",
    price: 249,
    catalogLookupTitle: "TDAH",
    intro: [
      "Ce parcours s'adresse aux parents d'un enfant présentant un TDAH ou des particularités de fonctionnement compatibles. Il apporte des repères clairs sur l'inattention, l'hyperactivité, l'impulsivité et la dysrégulation émotionnelle, ainsi que des outils concrets pour le quotidien.",
      "Huit sections structurées — de la compréhension du trouble aux comorbidités, de la prévention des débordements à la posture parentale — avec des ressources téléchargeables et un entretien expérientiel pour adapter chaque étape à votre situation familiale.",
    ],
    objectives: [
      "Comprendre le TDAH et les profils inattention, hyperactivité-impulsivité ou mixte.",
      "Identifier les comorbidités fréquentes (DYS, anxiété, TSA, HPI, TOP, sommeil).",
      "Observer le fonctionnement exécutif et les déclencheurs au quotidien.",
      "Prévenir et gérer les débordements émotionnels avec des outils adaptés.",
      "Structurer devoirs, école, repas, sommeil et relations avec la fratrie.",
      "Développer une posture parentale cohérente, inspirée des repères Barkley et PEHP.",
    ],
    modules: [],
    sections: PARCOURS_TDAH_SECTIONS,
    entretien:
      "Un entretien expérientiel permet de relier les contenus du parcours à la situation vécue par la famille, d'identifier les priorités du quotidien et de construire un plan d'action réaliste adapté au profil TDAH de l'enfant.",
    downloadResourceSlides: [
      {
        id: "tdah-profil",
        title: "Télécharger des ressources",
        description: "Grille de profil TDAH, cartes de comorbidités et outils d'observation personnalisables.",
        detail: "Comprenez le profil unique de votre enfant sans le réduire à une étiquette.",
        imageUrl: JESSICA_RESOURCE_SLIDER_IMAGES.grilleObservation,
      },
      {
        id: "tdah-prevention",
        title: "Prévenir les débordements",
        description: "Routines visuelles, timers et fiches de prévention adaptées au fonctionnement TDAH.",
        detail: "Externalisez la mémoire et réduisez la charge cognitive au quotidien.",
        imageUrl: JESSICA_RESOURCE_SLIDER_IMAGES.protocoleCrise,
      },
      {
        id: "tdah-devoirs",
        title: "Les grands sujets du quotidien",
        description: "Fiches devoirs, école, fratrie et posture parentale à annoter selon votre vécu.",
        detail: "Des outils concrets pour structurer les moments les plus difficiles.",
        imageUrl: JESSICA_RESOURCE_SLIDER_IMAGES.ficheDevoirs,
      },
    ],
    livrables: [
      "Grille de profil TDAH",
      "Carte des comorbidités — profil de mon enfant",
      "Grille d'observation du fonctionnement TDAH",
      "Routine visuelle TDAH personnalisable",
      "Fiche prévention des débordements",
      "Fiche gestion des débordements émotionnels",
      "Fiche devoirs TDAH",
      "Fiche école et aménagements TDAH",
      "Fiche fratrie TDAH",
      "Fiche posture parentale TDAH",
      "Plan d'action familial TDAH",
    ],
    promesse:
      "Permettre aux parents de mieux comprendre le TDAH de leur enfant, de décoder les débordements et l'inattention, et de disposer d'outils concrets pour accompagner le quotidien avec plus de clarté, de cohérence et de sérénité.",
  },
];

export const PARCOURS_GUIDES_BY_SLUG = Object.fromEntries(PARCOURS_GUIDES.map((p) => [p.slug, p]));

export function getParcoursGuide(slug: string): ParcoursGuide | undefined {
  return PARCOURS_GUIDES_BY_SLUG[slug];
}

export function parcoursGuideHref(slug: string): string {
  return `/parcours-guide/${encodeURIComponent(slug)}`;
}

export function jessicaParcoursGuideHref(slug: string): string {
  return `/jessica-contentin/parcours-guide/${encodeURIComponent(slug)}`;
}

export function parcoursGuideStepCount(parcours: ParcoursGuide): number {
  return parcours.sections?.length ?? parcours.modules.length;
}
