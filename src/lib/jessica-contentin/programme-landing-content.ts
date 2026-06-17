export const JESSICA_PROGRAMME_COLORS = {
  marine: "#0d1b2e",
  marineLight: "#15283f",
  creme: "#f7f5f0",
  cremeDeep: "#efeae0",
  or: "#c8a96e",
  orDeep: "#a9854a",
  bleuGris: "#5b7a8c",
  texte: "#2d3748",
  texteClair: "#6b7280",
} as const;

export const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export type ProgrammeLandingContent = {
  slug: string;
  eyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  preuveTitle: string;
  preuveStats: { value: string; label: string }[];
  preuveQuote: string;
  recouvreTitle: string;
  recouvreIntro: string;
  cartes: { titre: string; def: string; lien: string }[];
  etapesTitle: string;
  etapes: { n: string; titre: string; texte: string }[];
  changeTitle: string;
  changeItems: { titre: string; texte: string }[];
  modalitesTitle: string;
  modalitesText: string;
  faqs: { q: string; a: string }[];
  ctaTitle: string;
  ctaSubtitle: string;
};

export const PROGRAMME_LANDING_BY_SLUG: Record<string, ProgrammeLandingContent> = {
  "comprendre-pour-apaiser": {
    slug: "comprendre-pour-apaiser",
    eyebrow: "Parcours d'accompagnement",
    heroTitle: "Comprendre le fonctionnement de votre enfant pour l'aider à s'apaiser",
    heroSubtitle:
      "TDAH, TSA, troubles DYS, haut potentiel — chaque profil a sa logique. Un accompagnement qui part de cette logique, pas d'un diagnostic figé.",
    preuveTitle: "Une expertise construite sur le terrain, pas seulement en cabinet",
    preuveStats: [
      { value: "100+", label: "jeunes accompagnés" },
      { value: "10 ans", label: "d'expérience en éducation" },
      { value: "2 ans", label: "au CRA de Basse-Normandie et à la MDPH du Calvados" },
    ],
    preuveQuote:
      "Comprendre un diagnostic, c'est une chose. Avoir vu, de l'intérieur, comment les dossiers TND sont évalués et orientés à la MDPH et au CRA, c'en est une autre.",
    recouvreTitle: "TDAH, TSA, DYS, HPI : des fonctionnements différents, pas des défauts",
    recouvreIntro:
      "Chaque trouble du neurodéveloppement a sa propre signature cognitive. Le but n'est jamais de « corriger » un enfant, mais de comprendre comment son cerveau fonctionne pour construire des stratégies qui lui correspondent.",
    cartes: [
      { titre: "TDAH", def: "Touche l'attention, les fonctions exécutives et la régulation émotionnelle.", lien: "/specialites/tdah" },
      { titre: "TSA", def: "Modifie la communication, les interactions sociales et le traitement sensoriel.", lien: "/specialites/tsa" },
      { titre: "Troubles DYS", def: "Dyslexie, dyspraxie, dyscalculie — des apprentissages spécifiques affectés.", lien: "/specialites/tnd" },
      { titre: "Haut potentiel", def: "Pas un trouble, mais un fonctionnement atypique souvent mal compris.", lien: "/specialites/haut-potentiel" },
    ],
    etapesTitle: "Trois étapes, un rythme adapté à votre enfant",
    etapes: [
      { n: "01", titre: "Comprendre", texte: "Un temps d'écoute et d'analyse du fonctionnement cognitif, émotionnel et comportemental, sans jugement ni précipitation." },
      { n: "02", titre: "Construire", texte: "Des stratégies concrètes, adaptées à l'âge et au profil — pas une méthode générique appliquée à tous." },
      { n: "03", titre: "Ajuster", texte: "Un suivi dans la durée, avec des points de réajustement réguliers, en lien avec l'école si c'est utile." },
    ],
    changeTitle: "Ce que les familles observent généralement",
    changeItems: [
      { titre: "Moins de tension à la maison", texte: "Comprendre pourquoi un enfant réagit comme il réagit retire une grande partie du conflit du quotidien." },
      { titre: "Une scolarité moins subie", texte: "Des stratégies qui correspondent au fonctionnement réel de l'enfant, pas à ce qu'on attend de lui." },
      { titre: "Un enfant qui se sent moins seul", texte: "Mettre des mots sur un fonctionnement différent, c'est aussi retirer une part de honte." },
    ],
    modalitesTitle: "Consultation au cabinet, à Bretteville-sur-Odon",
    modalitesText:
      "Chaque accompagnement démarre par un premier rendez-vous pour poser les bases : comprendre la situation, clarifier vos attentes, et définir ensemble si ce parcours est le bon.",
    faqs: [
      { q: "Faut-il un diagnostic posé avant de venir consulter ?", a: "Non. Beaucoup de familles viennent justement parce qu'elles s'interrogent, sans diagnostic encore posé." },
      { q: "Mon enfant n'a pas de diagnostic mais je suspecte un trouble, que faire ?", a: "On peut en discuter dès le premier rendez-vous. Si une orientation vers un médecin, un CRA ou une MDPH est pertinente, elle sera proposée clairement." },
      { q: "L'accompagnement remplace-t-il un suivi avec un médecin ou un CRA ?", a: "Non, il le complète. Le suivi psychopédagogique travaille les stratégies du quotidien ; le diagnostic médical reste du ressort des médecins et des structures spécialisées." },
      { q: "Travaillez-vous en lien avec l'école de mon enfant ?", a: "Oui, lorsque c'est pertinent et avec votre accord." },
      { q: "Combien de temps dure l'accompagnement ?", a: "Cela dépend de la situation. Le rythme est toujours réévalué ensemble." },
      { q: "Proposez-vous un premier échange avant de s'engager ?", a: "Oui. Le premier rendez-vous sert à clarifier la situation et à voir ensemble si ce parcours est adapté." },
    ],
    ctaTitle: "Un échange suffit souvent pour voir si ce parcours est adapté",
    ctaSubtitle: "Pas d'engagement, pas de pression. Juste un premier pas pour mieux comprendre.",
  },
  "declic-etudes": {
    slug: "declic-etudes",
    eyebrow: "Parcours d'accompagnement",
    heroTitle: "Apprendre, s'orienter et réussir — à sa manière",
    heroSubtitle:
      "Méthodes de travail, organisation, confiance et orientation : un accompagnement qui s'adapte au fonctionnement réel de l'élève ou de l'étudiant.",
    preuveTitle: "Des stratégies qui tiennent dans le quotidien scolaire",
    preuveStats: [
      { value: "100+", label: "jeunes accompagnés" },
      { value: "10 ans", label: "d'expérience en éducation" },
      { value: "1:1", label: "un accompagnement individualisé" },
    ],
    preuveQuote:
      "La réussite scolaire ne dépend pas seulement de la volonté. Elle dépend aussi de méthodes adaptées au cerveau de chacun.",
    recouvreTitle: "Ce que ce parcours adresse concrètement",
    recouvreIntro:
      "Difficultés d'attention, démotivation, anxiété aux examens, blocages en méthodologie ou questionnement d'orientation : chaque situation appelle des leviers différents.",
    cartes: [
      { titre: "Méthodologie", def: "Organisation, mémorisation et gestion du temps adaptées au profil.", lien: "/specialites/strategie-apprentissage" },
      { titre: "Orientation", def: "Clarifier les filières, les choix et le projet d'avenir.", lien: "/specialites/orientation-professionnelle" },
      { titre: "Confiance", def: "Retrouver le sentiment de compétence et l'engagement.", lien: "/specialites/confiance-en-soi" },
      { titre: "Stress scolaire", def: "Apaiser l'anxiété et la pression des examens.", lien: "/specialites/gestion-stress" },
    ],
    etapesTitle: "Trois étapes pour retrouver une dynamique positive",
    etapes: [
      { n: "01", titre: "Diagnostiquer", texte: "Identifier les blocages réels : attention, organisation, émotions, rapport aux apprentissages." },
      { n: "02", titre: "Outiller", texte: "Mettre en place des stratégies concrètes, testées et ajustées à la situation scolaire." },
      { n: "03", titre: "Consolider", texte: "Ancrer les habitudes et préparer les étapes clés : examens, orientation, autonomie." },
    ],
    changeTitle: "Ce que les familles et les jeunes constatent",
    changeItems: [
      { titre: "Une relation aux devoirs apaisée", texte: "Moins de luttes, plus de clarté sur ce qui fonctionne vraiment." },
      { titre: "Des choix d'orientation éclairés", texte: "Un projet qui correspond aux forces et aux aspirations réelles." },
      { titre: "Une confiance qui revient", texte: "Le sentiment de pouvoir réussir avec ses propres ressources." },
    ],
    modalitesTitle: "Consultation au cabinet, à Bretteville-sur-Odon",
    modalitesText:
      "Le premier rendez-vous permet de faire le point sur la situation scolaire et de définir ensemble les priorités d'accompagnement.",
    faqs: [
      { q: "À partir de quel âge peut-on commencer ?", a: "Dès le primaire pour certains besoins, et tout au long du collège, du lycée et des études supérieures." },
      { q: "Intervenez-vous aussi sur Parcoursup ?", a: "Oui, l'accompagnement peut inclure la préparation des vœux et la construction du projet post-bac." },
      { q: "Faut-il un bilan scolaire préalable ?", a: "Non. L'échange initial permet déjà d'orienter la démarche." },
      { q: "Travaillez-vous avec l'établissement scolaire ?", a: "Oui, si vous le souhaitez et si c'est utile pour la mise en place des stratégies." },
      { q: "Les séances sont-elles individuelles ?", a: "Oui, l'accompagnement est individualisé. Des temps avec les parents peuvent être prévus." },
      { q: "Comment prendre rendez-vous ?", a: "Via la plateforme Perfactive ou en me contactant directement depuis le site." },
    ],
    ctaTitle: "Un premier échange pour clarifier la situation",
    ctaSubtitle: "Sans engagement — pour voir si ce parcours correspond à vos besoins.",
  },
  "apaiser-le-mental": {
    slug: "apaiser-le-mental",
    eyebrow: "Parcours d'accompagnement",
    heroTitle: "Comprendre son fonctionnement pour retrouver un meilleur équilibre",
    heroSubtitle:
      "Stress, surcharge mentale, émotions intenses : identifier ce qui se joue pour apaiser le corps et l'esprit, à votre rythme.",
    preuveTitle: "Une approche qui relie corps, émotions et cognition",
    preuveStats: [
      { value: "100+", label: "personnes accompagnées" },
      { value: "Neuro", label: "éducation et psychopédagogie" },
      { value: "Sur mesure", label: "stratégies personnalisées" },
    ],
    preuveQuote:
      "Apaiser ce n'est pas supprimer les émotions. C'est comprendre leurs mécanismes pour mieux les réguler.",
    recouvreTitle: "Les situations que ce parcours peut adresser",
    recouvreIntro:
      "Anxiété, rumination, fatigue chronique, difficultés de sommeil ou de concentration : chaque profil nécessite des outils différents.",
    cartes: [
      { titre: "Gestion du stress", def: "Identifier les déclencheurs et développer des stratégies de régulation.", lien: "/specialites/gestion-stress" },
      { titre: "Émotions", def: "Comprendre et accueillir ce qui se passe intérieurement.", lien: "/specialites/therapie" },
      { titre: "Fonctions exécutives", def: "Organisation, attention et planification au quotidien.", lien: "/specialites/strategie-apprentissage" },
      { titre: "Neuroéducation", def: "S'appuyer sur les neurosciences pour mieux se comprendre.", lien: "/specialites/neuroeducation" },
    ],
    etapesTitle: "Trois étapes vers un équilibre plus durable",
    etapes: [
      { n: "01", titre: "Observer", texte: "Repérer les signaux du corps et de l'esprit, sans jugement." },
      { n: "02", titre: "Comprendre", texte: "Relier émotions, pensées et comportements pour identifier les leviers." },
      { n: "03", titre: "Stabiliser", texte: "Installer des routines et des outils de régulation adaptés au quotidien." },
    ],
    changeTitle: "Ce que les personnes accompagnées ressentent",
    changeItems: [
      { titre: "Plus de clarté intérieure", texte: "Mieux comprendre ce qui se passe en soi, sans se sentir submergé." },
      { titre: "Des réactions plus maîtrisées", texte: "Des stratégies concrètes pour les moments de tension." },
      { titre: "Un rythme de vie soutenable", texte: "Retrouver de l'énergie et de la présence au quotidien." },
    ],
    modalitesTitle: "Consultation au cabinet, à Bretteville-sur-Odon",
    modalitesText:
      "Le premier rendez-vous est un temps d'écoute pour comprendre votre situation et définir ensemble les objectifs de l'accompagnement.",
    faqs: [
      { q: "Est-ce un suivi thérapeutique ?", a: "Non. Il s'agit d'un accompagnement psychopédagogique centré sur la compréhension du fonctionnement et les stratégies du quotidien." },
      { q: "Pour qui est ce parcours ?", a: "Adolescents, étudiants et adultes confrontés au stress, à l'anxiété ou à une surcharge mentale." },
      { q: "Combien de séances sont nécessaires ?", a: "Cela varie. Certaines personnes viennent pour un accompagnement ciblé, d'autres pour un suivi plus long." },
      { q: "Proposez-vous des séances en visio ?", a: "Oui, selon les besoins et la situation." },
      { q: "Faut-il un suivi médical en parallèle ?", a: "Si nécessaire, une orientation vers un professionnel de santé sera proposée." },
      { q: "Comment se déroule le premier rendez-vous ?", a: "C'est un temps d'échange pour comprendre votre situation et voir si ce parcours vous convient." },
    ],
    ctaTitle: "Un premier pas vers plus de clarté",
    ctaSubtitle: "Un échange suffit souvent pour voir si cet accompagnement est fait pour vous.",
  },
  "trouver-sa-voie": {
    slug: "trouver-sa-voie",
    eyebrow: "Parcours d'accompagnement",
    heroTitle: "Émotions, stress et adaptation — pour avancer sereinement",
    heroSubtitle:
      "Comprendre les mécanismes du stress et de l'adaptation pour développer des stratégies de régulation émotionnelle efficaces, à chaque étape de la vie.",
    preuveTitle: "Un accompagnement qui relie émotions et projet de vie",
    preuveStats: [
      { value: "100+", label: "jeunes et familles accompagnés" },
      { value: "Parcoursup", label: "orientation post-bac" },
      { value: "Sur mesure", label: "chaque situation est unique" },
    ],
    preuveQuote:
      "Trouver sa voie, ce n'est pas choisir une filière au hasard. C'est comprendre qui l'on est et ce qui nous fait vibrer.",
    recouvreTitle: "Les dimensions de ce parcours",
    recouvreIntro:
      "Régulation émotionnelle, gestion du stress, adaptation aux transitions et construction du projet : tout est interconnecté.",
    cartes: [
      { titre: "Transitions", def: "Changements de classe, de lycée, d'études ou de vie.", lien: "/specialites/orientation-professionnelle" },
      { titre: "Stress & adaptation", def: "Comprendre les réactions face à l'inconnu et à la pression.", lien: "/specialites/gestion-stress" },
      { titre: "Émotions", def: "Accueillir et réguler ce qui traverse au quotidien.", lien: "/specialites/therapie" },
      { titre: "Projet d'avenir", def: "Mettre en cohérence compétences, intérêts et choix.", lien: "/specialites/orientation-professionnelle" },
    ],
    etapesTitle: "Trois étapes pour avancer avec plus de sérénité",
    etapes: [
      { n: "01", titre: "Accueillir", texte: "Prendre le temps de comprendre la situation émotionnelle et les enjeux du moment." },
      { n: "02", titre: "Explorer", texte: "Identifier les ressources, les freins et les pistes d'adaptation possibles." },
      { n: "03", titre: "Agir", texte: "Construire un plan concret, avec des objectifs réalistes et ajustables." },
    ],
    changeTitle: "Ce que ce parcours peut changer",
    changeItems: [
      { titre: "Moins de stress face aux choix", texte: "Des décisions prises avec plus de lucidité et moins de peur." },
      { titre: "Une meilleure connaissance de soi", texte: "Comprendre ses forces, ses sensibilités et ses besoins." },
      { titre: "Un projet plus aligné", texte: "Des choix scolaires ou professionnels qui ont du sens." },
    ],
    modalitesTitle: "Consultation au cabinet, à Bretteville-sur-Odon",
    modalitesText:
      "Le premier rendez-vous permet de faire le point sur votre situation et de voir ensemble comment avancer.",
    faqs: [
      { q: "Ce parcours est-il réservé aux adolescents ?", a: "Non. Il s'adresse aussi aux étudiants et aux adultes en transition." },
      { q: "Peut-on combiner orientation et gestion du stress ?", a: "Oui, c'est souvent le cas. Les deux dimensions sont liées." },
      { q: "Faut-il savoir ce qu'on veut faire avant de venir ?", a: "Non. Beaucoup viennent justement parce qu'ils ne savent pas encore." },
      { q: "Intervenez-vous auprès des familles ?", a: "Oui, des temps de guidance parentale peuvent être intégrés si nécessaire." },
      { q: "Comment se déroulent les séances ?", a: "En individuel, au cabinet ou en visio, avec un rythme adapté à vos besoins." },
      { q: "Comment prendre rendez-vous ?", a: "Via Perfactive ou depuis la page Consultations du site." },
    ],
    ctaTitle: "Un échange pour clarifier la suite",
    ctaSubtitle: "Sans pression — pour voir si ce parcours vous correspond.",
  },
};

export function getProgrammeLandingContent(slug: string): ProgrammeLandingContent | undefined {
  return PROGRAMME_LANDING_BY_SLUG[slug];
}
