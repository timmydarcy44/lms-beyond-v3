export type SpecialtyOfferContent = {
  title: string;
  subtitle: string;
  intro: string[];
  situationsTitle: string;
  situations: string[];
  outcomesTitle: string;
  outcomes: string[];
  approach: string;
  /** Override the shared “Pour qui ?” list when needed. */
  forWho?: string[];
};

/** Shared audience block — shown just before the booking CTA. */
export const SPECIALTY_FOR_WHO: string[] = [
  "Aux élèves rencontrant des difficultés d'apprentissage ou d'organisation.",
  "Aux collégiens souhaitant développer une méthode de travail plus efficace.",
  "Aux étudiants confrontés à une charge de travail importante.",
  "Aux personnes présentant un TDAH, un trouble DYS, un TSA ou un Haut Potentiel nécessitant des stratégies adaptées.",
  "À toute personne souhaitant développer des stratégies d'apprentissage fondées sur son propre fonctionnement.",
];

export const SPECIALTY_OFFER_CONTENT: Record<string, SpecialtyOfferContent> = {
  "methodologie-de-travail": {
    title: "Méthodologie de travail",
    subtitle: "Développer une méthodologie fondée sur son fonctionnement cognitif",
    intro: [
      "Une méthodologie de travail efficace ne repose pas sur une succession de techniques universelles. Elle se construit à partir du fonctionnement cognitif de chacun, des exigences rencontrées et des objectifs poursuivis.",
      "Organisation, attention, mémorisation, compréhension ou gestion de la charge de travail sont autant de compétences qui peuvent être développées grâce à des stratégies adaptées.",
      "L'accompagnement vise à identifier les mécanismes qui freinent les apprentissages afin de construire une méthodologie individualisée, durable et directement transférable dans le quotidien scolaire, universitaire ou professionnel.",
    ],
    situationsTitle: "Situations fréquemment rencontrées",
    situations: [
      "Difficultés d'organisation",
      "Manque de méthode",
      "Difficultés de mémorisation",
      "Gestion de l'attention",
      "Procrastination",
      "Difficultés de planification",
      "Préparation des examens",
      "Gestion de la charge de travail",
      "Difficultés à prioriser les tâches",
      "Sentiment d'être rapidement dépassé",
    ],
    outcomesTitle: "L'accompagnement peut permettre de",
    outcomes: [
      "Structurer son organisation",
      "Développer des stratégies d'apprentissage adaptées",
      "Optimiser la mémorisation",
      "Renforcer les capacités attentionnelles",
      "Améliorer la gestion du temps",
      "Développer progressivement son autonomie",
      "Préparer plus sereinement les évaluations",
    ],
    approach:
      "Chaque personne mobilise différemment ses ressources cognitives, attentionnelles et émotionnelles. L'accompagnement repose donc sur une analyse individualisée permettant de construire des stratégies adaptées au fonctionnement réel de la personne, plutôt que sur l'application d'une méthode standardisée.",
  },
  college: {
    title: "Collège",
    subtitle: "Construire des bases solides pour retrouver confiance",
    intro: [
      "Le collège constitue une période charnière dans le parcours scolaire. Les exigences augmentent, l'organisation devient plus complexe et l'autonomie prend une place grandissante.",
      "Chez certains élèves, ces nouvelles attentes peuvent révéler des difficultés jusque-là peu visibles : manque de méthode, difficultés attentionnelles, perte de motivation, baisse des résultats ou diminution progressive de la confiance en soi.",
      "L'accompagnement vise à comprendre les mécanismes à l'origine de ces difficultés afin de construire des stratégies adaptées favorisant une progression durable.",
    ],
    situationsTitle: "Les accompagnements concernent notamment",
    situations: [
      "Difficultés d'apprentissage",
      "Organisation du travail personnel",
      "Méthodologie",
      "Difficultés d'attention",
      "Manque de motivation",
      "Gestion des devoirs",
      "Préparation du brevet",
      "Orientation",
      "Stress scolaire",
      "Confiance en soi",
    ],
    outcomesTitle: "Les objectifs",
    outcomes: [
      "Développer une méthode de travail efficace",
      "Renforcer l'autonomie",
      "Améliorer les capacités d'organisation",
      "Développer des stratégies de mémorisation",
      "Mieux gérer le stress scolaire",
      "Restaurer la confiance dans les apprentissages",
    ],
    approach:
      "Chaque élève possède un fonctionnement qui lui est propre. L'accompagnement s'appuie sur les connaissances actuelles en neurosciences cognitives et en sciences de l'éducation afin de proposer des stratégies individualisées favorisant des apprentissages durables.",
  },
  lycee: {
    title: "Lycée",
    subtitle: "Consolider sa méthode pour gagner en efficacité et en sérénité",
    intro: [
      "Le lycée marque une montée nette des exigences : volumes de travail plus importants, évaluations plus sélectives, autonomie renforcée et, pour beaucoup, préparation progressive du baccalauréat et de l'orientation.",
      "Lorsque la méthode de travail n'est plus adaptée, les difficultés peuvent s'installer rapidement : surcharge, perte d'efficacité, stress, baisse de motivation ou sentiment de ne plus y arriver malgré les efforts fournis.",
      "L'accompagnement vise à construire une méthodologie solide, adaptée au fonctionnement de l'élève et aux attentes du lycée, afin de favoriser des progrès durables et une plus grande confiance.",
    ],
    situationsTitle: "Situations fréquemment rencontrées",
    situations: [
      "Difficultés d'organisation",
      "Manque de méthode",
      "Charge de travail importante",
      "Difficultés de mémorisation",
      "Gestion de l'attention",
      "Procrastination",
      "Préparation du baccalauréat",
      "Stress scolaire",
      "Orientation et Parcoursup",
      "Perte de confiance",
    ],
    outcomesTitle: "L'accompagnement peut permettre de",
    outcomes: [
      "Structurer son organisation au lycée",
      "Développer des stratégies d'apprentissage efficaces",
      "Optimiser la mémorisation",
      "Mieux gérer le stress et la charge mentale",
      "Préparer plus sereinement le baccalauréat",
      "Renforcer l'autonomie",
      "Retrouver confiance dans ses capacités",
    ],
    approach:
      "Chaque lycéen possède un fonctionnement cognitif, attentionnel et émotionnel qui lui est propre. L'accompagnement s'appuie sur les connaissances scientifiques actuelles afin de proposer des stratégies individualisées, concrètes et directement applicables au quotidien scolaire.",
  },
  "etudes-superieures": {
    title: "Études supérieures",
    subtitle: "Optimiser ses stratégies d'apprentissage pour répondre aux exigences du supérieur",
    intro: [
      "Les études supérieures nécessitent un niveau élevé d'autonomie, d'organisation et de capacités d'adaptation. Les volumes de travail augmentent, les méthodes évoluent et les attentes académiques deviennent plus exigeantes.",
      "Lorsque les stratégies d'apprentissage ne sont plus adaptées, les difficultés peuvent rapidement s'installer : surcharge cognitive, procrastination, perte d'efficacité, stress ou épuisement.",
      "L'accompagnement vise à développer une méthodologie adaptée aux exigences de l'enseignement supérieur tout en tenant compte du fonctionnement cognitif propre à chaque étudiant.",
    ],
    situationsTitle: "Situations fréquemment rencontrées",
    situations: [
      "Difficultés d'organisation",
      "Charge de travail importante",
      "Procrastination",
      "Difficultés de mémorisation",
      "Préparation des examens",
      "Gestion du stress",
      "Fatigue cognitive",
      "Difficultés attentionnelles",
      "Préparation des concours",
      "Rédaction de mémoires et travaux universitaires",
    ],
    outcomesTitle: "L'accompagnement peut permettre de",
    outcomes: [
      "Structurer son travail universitaire",
      "Développer des stratégies d'apprentissage performantes",
      "Optimiser la mémorisation",
      "Préparer efficacement les examens et concours",
      "Mieux gérer la charge mentale",
      "Renforcer l'autonomie",
      "Prévenir l'épuisement académique",
    ],
    approach:
      "Mon accompagnement s'appuie sur les connaissances scientifiques actuelles afin de proposer des stratégies directement applicables aux exigences des études supérieures. L'objectif n'est pas d'augmenter le temps de travail, mais d'améliorer durablement l'efficacité des apprentissages grâce à une approche individualisée.",
  },
  tdah: {
    title: "TDAH",
    subtitle: "Comprendre le fonctionnement attentionnel pour construire des stratégies adaptées",
    intro: [
      "Le trouble déficitaire de l'attention avec ou sans hyperactivité (TDAH) influence les fonctions exécutives, notamment l'attention, l'inhibition, la planification, l'organisation et la mémoire de travail.",
      "Ces difficultés peuvent avoir un impact important sur les apprentissages, l'autonomie, les relations sociales, la gestion émotionnelle ou encore la confiance en soi.",
      "L'accompagnement ne vise pas à modifier le fonctionnement de la personne, mais à mieux le comprendre afin de mettre en place des stratégies concrètes, adaptées à son quotidien scolaire, universitaire ou professionnel.",
    ],
    situationsTitle: "Les accompagnements concernent notamment",
    situations: [
      "Difficultés attentionnelles",
      "Impulsivité",
      "Hyperactivité",
      "Organisation du travail",
      "Gestion du temps",
      "Procrastination",
      "Régulation émotionnelle",
      "Fatigabilité cognitive",
      "Préparation des examens",
      "Développement de l'autonomie",
    ],
    outcomesTitle: "L'accompagnement peut permettre de",
    outcomes: [
      "Développer des stratégies de compensation",
      "Structurer l'organisation quotidienne",
      "Renforcer les fonctions exécutives",
      "Optimiser les méthodes de travail",
      "Améliorer la régulation émotionnelle",
      "Favoriser l'autonomie",
      "Restaurer la confiance dans les apprentissages",
    ],
    approach:
      "Chaque accompagnement repose sur une analyse individualisée du fonctionnement cognitif, attentionnel et émotionnel. Les stratégies proposées s'appuient sur les connaissances scientifiques actuelles afin d'être directement applicables dans le quotidien.",
  },
  "troubles-dys": {
    title: "Troubles DYS",
    subtitle: "Adapter les stratégies d'apprentissage aux particularités cognitives",
    intro: [
      "Les troubles DYS regroupent différents troubles neurodéveloppementaux pouvant affecter la lecture, l'écriture, le langage, le raisonnement mathématique, l'attention ou encore la coordination.",
      "Au-delà des difficultés observées, chaque profil présente des ressources sur lesquelles il est possible de s'appuyer afin de développer des stratégies d'apprentissage efficaces.",
      "L'objectif de l'accompagnement est d'identifier les adaptations les plus pertinentes pour favoriser les apprentissages, l'autonomie et la confiance.",
    ],
    situationsTitle: "Les accompagnements concernent notamment",
    situations: [
      "Dyslexie",
      "Dysorthographie",
      "Dyscalculie",
      "Dysgraphie",
      "Dyspraxie",
      "Difficultés méthodologiques",
      "Organisation",
      "Fatigue cognitive",
      "Préparation des examens",
      "Adaptation des méthodes de travail",
    ],
    outcomesTitle: "L'accompagnement peut permettre de",
    outcomes: [
      "Construire des stratégies compensatoires",
      "Développer une méthodologie adaptée",
      "Optimiser les apprentissages",
      "Renforcer l'autonomie",
      "Valoriser les points d'appui",
      "Préparer les examens dans de meilleures conditions",
    ],
    approach:
      "Chaque trouble DYS s'exprime différemment. L'accompagnement est construit autour du profil cognitif de la personne afin de proposer des stratégies individualisées répondant aux besoins rencontrés dans les situations du quotidien.",
  },
  tsa: {
    title: "TSA",
    subtitle: "Comprendre les particularités du fonctionnement autistique pour individualiser l'accompagnement",
    intro: [
      "Le trouble du spectre de l'autisme (TSA) se caractérise par un fonctionnement neurodéveloppemental spécifique pouvant influencer la communication, les interactions sociales, la flexibilité cognitive, les fonctions exécutives ou encore le traitement des informations sensorielles.",
      "Chaque personne présente un profil unique. L'accompagnement vise à comprendre ce fonctionnement afin de proposer des stratégies respectueuses des besoins, des compétences et du rythme de chacun.",
    ],
    situationsTitle: "Les accompagnements concernent notamment",
    situations: [
      "Difficultés scolaires",
      "Organisation",
      "Fonctions exécutives",
      "Habiletés sociales",
      "Gestion des émotions",
      "Transitions",
      "Adaptation scolaire",
      "Orientation",
      "Guidance parentale",
      "Développement de l'autonomie",
    ],
    outcomesTitle: "L'accompagnement peut permettre de",
    outcomes: [
      "Développer des stratégies adaptées",
      "Renforcer les compétences d'autonomie",
      "Faciliter les apprentissages",
      "Accompagner les transitions scolaires",
      "Soutenir les familles",
      "Favoriser un environnement facilitateur",
    ],
    approach:
      "L'accompagnement repose sur une compréhension fine du fonctionnement de la personne. Les recommandations proposées sont individualisées, scientifiquement fondées et construites en lien avec les besoins exprimés par la personne et sa famille.",
  },
  "haut-potentiel": {
    title: "Haut potentiel intellectuel (HPI)",
    subtitle: "Comprendre un fonctionnement cognitif singulier pour mieux accompagner les apprentissages",
    intro: [
      "Le haut potentiel intellectuel ne constitue ni une difficulté ni une garantie de réussite scolaire. Il correspond à un fonctionnement cognitif particulier pouvant s'accompagner d'une grande rapidité de traitement de l'information, d'une pensée en arborescence, d'une forte curiosité intellectuelle ou encore d'une sensibilité importante.",
      "Selon les situations, ce fonctionnement peut également entraîner des difficultés d'organisation, une perte de motivation, un perfectionnisme excessif ou un décalage avec les attentes scolaires.",
      "L'accompagnement vise à mieux comprendre ce fonctionnement afin de construire des stratégies favorisant l'épanouissement, l'autonomie et la réussite.",
    ],
    situationsTitle: "Les accompagnements concernent notamment",
    situations: [
      "Ennui scolaire",
      "Sous-performance",
      "Perfectionnisme",
      "Difficultés d'organisation",
      "Gestion émotionnelle",
      "Motivation",
      "Orientation",
      "Méthodologie",
      "Double exceptionnalité",
      "Confiance en soi",
    ],
    outcomesTitle: "L'accompagnement peut permettre de",
    outcomes: [
      "Mieux comprendre son fonctionnement",
      "Développer une méthodologie adaptée",
      "Prévenir le décrochage scolaire",
      "Renforcer la confiance en soi",
      "Développer les fonctions exécutives",
      "Favoriser un équilibre durable",
    ],
    approach:
      "Le haut potentiel s'exprime de manière très différente d'une personne à l'autre. L'accompagnement repose sur une compréhension individualisée du fonctionnement cognitif, émotionnel et motivationnel afin de construire des stratégies réellement adaptées.",
  },
};

export const CREDIBILITY_ITEMS: string[] = [
  "Professeure certifiée de l'Éducation nationale (CAPES)",
  "Deux Masters universitaires, dont un obtenu avec la mention Très Bien",
  "Psychopédagogue certifiée en neuroéducation",
  "Plus de dix ans d'expérience dans l'accompagnement des enfants, adolescents, étudiants et adultes",
  "Spécialisée dans les troubles du neurodéveloppement, les apprentissages et les fonctions exécutives",
];
