export type BlogSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  hero: string;
  sections: BlogSection[];
  ctaHref: string;
  ctaLabel: string;
};

const readingTime = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(3, Math.ceil(words / 200))} min`;
};

const buildReadTime = (sections: BlogSection[]) => {
  const text = sections.flatMap((s) => [s.title, ...s.paragraphs]).join(" ");
  return readingTime(text);
};

export const posts: BlogPost[] = [
  {
    slug: "reviser-avec-un-tdah-strategie-ia",
    title: "Comment réviser avec un TDAH : 5 stratégies concrètes boostées par l'IA.",
    description:
      "Comprenez la paralysie de l'analyse, découpez vos tâches et utilisez l'IA pour relancer l'initiation.",
    category: "TDAH",
    date: "2026-03-15",
    author: "Équipe nevo.",
    hero: "Stratégies concrètes pour réviser avec un TDAH sans s'épuiser.",
    sections: [
      {
        id: "paralysie",
        title: "La paralysie de l'analyse : quand démarrer devient impossible",
        paragraphs: [
          "Le TDAH ne manque pas de motivation, il manque de friction minimale pour démarrer. La charge de décision (par quoi commencer, combien de temps, quel support) crée un brouillard cognitif qui bloque l'action.",
          "Le premier objectif n'est pas de faire beaucoup, mais de faire le premier pas. L'IA peut réduire l'effort d'initiation en préparant l'environnement et en découpant le cours.",
        ],
      },
      {
        id: "micro-taches",
        title: "Découper en micro-tâches pour relancer l'initiation",
        paragraphs: [
          "Une tâche trop grande équivaut à un arrêt net. Une micro-tâche de 5 minutes est un pont franchissable. Utilisez des cycles courts pour briser le blocage.",
          "Le Mode Focus de nevo. découpe automatiquement une séance en segments courts et gérables.",
        ],
      },
      {
        id: "pomodoro",
        title: "Pomodoro adapté : 15/5 ou 25/5 selon votre énergie",
        paragraphs: [
          "Le Pomodoro classique n'est pas universel. Commencez avec 15 minutes si votre attention est fragile, puis augmentez progressivement.",
          "L'IA peut suggérer des cycles en fonction de votre fatigue et de vos résultats.",
        ],
      },
      {
        id: "neo",
        title: "Neo comme déclencheur : demander une fiche, un quiz, un plan",
        paragraphs: [
          "Un simple \"Neo, fais-moi une fiche\" transforme une intention vague en action concrète.",
          "La commande réduit la friction mentale et place l'IA en partenaire d'exécution.",
        ],
      },
      {
        id: "rituels",
        title: "Rituels courts et réguliers : la vraie constance",
        paragraphs: [
          "La constance bat la perfection. Fixez un rituel de 10 minutes par jour et augmentez quand l'élan est lancé.",
          "Mesurez les progrès par les micro-victoires, pas par la durée.",
        ],
      },
    ],
    ctaHref: "/app-landing/features/mode-focus",
    ctaLabel: "Découvrir le Mode Focus",
    readTime: "",
  },
  {
    slug: "dyslexie-etudes-audio-lecture-ia",
    title: "Études et Dyslexie : Pourquoi l'audio-lecture change la donne en 2026.",
    description:
      "Fatigue visuelle, décodage phonologique et voix naturelles : l'audio-lecture devient un levier d'égalité.",
    category: "Dyslexie",
    date: "2026-03-15",
    author: "Équipe nevo.",
    hero: "Lire avec les oreilles pour préserver l'énergie mentale.",
    sections: [
      {
        id: "fatigue",
        title: "Fatigue visuelle et décodage : le coût invisible",
        paragraphs: [
          "La dyslexie ne concerne pas l'intelligence, mais l'effort de décodage. Chaque ligne consomme de l'énergie cognitive.",
          "L'audio-lecture réduit l'effort visuel et libère la mémoire de travail pour la compréhension.",
        ],
      },
      {
        id: "audio",
        title: "L'audio-lecture comme prothèse cognitive",
        paragraphs: [
          "Une voix naturelle apporte un rythme, une ponctuation et une structuration que la lecture difficile ne permet pas toujours.",
          "Les podcasts de cours rendent la révision possible partout, sans fatigue d'écran.",
        ],
      },
      {
        id: "neo",
        title: "Neo et les voix naturelles : de la lecture au dialogue",
        paragraphs: [
          "L'IA lit, mais elle peut aussi répondre : une question sur un passage audio devient un échange.",
          "Cette boucle réduit l'isolement de l'apprenant et renforce la compréhension.",
        ],
      },
    ],
    ctaHref: "/app-landing/features/audio",
    ctaLabel: "Découvrir l'audio nevo.",
    readTime: "",
  },
  {
    slug: "methode-flashcards-automatisation-ia",
    title: "La méthode des Flashcards : Pourquoi l'automatisation IA bat la création manuelle.",
    description:
      "Courbe d'oubli d'Ebbinghaus, répétition espacée et temps gagné : pourquoi l'IA change tout.",
    category: "Méthodes",
    date: "2026-03-15",
    author: "Équipe nevo.",
    hero: "Moins de temps à créer, plus de temps à apprendre.",
    sections: [
      {
        id: "oubli",
        title: "La courbe d'oubli d'Ebbinghaus, en pratique",
        paragraphs: [
          "La mémoire décline rapidement après l'apprentissage. La répétition espacée est une réponse scientifique à cette perte.",
          "Les flashcards permettent un rappel actif, supérieur à la relecture passive.",
        ],
      },
      {
        id: "automatisation",
        title: "Automatiser la création pour gagner du temps",
        paragraphs: [
          "Créer des cartes est chronophage. L'IA peut extraire les questions-réponses clés automatiquement.",
          "Le temps gagné peut être investi dans l'entraînement, là où la mémorisation se crée.",
        ],
      },
      {
        id: "efficacite",
        title: "Répétition espacée et feedback immédiat",
        paragraphs: [
          "Un système intelligent propose les cartes au bon moment, juste avant l'oubli.",
          "L'IA ajuste la difficulté pour maintenir un effort optimal.",
        ],
      },
    ],
    ctaHref: "/app-landing/features/flashcards",
    ctaLabel: "Découvrir les Flashcards nevo.",
    readTime: "",
  },
];

posts.forEach((post) => {
  post.readTime = buildReadTime(post.sections);
});
