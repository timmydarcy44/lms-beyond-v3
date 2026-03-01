export type CompetenceData = {
  slug: string;
  name: string;
  available: boolean;
  category: string;
  identityLine: string;
  difficulty?: "Débutant" | "Intermédiaire" | "Avancé";
  featured?: boolean;
  coverImage?: string;
  coverGradient?: string;
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
  };
  actions: string[];
  proof: {
    type: string;
    context: string;
    criteria: string[];
    manifesto: string;
  };
  flow: { title: string; copy: string }[];
  trainings: { title: string; duration: string; format: string }[];
  badge: {
    title: string;
    description: string;
    usage: string[];
    showcase: { label: string; detail: string }[];
  };
  stories: { headline: string; copy: string }[];
  meta: {
    shortDescription: string;
    proofType: string;
    duration: string;
    format: string;
  };
};

const COMMON_TRAININGS = {
  storytelling: { title: "Storytelling de preuve", duration: "1h15", format: "Masterclass + atelier" },
};

export const competencies: CompetenceData[] = [
  {
    slug: "negociation",
    name: "Maîtriser une négociation complexe",
    available: true,
    category: "Business",
    identityLine: "Tu transformes un rapport de force en accord signé.",
    difficulty: "Intermédiaire",
    featured: true,
    coverGradient:
      "radial-gradient(circle at 20% 20%, rgba(255,94,58,0.35), transparent 55%), linear-gradient(135deg, rgba(16,14,32,0.95), rgba(62,28,92,0.85))",
    hero: {
      eyebrow: "Compétence à prouver",
      title: "Prouver la compétence :",
      highlight: "Négociation",
      description: "Tu fais émerger des accords exigeants, assumés, chiffrés. Pas de promesses creuses.",
    },
    actions: [
      "Diagnostiquer les enjeux, intérêts et BATNA d’un dossier réel",
      "Élaborer une stratégie de négociation et des scénarios de concessions",
      "Conduire une ou plusieurs séances de négociation avec un interlocuteur réel",
      "Formaliser l’accord, mesurer son impact business et préparer le suivi",
    ],
    proof: {
      type: "Dossier de négociation",
      context: "Renégociation fournisseur, partenariat stratégique, négociation salariale",
      criteria: [
        "Analyse structurée des parties prenantes et leviers",
        "Plan de négociation argumenté et assumé",
        "Résultat obtenu et impacts chiffrés",
        "Plan d’exécution et leçons apprises",
      ],
      manifesto:
        "Tu relies données, intuition et courage. Pas de posture : une preuve concrète que tu sais faire aboutir une négociation.",
    },
    flow: [
      { title: "Tu prépares", copy: "Analyse du contexte, identification des leviers, plan de négociation détaillé." },
      { title: "Tu négocies", copy: "Conduite des échanges, gestion des tensions, prise de décision." },
      { title: "Tu prouves", copy: "Accord signé, ROI mesuré, plan de suivi partagé." },
    ],
    trainings: [
      { title: "Stratégies de négociation avancées", duration: "2h", format: "Masterclass & cas pratiques" },
      { title: "Atelier simulation à froid", duration: "1h45", format: "Workshop terrain" },
      COMMON_TRAININGS.storytelling,
    ],
    badge: {
      title: "Négociation",
      description: "Accords concrets, mesurés, assumés.",
      usage: [
        "Négociation salariale",
        "Renégociation fournisseur",
        "Closing de partenariat",
        "Argumentaire investisseur",
      ],
      showcase: [
        { label: "Plan de négo", detail: "Analyse, tactiques, scénarios." },
        { label: "Accord signé", detail: "Conditions négociées et engagements mutuels." },
        { label: "Impact business", detail: "ROI, métriques clés, risques." },
        { label: "Plan de suivi", detail: "Livrables, KPI, next steps." },
      ],
    },
    stories: [
      { headline: "Budget sauvé", copy: "-18 % sur un contrat stratégique, satisfaction fournisseur intacte." },
      { headline: "Promotion validée", copy: "Package salarial revalorisé de 12 % en 4 semaines." },
      { headline: "Deal sécurisé", copy: "Partenariat signé, objectifs communs clarifiés." },
    ],
    meta: {
      shortDescription: "Préparer, négocier, prouver l’impact d’un accord.",
      proofType: "Dossier de négociation + plan de suivi",
      duration: "4 à 6 semaines",
      format: "Parcours terrain & coaching",
    },
  },
  {
    slug: "marketing-digital",
    name: "Piloter une campagne digitale performante",
    available: true,
    category: "Marketing",
    identityLine: "Tu transformes une idée en campagne rentable et traçable.",
    difficulty: "Intermédiaire",
    featured: true,
    coverGradient:
      "radial-gradient(circle at 70% 15%, rgba(233,92,160,0.35), transparent 55%), linear-gradient(135deg, rgba(19,20,41,0.95), rgba(84,62,191,0.85))",
    hero: {
      eyebrow: "Compétence à prouver",
      title: "Prouver la compétence :",
      highlight: "Marketing digital",
      description: "Tu conçois, lances et optimises une campagne qui livre un impact mesurable.",
    },
    actions: [
      "Cadrer cible, promesse et proposition de valeur",
      "Construire un plan multi-canal cohérent (paid, owned, earned)",
      "Piloter l’exécution, mesurer les KPIs et itérer en temps réel",
      "Présenter un bilan d’impact et un plan d’optimisation crédible",
    ],
    proof: {
      type: "Rapport de campagne",
      context: "Lancement produit, activation de communauté, acquisition B2B/B2C",
      criteria: [
        "Objectifs business chiffrés en amont",
        "Stratégie et calendrier multi-canal",
        "KPIs analysés (CAC, ROAS, engagement, rétention)",
        "Recommandations d’optimisation basées sur les données",
      ],
      manifesto: "Pas de vanity metrics. Des chiffres, des enseignements, un plan pour la suite.",
    },
    flow: [
      { title: "Tu cadres", copy: "Insight, promesse, KPIs, budget et calendrier précis." },
      { title: "Tu exécutes", copy: "Activation multi-canal, tests, pilotage en temps réel." },
      { title: "Tu prouves", copy: "Rapport d’impact, ROI, narratif accessible aux décideurs." },
    ],
    trainings: [
      { title: "Blueprint de campagne full funnel", duration: "2h", format: "Masterclass" },
      { title: "Créativité orientée performance", duration: "1h45", format: "Workshop immersif" },
      COMMON_TRAININGS.storytelling,
    ],
    badge: {
      title: "Marketing digital",
      description: "Campagne réelle, chiffres publiés, plan d’optimisation assumé.",
      usage: [
        "Candidature growth / marketing",
        "Renouvellement de budget",
        "Support commercial agence",
        "Communication investisseur",
      ],
      showcase: [
        { label: "Plan média", detail: "Budget, canaux, promesse, calendrier." },
        { label: "Dashboard ROI", detail: "CAC, ROAS, conversions, LTV." },
        { label: "Assets clés", detail: "Créations et messages testés." },
        { label: "Plan d’optimisation", detail: "Enseignements et suites." },
      ],
    },
    stories: [
      { headline: "Lancement réussi", copy: "+42 % de leads qualifiés et CAC -18 %." },
      { headline: "Funnel optimisé", copy: "Conversion e-commerce +28 %, panier moyen +11 %." },
      { headline: "Communauté activée", copy: "Engagement social x3, base email +18 %." },
    ],
    meta: {
      shortDescription: "Conception, exécution, mesure et récit d’impact marketing.",
      proofType: "Rapport de campagne + dashboard",
      duration: "5 à 7 semaines",
      format: "Parcours terrain & coaching",
    },
  },
  {
    slug: "supply-chain",
    name: "Piloter une supply chain performante",
    available: true,
    category: "Opérations",
    identityLine: "Tu rends un flux visible, fiable et performant.",
    difficulty: "Intermédiaire",
    coverGradient:
      "radial-gradient(circle at 20% 80%, rgba(67,217,173,0.32), transparent 55%), linear-gradient(130deg, rgba(7,12,28,0.95), rgba(43,66,94,0.88))",
    hero: {
      eyebrow: "Compétence à prouver",
      title: "Prouver la compétence :",
      highlight: "Supply chain",
      description: "Tu pilotes une transformation opérationnelle mesurée, terrain et business alignés.",
    },
    actions: [
      "Cartographier un flux existant et identifier les goulets d’étranglement",
      "Co-construire un plan d’amélioration avec les équipes terrain",
      "Piloter l’exécution des chantiers prioritaires",
      "Mesurer les gains (temps, coûts, qualité, sécurité) et documenter les résultats",
    ],
    proof: {
      type: "Audit & plan d’impact opérationnel",
      context: "Chaîne logistique, entrepôt, production ou distribution",
      criteria: [
        "Diagnostic basé sur données + observations terrain",
        "Plan d’action priorisé avec ROI attendu",
        "Résultats mesurés (service, délai, coût, satisfaction)",
        "Plan de pérennisation et gouvernance",
      ],
      manifesto:
        "Pas de kaizen cosmétique. Tu montres comment tu as aligné les équipes et prouvé les gains.",
    },
    flow: [
      { title: "Tu observes", copy: "Immersion terrain, collecte de données, écoute des opérateurs." },
      { title: "Tu pilotes", copy: "Animation multi-équipe, chantiers ciblés, décisions au bon moment." },
      { title: "Tu prouves", copy: "Résultats avant/après, feedback, plan de continuité." },
    ],
    trainings: [
      { title: "Diagnostic opérationnel express", duration: "1h30", format: "Workshop terrain" },
      { title: "Leadership terrain", duration: "1h45", format: "Masterclass & retours d’expérience" },
      COMMON_TRAININGS.storytelling,
    ],
    badge: {
      title: "Supply chain",
      description: "Flux stabilisé, gains réels, équipe alignée.",
      usage: [
        "Candidature opérations / logistique",
        "Argumentaire d’amélioration continue",
        "Reporting projet industriel",
      ],
      showcase: [
        { label: "Carte du flux", detail: "Visualisation des étapes & temps de cycle." },
        { label: "Plan d’action", detail: "Priorités, jalons, responsables." },
        { label: "Résultats mesurés", detail: "Temps, coûts, qualité, satisfaction." },
        { label: "Retour terrain", detail: "Feedbacks & plan de maintien." },
      ],
    },
    stories: [
      { headline: "Entrepôt débloqué", copy: "Temps de préparation -25 %, erreurs divisées par 3." },
      { headline: "Ruptures évitées", copy: "Taux de service passé de 82 % à 96 %." },
      { headline: "Pilotage renforcé", copy: "Cockpit de suivi adopté par toute l’équipe." },
    ],
    meta: {
      shortDescription: "Diagnostic, leadership terrain, preuves opérationnelles.",
      proofType: "Audit + plan d’impact logistique",
      duration: "6 à 8 semaines",
      format: "Parcours terrain & coaching",
    },
  },
  {
    slug: "rse-impact",
    name: "Mesurer un impact RSE réel",
    available: true,
    category: "Transformation",
    identityLine: "Tu transformes une ambition RSE en preuves vérifiables.",
    difficulty: "Intermédiaire",
    coverGradient:
      "radial-gradient(circle at 75% 15%, rgba(98,197,111,0.32), transparent 55%), linear-gradient(135deg, rgba(9,20,18,0.95), rgba(40,95,70,0.85))",
    hero: {
      eyebrow: "Compétence à prouver",
      title: "Prouver la compétence :",
      highlight: "RSE & impact",
      description: "Tu passes de la promesse à l’action mesurée, avec parties prenantes alignées.",
    },
    actions: [
      "Diagnostiquer un enjeu RSE prioritaire avec données et témoignages",
      "Co-construire un plan d’action aligné avec la stratégie business",
      "Piloter l’exécution et embarquer les équipes",
      "Publier un rapport d’impact clair et vérifiable",
    ],
    proof: {
      type: "Plan d’impact documenté",
      context: "Enjeux environnement, social ou gouvernance",
      criteria: [
        "Diagnostic sourcé et aligné",
        "Actions concrètes mises en œuvre",
        "Indicateurs de progrès et preuves terrain",
        "Narratif transparent et plan de continuité",
      ],
      manifesto: "Pas de greenwashing. Des progrès mesurés, des preuves publiées, un plan durable.",
    },
    flow: [
      { title: "Tu mesures", copy: "Collecte des données, attentes des parties prenantes." },
      { title: "Tu actives", copy: "Plan d’action, gouvernance, pilotage hebdo." },
      { title: "Tu prouves", copy: "Rapport d’impact, témoignages, plan de suites." },
    ],
    trainings: [
      { title: "Diagnostic ESG crédible", duration: "1h45", format: "Masterclass" },
      { title: "Mobiliser autour d’un plan RSE", duration: "1h30", format: "Workshop" },
      COMMON_TRAININGS.storytelling,
    ],
    badge: {
      title: "RSE & impact",
      description: "Impact mesuré, parties prenantes engagées, trajectoire suivie.",
      usage: [
        "Rapport extra-financier",
        "Candidature fonds à impact",
        "Transformation interne",
      ],
      showcase: [
        { label: "Diagnostic initial", detail: "Cartographie des impacts et KPIs." },
        { label: "Roadmap RSE", detail: "Objectifs, jalons, gouvernance." },
        { label: "Résultats mesurés", detail: "Indicateurs avant/après, ROI social." },
        { label: "Narratif impact", detail: "Support de communication interne/externe." },
      ],
    },
    stories: [
      { headline: "Décarbonation engagée", copy: "-22 % d’émissions sur la chaîne logistique." },
      { headline: "Collectif fédéré", copy: "80 collaborateurs formés, plan co-construit." },
      { headline: "Visibilité renforcée", copy: "Rapport d’impact validé par un comité externe." },
    ],
    meta: {
      shortDescription: "Mesurer, aligner, prouver une trajectoire RSE.",
      proofType: "Plan d’impact + rapport",
      duration: "6 à 8 semaines",
      format: "Parcours hybride & coaching",
    },
  },
  {
    slug: "communication-politique",
    name: "Structurer une communication publique claire",
    available: true,
    category: "Influence",
    identityLine: "Tu assumes une voix publique et tu mesures son impact.",
    difficulty: "Intermédiaire",
    coverGradient:
      "radial-gradient(circle at 80% 20%, rgba(255,109,58,0.28), transparent 55%), linear-gradient(135deg, rgba(14,17,32,0.95), rgba(83,58,205,0.78))",
    hero: {
      eyebrow: "Compétence à prouver",
      title: "Prouver la compétence :",
      highlight: "Communication politique",
      description: "Tu décodes un environnement, tu prends position, tu mesures ce que ta parole change.",
    },
    actions: [
      "Analyser un écosystème politique et identifier les rapports de force",
      "Construire une ligne, un message et un plan narratif cohérents",
      "Activer médias, réseaux, terrain et parties prenantes",
      "Mesurer retombées et piloter la suite",
    ],
    proof: {
      type: "Dossier de prise de parole",
      context: "Campagne électorale, plaidoyer, communication institutionnelle",
      criteria: [
        "Analyse des enjeux, acteurs, risques",
        "Narration et message différenciants",
        "Activation multicanale démontrée",
        "Mesure des retombées et plan de suivi",
      ],
      manifesto:
        "Tu ne subis pas le débat public : tu le structures, tu l’assumes, tu mesures ce qu’il produit.",
    },
    flow: [
      { title: "Tu analyses", copy: "Contextes, signaux faibles, attentes et risques." },
      { title: "Tu prends position", copy: "Message, formats, plan média, porte-paroles." },
      { title: "Tu mesures", copy: "Retombées, perception, next steps ajustés." },
    ],
    trainings: [
      { title: "Narration politique & rhétorique", duration: "1h45", format: "Masterclass" },
      { title: "Media training sous tension", duration: "1h30", format: "Workshop vidéo" },
      COMMON_TRAININGS.storytelling,
    ],
    badge: {
      title: "Communication politique",
      description: "Prise de parole assumée, retombées mesurées, gouvernance maîtrisée.",
      usage: [
        "Campagne électorale ou citoyenne",
        "Plaidoyer associatif",
        "Communication de crise publique",
      ],
      showcase: [
        { label: "Note stratégique", detail: "Analyse des enjeux & scénarios." },
        { label: "Discours / tribune", detail: "Narration, éléments de langage, preuves." },
        { label: "Plan média & communauté", detail: "Canaux activés, planning, budget." },
        { label: "Bilan d’impact", detail: "Retombées, feedbacks, suites." },
      ],
    },
    stories: [
      { headline: "Campagne alignée", copy: "Narratif clarifié, base militante engagée x2." },
      { headline: "Crise maîtrisée", copy: "Plan media 48h, confiance restaurée." },
      { headline: "Plaidoyer gagnant", copy: "Mobilisation citoyenne, vote favorable obtenu." },
    ],
    meta: {
      shortDescription: "Analyse, prise de parole, preuve d’impact public.",
      proofType: "Dossier stratégique + plan média",
      duration: "5 à 7 semaines",
      format: "Parcours hybride & coaching",
    },
  },
  {
    slug: "analyse-donnees-decisionnelle",
    name: "Analyser des données décisionnelles",
    available: true,
    category: "Data & Produit",
    identityLine: "Tu fais parler les données et tu fais bouger une décision réelle.",
    difficulty: "Intermédiaire",
    featured: true,
    coverGradient:
      "radial-gradient(circle at 25% 25%, rgba(122,170,255,0.4), transparent 55%), linear-gradient(145deg, rgba(14,21,45,0.95), rgba(34,46,94,0.85))",
    hero: {
      eyebrow: "Compétence à prouver",
      title: "Prouver la compétence :",
      highlight: "Analyse de données décisionnelle",
      description: "Tu nettoies, synthétises et rends actionnable un jeu de données pour un décideur.",
    },
    actions: [
      "Structurer une problématique métier et définir les bonnes métriques",
      "Collecter, nettoyer et enrichir un jeu de données",
      "Construire un dashboard ou une note de décision claire",
      "Présenter une recommandation et suivre son impact",
    ],
    proof: {
      type: "Dashboard & note de décision",
      context: "Produit digital, marketing, finance, RH ou opérations",
      criteria: [
        "Qualité des données et transparence méthodo",
        "Insights hiérarchisés et lisibles",
        "Recommandations concrètes et chiffrées",
        "Décision prise ou testée avec suivi",
      ],
      manifesto:
        "Pas de data theatre. Tu montres comment tes analyses déclenchent une décision tangible.",
    },
    flow: [
      { title: "Tu explores", copy: "Collecte, nettoyage, gouvernance des données." },
      { title: "Tu analyses", copy: "Visualisations, patterns, scénarios." },
      { title: "Tu influences", copy: "Note stratégique, atelier de restitution, suivi des résultats." },
    ],
    trainings: [
      { title: "Data storytelling & visualisation", duration: "1h30", format: "Masterclass" },
      { title: "Atelier dashboard orienté décision", duration: "1h45", format: "Workshop pratique" },
      COMMON_TRAININGS.storytelling,
    ],
    badge: {
      title: "Analyse de données décisionnelle",
      description: "Des données propres, une décision assumée, un impact suivi.",
      usage: [
        "Candidature data / product",
        "Comité de direction",
        "Mission de conseil",
      ],
      showcase: [
        { label: "Checklist data", detail: "Sources, nettoyage, qualité." },
        { label: "Dashboard clé", detail: "Visualisations orientées décision." },
        { label: "Note stratégique", detail: "Synthèse, recommandations, ROI." },
        { label: "Plan de suivi", detail: "Indicateurs, échéances, ownership." },
      ],
    },
    stories: [
      { headline: "Produit réaligné", copy: "KPI éclaircis, backlog priorisé différemment." },
      { headline: "Sales boost", copy: "Dashboard déployé, marge +6 points." },
      { headline: "RH éclairées", copy: "Politique salariale ajustée, attrition réduite de 15 %." },
    ],
    meta: {
      shortDescription: "Data propre, insights clairs, décision mesurée.",
      proofType: "Dashboard + note décisionnelle",
      duration: "4 à 6 semaines",
      format: "Parcours data & coaching",
    },
  },
  {
    slug: "marketing-sportif",
    name: "Structurer un marketing sportif mesurable",
    available: false,
    category: "Marketing & Sport",
    identityLine: "Tu actives une communauté sportive et tu le prouves chiffres à l’appui.",
    difficulty: "Intermédiaire",
    coverGradient:
      "radial-gradient(circle at 80% 20%, rgba(255,177,73,0.32), transparent 55%), linear-gradient(135deg, rgba(12,18,28,0.95), rgba(78,58,32,0.8))",
    hero: {
      eyebrow: "Bientôt disponible",
      title: "Prépare-toi pour :",
      highlight: "Marketing sportif",
      description: "Activation terrain + digital, fans engagés, sponsors servis.",
    },
    actions: [
      "Diagnostiquer attentes fans, partenaires et club",
      "Concevoir une activation terrain + digital cohérente",
      "Coordonner athlètes, partenaires, médias",
      "Mesurer l’engagement et les retombées business",
    ],
    proof: {
      type: "Activation sportive documentée",
      context: "Club, événement, athlète ou ligue",
      criteria: [
        "Objectifs d’engagement/CA définis en amont",
        "Dispositif d’activation détaillé",
        "KPIs fans, CRM, billetterie ou merchandising",
        "Plan de suites pour partenaires et supporters",
      ],
      manifesto: "Pas de hype. Des fans présents, des sponsors satisfaits, un impact vérifiable.",
    },
    flow: [
      { title: "Tu analyses", copy: "Fan base, sponsors, histoire du club." },
      { title: "Tu actives", copy: "Expérience terrain, social, contenu média." },
      { title: "Tu prouves", copy: "Engagement mesuré, revenus suivis, suites prévues." },
    ],
    trainings: [],
    badge: {
      title: "Marketing sportif",
      description: "Activation réussie, communauté engagée, partenaires servis.",
      usage: ["Clubs et fédérations", "Athlètes & agents", "Agences événementielles"],
      showcase: [],
    },
    stories: [],
    meta: {
      shortDescription: "Activer une fan base, satisfaire sponsors, mesurer l’engagement.",
      proofType: "Activation terrain + reporting",
      duration: "À confirmer",
      format: "Parcours terrain",
    },
  },
  {
    slug: "etude-comportementale",
    name: "Analyser des comportements terrain",
    available: false,
    category: "Recherche & UX",
    identityLine: "Tu observes le réel, tu en tires des décisions qui tiennent sur le terrain.",
    difficulty: "Intermédiaire",
    coverGradient:
      "radial-gradient(circle at 30% 70%, rgba(122,195,255,0.28), transparent 55%), linear-gradient(135deg, rgba(12,19,35,0.95), rgba(32,46,71,0.85))",
    hero: {
      eyebrow: "Bientôt disponible",
      title: "Prépare-toi pour :",
      highlight: "Étude comportementale",
      description: "Observation terrain, insights actionnables, recommandations testées.",
    },
    actions: [
      "Définir une problématique comportementale claire",
      "Mener observations, interviews, collecte de signaux",
      "Modéliser comportements et freins",
      "Tester recommandations et mesurer l’effet",
    ],
    proof: {
      type: "Rapport comportemental",
      context: "Produit, service public, RH, expérience client",
      criteria: [
        "Méthodologie transparente et éthique",
        "Données qualitatives & quantitatives croisées",
        "Insights priorisés et actionnables",
        "Recommandations testées ou prototypées",
      ],
      manifesto: "Pas de persona fictif. Des humains, des preuves, des décisions responsables.",
    },
    flow: [
      { title: "Tu observes", copy: "Immersion terrain, écoute active, data réelle." },
      { title: "Tu analyses", copy: "Synthèse, modèles comportementaux, priorités." },
      { title: "Tu valides", copy: "Expérimentations, mesure, recommandations défendues." },
    ],
    trainings: [],
    badge: {
      title: "Étude comportementale",
      description: "Insights humains prouvés, recommandations testées.",
      usage: ["UX & produit", "Politiques publiques", "RH & QVT", "Marketing stratégique"],
      showcase: [],
    },
    stories: [],
    meta: {
      shortDescription: "Observation terrain, analyse rigoureuse, tests vérifiés.",
      proofType: "Rapport + expérimentation",
      duration: "À confirmer",
      format: "Parcours terrain",
    },
  },
  {
    slug: "veille-strategique",
    name: "Mener une veille stratégique",
    available: false,
    category: "Business Intelligence",
    identityLine: "Tu détectes les signaux avant les autres et tu déclenches l’action.",
    difficulty: "Intermédiaire",
    coverGradient:
      "radial-gradient(circle at 65% 15%, rgba(162,206,255,0.30), transparent 55%), linear-gradient(135deg, rgba(10,16,32,0.95), rgba(45,68,108,0.82))",
    hero: {
      eyebrow: "Bientôt disponible",
      title: "Prépare-toi pour :",
      highlight: "Veille stratégique",
      description: "Système de veille, alertes pertinentes, décision accélérée.",
    },
    actions: [
      "Définir un périmètre de veille et les questions critiques",
      "Mettre en place un système de collecte multi-sources",
      "Qualifier les signaux et recommander des actions",
      "Informer les décideurs et mesurer la réaction",
    ],
    proof: {
      type: "Rapport de veille + alerte",
      context: "Innovation, concurrence, réglementation, tendances",
      criteria: [
        "Sources fiables et diversifiées",
        "Analyse claire et priorisée",
        "Recommandations datées et actionnables",
        "Trace de la décision ou du pivot déclenché",
      ],
      manifesto: "Tu n’empiles pas des liens : tu crées un avantage temporel mesurable.",
    },
    flow: [
      { title: "Tu observes", copy: "Collecte continue, cadrage des sources." },
      { title: "Tu analyses", copy: "Lecture business, priorisation, scénarios." },
      { title: "Tu déclenches", copy: "Note d’alerte, décision, suivi d’impact." },
    ],
    trainings: [],
    badge: {
      title: "Veille stratégique",
      description: "Alertes pertinentes, décisions accélérées.",
      usage: ["Directions générales", "Comités innovation", "Consultants en stratégie"],
      showcase: [],
    },
    stories: [],
    meta: {
      shortDescription: "Détection, alerte, décision mesurée.",
      proofType: "Rapport + plan d’action",
      duration: "À confirmer",
      format: "Parcours hybride",
    },
  },
  {
    slug: "communication-crise",
    name: "Assumer une communication de crise",
    available: false,
    category: "Influence",
    identityLine: "Tu prends la parole quand tout brûle et tu ramènes la confiance.",
    difficulty: "Avancé",
    coverGradient:
      "radial-gradient(circle at 75% 25%, rgba(255,118,118,0.32), transparent 55%), linear-gradient(135deg, rgba(18,18,28,0.95), rgba(88,32,32,0.82))",
    hero: {
      eyebrow: "Bientôt disponible",
      title: "Prépare-toi pour :",
      highlight: "Communication de crise",
      description: "Diagnostic, cellule de crise, messages publics et preuves de réparation.",
    },
    actions: [
      "Cartographier faits, risques et parties prenantes",
      "Construire un plan de réponse multi-voix",
      "Porter une prise de parole transparente et ferme",
      "Suivre retombées, corriger, rassurer durablement",
    ],
    proof: {
      type: "Plan de crise documenté",
      context: "Incident produit, bad buzz, crise sociale ou politique",
      criteria: [
        "Diagnostic rapide et complet",
        "Messages et canaux alignés",
        "Indicateurs de confiance avant/après",
        "Plan d’amélioration et engagements tenus",
      ],
      manifesto: "Pas de langue de bois. Des faits, une parole assumée, des preuves de réparation.",
    },
    flow: [
      { title: "Tu contiens", copy: "Cellule de crise, faits, scénarios." },
      { title: "Tu parles", copy: "Messages clairs, ton juste, empathie et fermeté." },
      { title: "Tu répares", copy: "Suivi médiatique, communauté, engagements tenus." },
    ],
    trainings: [],
    badge: {
      title: "Communication de crise",
      description: "Crise gérée, confiance regagnée, preuves publiées.",
      usage: ["DirCom", "Organisations publiques", "Startups en hypercroissance"],
      showcase: [],
    },
    stories: [],
    meta: {
      shortDescription: "Préparation, parole, réparation avec preuves.",
      proofType: "Plan de crise + indicateurs",
      duration: "À confirmer",
      format: "Parcours intensif",
    },
  },
  {
    slug: "gestion-projet-complexe",
    name: "Piloter un projet complexe",
    available: true,
    category: "Leadership & Delivery",
    identityLine: "Tu coordonnes plusieurs équipes et tu livres sans excuses.",
    difficulty: "Avancé",
    coverGradient:
      "radial-gradient(circle at 20% 25%, rgba(118,154,255,0.32), transparent 55%), linear-gradient(135deg, rgba(14,16,32,0.95), rgba(44,61,118,0.85))",
    hero: {
      eyebrow: "Compétence à prouver",
      title: "Prouver la compétence :",
      highlight: "Gestion de projet complexe",
      description: "Tu prends un programme multi-acteurs et tu le rends livrable, mesuré, assumé.",
    },
    actions: [
      "Cartographier parties prenantes, dépendances, risques et objectifs",
      "Construire une roadmap réaliste et argumentée",
      "Piloter la coopération, arbitrer et résoudre les blocages",
      "Mesurer la valeur livrée et capitaliser pour la suite",
    ],
    proof: {
      type: "Dossier de pilotage projet",
      context: "Transformation, produit digital, industriel ou public",
      criteria: [
        "Gouvernance claire et alignée",
        "Roadmap exécutée avec arbitrages documentés",
        "Valeur livrée et écarts expliqués",
        "Feedback sponsor + plan de continuité",
      ],
      manifesto: "Pas de Gantt décoratif : des jalons tenus, des écarts assumés, un sponsor satisfait.",
    },
    flow: [
      { title: "Tu structures", copy: "Vision, jalons, responsabilités, risques." },
      { title: "Tu pilotes", copy: "Synchronisation, décisions rapides, arbitrages." },
      { title: "Tu livres", copy: "Valeur mesurée, preuves partagées, capitalisation." },
    ],
    trainings: [
      { title: "Roadmap réaliste", duration: "1h45", format: "Workshop" },
      { title: "Résolution de blocages multi-équipes", duration: "1h30", format: "Simulation" },
      COMMON_TRAININGS.storytelling,
    ],
    badge: {
      title: "Gestion de projet complexe",
      description: "Programme livré, équipes alignées, sponsor convaincu.",
      usage: [
        "Promotion interne PMO / direction projet",
        "Dossier freelance senior",
        "Reporting transformation",
      ],
      showcase: [
        { label: "Roadmap & gouvernance", detail: "Vision, jalons, ownership." },
        { label: "Logbook décisions", detail: "Arbitrages, risques, mitigation." },
        { label: "Valeur livrée", detail: "Résultats chiffrés & feedback sponsor." },
        { label: "Plan de continuité", detail: "Capitalisation, passation, suites." },
      ],
    },
    stories: [
      { headline: "Programme digital livré", copy: "Plateforme lancée, adoption utilisateur > 80 %." },
      { headline: "Transformation industrielle maîtrisée", copy: "Jalons tenus, budget respecté." },
      { headline: "Mission publique réussie", copy: "Parties prenantes alignées, audit favorable." },
    ],
    meta: {
      shortDescription: "Pilotage, arbitrage et preuves de livraison multi-équipes.",
      proofType: "Dossier de pilotage + feedback sponsor",
      duration: "8 à 10 semaines",
      format: "Parcours hybride & coaching",
    },
  },
];

export type ProofResult = {
  id: string;
  title: string;
  description: string;
  competenceSlugs: string[];
};

export const proofResults: ProofResult[] = [
  {
    id: "marketing-sportif",
    title: "Être reconnu comme expert en marketing sportif",
    description:
      "Tu pilotes une stratégie marketing dans l’univers du sport, avec des résultats mesurables et opposables.",
    competenceSlugs: ["marketing-sportif", "marketing-digital"],
  },
  {
    id: "negociation-complexe",
    title: "Être crédible en négociation complexe",
    description:
      "Tu obtiens des accords exigeants, alignés, et tu rends visibles les impacts concrets.",
    competenceSlugs: ["negociation", "gestion-projet-complexe"],
  },
  {
    id: "data-driven",
    title: "Être identifié comme décideur data-driven",
    description:
      "Tu transformes les données en décisions claires, assumées et reconnues publiquement.",
    competenceSlugs: ["analyse-donnees-decisionnelle", "supply-chain"],
  },
  {
    id: "communication-crise",
    title: "Être légitime en communication de crise",
    description:
      "Tu tiens la parole sous pression, avec une stratégie claire et des preuves de réparation.",
    competenceSlugs: ["communication-crise", "communication-politique"],
  },
  {
    id: "impact-rse",
    title: "Être reconnu pour son impact RSE",
    description:
      "Tu rends visible un impact réel, mesuré, soutenu par des preuves transparentes.",
    competenceSlugs: ["rse-impact", "analyse-donnees-decisionnelle"],
  },
  {
    id: "supply-chain",
    title: "Être capable de piloter une supply chain performante",
    description:
      "Tu stabilises un flux, tu prouves les gains, et tu assumes les décisions prises.",
    competenceSlugs: ["supply-chain", "gestion-projet-complexe"],
  },
];

export function getCompetenceBySlug(slug: string | undefined): CompetenceData | null {
  if (!slug) return null;
  return competencies.find((competence) => competence.slug === slug) ?? null;
}

