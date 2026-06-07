export type ParcoursGuideModule = {
  id: string;
  title: string;
  items: string[];
};

export type ParcoursGuide = {
  slug: string;
  kicker: string;
  title: string;
  subtitle: string;
  cardTag: string;
  imageUrl: string;
  intro: string[];
  objectives: string[];
  modules: ParcoursGuideModule[];
  entretien: string;
  livrables: string[];
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
    imageUrl:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=85",
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
];

export const PARCOURS_GUIDES_BY_SLUG = Object.fromEntries(PARCOURS_GUIDES.map((p) => [p.slug, p]));

export function getParcoursGuide(slug: string): ParcoursGuide | undefined {
  return PARCOURS_GUIDES_BY_SLUG[slug];
}

export function parcoursGuideHref(slug: string): string {
  return `/parcours-guide/${encodeURIComponent(slug)}`;
}
