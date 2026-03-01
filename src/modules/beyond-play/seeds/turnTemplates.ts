import { ChoiceDecision, SliderDecision } from "../game-state/types";

export type FixedContext = {
  seasonRecap?: string;
  lastWeekHook: string;
  tone: string;
};

export type ForcedEvent = {
  type:
    | "MATCH_RESULT_NEWS"
    | "SOCIAL_BACKLASH"
    | "SPONSOR_COMPLAINT"
    | "HOSPITALITY_INCIDENT"
    | "GOOD_NEWS";
  severity: 1 | 2 | 3;
  seed: string;
};

export type RequiredSceneSeed = {
  type: "BRIEFING" | "INTERNAL_MEETING" | "NEGOTIATION" | "MEDIA";
  seed: string;
};

export type PartnerSeed = {
  partnerId: string;
  partnerName: string;
  profile: "DEMANDING" | "OPPORTUNIST" | "EMOTIONAL" | "LOYAL";
  topic:
    | "LED"
    | "GIANT_SCREEN"
    | "HOSPITALITY"
    | "DIGITAL"
    | "JERSEY_SPONSOR";
};

export interface TurnTemplate {
  turnNumber: number;
  title: string;
  learningGoal: string;
  fixedContext: FixedContext;
  n1Baselines: Record<string, unknown>;
  forcedEvents: ForcedEvent[];
  requiredDecisions: {
    sliders: Array<
      SliderDecision & { recommendedRange?: { min: number; max: number } }
    >;
    choices: Array<
      ChoiceDecision & {
        options: Array<ChoiceDecision["options"][number] & { hint?: string }>;
      }
    >;
  };
  requiredScenes: RequiredSceneSeed[];
  partnerSeeds: PartnerSeed[];
}

export const turnTemplates: TurnTemplate[] = [
  {
    turnNumber: 1,
    title: "Fonder l'identité et le modèle économique du club",
    learningGoal:
      "Comprendre les arbitrages entre identité de marque, attentes des supporters et contraintes économiques (merchandising & billetterie).",
    fixedContext: {
      seasonRecap: "La nouvelle saison débute, Beyond FC sort d’un exercice moyen.",
      lastWeekHook:
        "Conférence de presse imminente pour dévoiler maillot, politique prix et ambitions économiques.",
      tone: "stimulant mais sous pression",
    },
    n1Baselines: {
      jerseyPriceHT: 40,
      ticketPrices: {
        virage: 15,
        centrale: 35,
        vip: 120,
      },
      avgAttendanceRate: 0.62,
      jerseyUnitsSold: 6000,
    },
    forcedEvents: [
      {
        type: "GOOD_NEWS",
        severity: 1,
        seed: "Lancement officiel de la saison et reveal du maillot programmés ce soir.",
      },
    ],
    requiredDecisions: {
      sliders: [
        {
          id: "S_JERSEY_PRODUCTION_VOLUME",
          label: "Quantité totale de maillots à produire",
          metric: "custom",
          unit: "unités",
          min: 2000,
          max: 20000,
          step: 500,
          defaultValue: 8000,
          recommendedRange: { min: 6000, max: 12000 },
        },
        {
          id: "S_JERSEY_PRICE_HT",
          label: "Prix de vente du maillot (HT)",
          metric: "custom",
          unit: "€",
          min: 30,
          max: 80,
          step: 1,
          defaultValue: 45,
          recommendedRange: { min: 40, max: 60 },
        },
        {
          id: "S_JERSEY_SIZE_XXS",
          label: "Allocation taille XXS",
          metric: "custom",
          unit: "%",
          min: 0,
          max: 40,
          step: 1,
          defaultValue: 3,
        },
        {
          id: "S_JERSEY_SIZE_XS",
          label: "Allocation taille XS",
          metric: "custom",
          unit: "%",
          min: 0,
          max: 40,
          step: 1,
          defaultValue: 7,
        },
        {
          id: "S_JERSEY_SIZE_S",
          label: "Allocation taille S",
          metric: "custom",
          unit: "%",
          min: 0,
          max: 40,
          step: 1,
          defaultValue: 16,
        },
        {
          id: "S_JERSEY_SIZE_M",
          label: "Allocation taille M",
          metric: "custom",
          unit: "%",
          min: 0,
          max: 40,
          step: 1,
          defaultValue: 26,
        },
        {
          id: "S_JERSEY_SIZE_L",
          label: "Allocation taille L",
          metric: "custom",
          unit: "%",
          min: 0,
          max: 40,
          step: 1,
          defaultValue: 25,
        },
        {
          id: "S_JERSEY_SIZE_XL",
          label: "Allocation taille XL",
          metric: "custom",
          unit: "%",
          min: 0,
          max: 40,
          step: 1,
          defaultValue: 17,
        },
        {
          id: "S_JERSEY_SIZE_XXL",
          label: "Allocation taille XXL",
          metric: "custom",
          unit: "%",
          min: 0,
          max: 40,
          step: 1,
          defaultValue: 6,
        },
        {
          id: "S_TICKET_PRICE_VIRAGE",
          label: "Prix billet – Virage",
          metric: "price_ticket",
          unit: "€",
          min: 10,
          max: 25,
          step: 1,
          defaultValue: 15,
        },
        {
          id: "S_TICKET_PRICE_CENTRALE",
          label: "Prix billet – Tribune centrale",
          metric: "price_ticket",
          unit: "€",
          min: 25,
          max: 60,
          step: 1,
          defaultValue: 35,
        },
        {
          id: "S_VIP_SEAT_PRICE_HT",
          label: "Prix billet – Loges VIP (siège)",
          metric: "price_ticket",
          unit: "€",
          min: 80,
          max: 250,
          step: 1,
          defaultValue: 120,
        },
        {
          id: "S_VIP_BOX_PACK_PRICE_HT",
          label: "Prix d’un pack loge VIP",
          metric: "custom",
          unit: "€",
          min: 10000,
          max: 60000,
          step: 500,
          defaultValue: 35000,
          recommendedRange: { min: 25000, max: 45000 },
        },
        {
          id: "S_VIP_BOXES_SOLD",
          label: "Nombre de loges vendues",
          metric: "custom",
          unit: "loges",
          min: 0,
          max: 32,
          step: 1,
          defaultValue: 12,
        },
      ],
      choices: [
        {
          id: "C_JERSEY_STYLE",
          prompt: "Quel style adoptez-vous pour le nouveau maillot ?",
          options: [
            {
              id: "TRADITIONAL",
              label: "Traditionnel",
              hint: "Respect de l’histoire du club, forte adhésion supporteurs historiques.",
            },
            {
              id: "MODERN",
              label: "Moderne",
              hint: "Image dynamique et actuelle, attractif pour un public plus jeune.",
            },
            {
              id: "PREMIUM",
              label: "Premium",
              hint: "Positionnement haut de gamme, potentiel de marge supérieur.",
            },
            {
              id: "RUPTURE",
              label: "Rupture",
              hint: "Design clivant pouvant créer engouement ou rejet.",
            },
          ],
        },
      ],
    },
    requiredScenes: [
      {
        type: "BRIEFING",
        seed:
          "Réunion direction + marketing : arbitrer identité, volumes de production et grille tarifaire avant reveal public.",
      },
      {
        type: "MEDIA",
        seed:
          "Plateaux TV et réseaux sociaux réagissent au reveal : nécessité de défendre les choix auprès des fans.",
      },
    ],
    partnerSeeds: [],
  },
  {
    turnNumber: 2,
    title: "Commercialisation espaces publicitaires",
    learningGoal:
      "Concevoir une offre hospitalités + visibilité attractive tout en protégeant la valeur du portefeuille sponsors.",
    fixedContext: {
      lastWeekHook:
        "Les partenaires attendent une proposition consolidée pour la saison. La concurrence est agressive sur les packs matchday.",
      tone: "négociation tendue",
    },
    n1Baselines: {
      ads: {
        ledSeason: 20000,
        giantScreenSeason: 10000,
        instagramPost: 3500,
        matchdayPack: 18000,
      },
    },
    forcedEvents: [
      {
        type: "SPONSOR_COMPLAINT",
        severity: 1,
        seed: "Un sponsor demande une cohérence prix vs exposition digitale.",
      },
    ],
    requiredDecisions: {
      sliders: [
        {
          id: "S_LED_PRICE_MATCH_HT",
          label: "Prix LED bord terrain (HT/match)",
          metric: "price_led",
          unit: "€",
          min: 12000,
          max: 32000,
          step: 500,
          defaultValue: 20000,
          recommendedRange: { min: 18000, max: 24000 },
        },
        {
          id: "S_SCREEN_PRICE_MATCH_HT",
          label: "Prix écran géant (HT/match)",
          metric: "price_led",
          unit: "€",
          min: 8000,
          max: 22000,
          step: 500,
          defaultValue: 12000,
          recommendedRange: { min: 10000, max: 16000 },
        },
        {
          id: "S_MATCHDAY_PACK_PRICE_HT",
          label: "Prix pack matchday (loge + activation)",
          metric: "custom",
          unit: "€",
          min: 15000,
          max: 45000,
          step: 1000,
          defaultValue: 24000,
          recommendedRange: { min: 19000, max: 30000 },
        },
        {
          id: "S_IG_POST_PRICE_HT",
          label: "Tarif post Instagram sponsorisé",
          metric: "custom",
          unit: "€",
          min: 2000,
          max: 8000,
          step: 250,
          defaultValue: 3500,
          recommendedRange: { min: 3000, max: 5000 },
        },
        {
          id: "S_IG_STORY_PRICE_HT",
          label: "Tarif story Instagram sponsorisée",
          metric: "custom",
          unit: "€",
          min: 1500,
          max: 6000,
          step: 200,
          defaultValue: 2800,
          recommendedRange: { min: 2200, max: 3500 },
        },
        {
          id: "S_SOCIAL_PACK_PRICE_HT",
          label: "Prix pack réseaux sociaux (bundle)",
          metric: "custom",
          unit: "€",
          min: 4000,
          max: 15000,
          step: 500,
          defaultValue: 7800,
          recommendedRange: { min: 6500, max: 10000 },
        },
      ],
      choices: [
        {
          id: "C_SPONSOR_POSITIONING",
          prompt: "Quel positionnement proposez-vous aux sponsors ?",
          options: [
            {
              id: "A",
              label: "Premium exclusif",
              hint: "Prix élevés, volumes limités",
            },
            {
              id: "B",
              label: "Mix équilibré",
              hint: "Couverture visibilité + digital",
            },
            {
              id: "C",
              label: "Volume agressif",
              hint: "Prix attractifs, objectifs volume",
            },
          ],
        },
      ],
    },
    requiredScenes: [
      {
        type: "BRIEFING",
        seed: "Réunion commerciale : fixer la nouvelle grille hospitalités + digital.",
      },
      {
        type: "MEDIA",
        seed: "Campagne sur les réseaux pour annoncer les nouvelles offres partenaires.",
      },
    ],
    partnerSeeds: [],
  },
  {
    turnNumber: 3,
    title: "Monétisation stade: LED & écran géant",
    learningGoal:
      "Fixer un prix sponsor basé sur la valeur perçue et le contexte (risque de churn).",
    fixedContext: {
      lastWeekHook:
        "Le portefeuille sponsors est stable mais frileux. Certains demandent des garanties de visibilité.",
      tone: "commercial offensif",
    },
    n1Baselines: {
      ads: {
        ledSeason: 20000,
        giantScreenSeason: 10000,
        interviewBackdropSeason: 7000,
        digitalSeason: 5000,
      },
    },
    forcedEvents: [
      {
        type: "SPONSOR_COMPLAINT",
        severity: 1,
        seed:
          "Un sponsor secondaire demande des chiffres précis d'exposition.",
      },
    ],
    requiredDecisions: {
      sliders: [
        {
          id: "S_LED_PRICE",
          label: "Prix pack LED bord terrain (saison)",
          metric: "price_led",
          unit: "€",
          min: 12000,
          max: 30000,
          step: 500,
          defaultValue: 20000,
          recommendedRange: { min: 18000, max: 24000 },
        },
        {
          id: "S_SCREEN_PRICE",
          label: "Prix pack écran géant (saison)",
          metric: "price_led",
          unit: "€",
          min: 6000,
          max: 20000,
          step: 500,
          defaultValue: 10000,
          recommendedRange: { min: 9000, max: 13000 },
        },
      ],
      choices: [
        {
          id: "C_SELLING_ANGLE",
          prompt:
            "Quel argument commercial mettez-vous en avant pour vendre ces espaces ?",
          options: [
            {
              id: "A",
              label: "Données & ROI (exposition)",
              hint: "Crédibilité / exige reporting",
            },
            {
              id: "B",
              label: "Storytelling club & valeurs",
              hint: "Image / moins chiffré",
            },
            {
              id: "C",
              label: "Remise early-bird",
              hint: "Conversion / valeur perçue -",
            },
            {
              id: "D",
              label: "Bonus activation inclus",
              hint: "Satisfaction + / coût +",
            },
          ],
        },
      ],
    },
    requiredScenes: [
      {
        type: "BRIEFING",
        seed:
          "Briefing commercial: packaging sponsor (LED vs écran) et promesse de valeur.",
      },
    ],
    partnerSeeds: [
      {
        partnerId: "P_LED_MAIN",
        partnerName: "NeoVision",
        profile: "DEMANDING",
        topic: "LED",
      },
      {
        partnerId: "P_SCREEN",
        partnerName: "CityMedia",
        profile: "OPPORTUNIST",
        topic: "GIANT_SCREEN",
      },
    ],
  },
  {
    turnNumber: 4,
    title: "Négociation: sponsor LED mécontent",
    learningGoal:
      "Gérer objections prix/visibilité et préserver le partenariat via concessions intelligentes.",
    fixedContext: {
      lastWeekHook:
        "Le sponsor LED principal estime payer trop cher au regard de la visibilité perçue et cite un club concurrent.",
      tone: "tension relationnelle",
    },
    n1Baselines: {
      ads: { ledSeason: 20000 },
    },
    forcedEvents: [
      {
        type: "SPONSOR_COMPLAINT",
        severity: 2,
        seed:
          "NeoVision menace de renégocier ou de quitter si la valeur perçue ne s'améliore pas rapidement.",
      },
    ],
    requiredDecisions: {
      sliders: [],
      choices: [
        {
          id: "C_NEGOTIATION_POSTURE",
          prompt: "Quelle posture adoptez-vous en entrée de négociation ?",
          options: [
            {
              id: "A",
              label: "Empathie + diagnostic",
              hint: "Relation / temps",
            },
            {
              id: "B",
              label: "Chiffres & ROI immédiat",
              hint: "Factuel / peut braquer",
            },
            {
              id: "C",
              label: "Fermeté contractuelle",
              hint: "Protège marge / risque rupture",
            },
            {
              id: "D",
              label: "Proposition créative (activation)",
              hint: "Valeur / coût +",
            },
          ],
        },
      ],
    },
    requiredScenes: [
      {
        type: "NEGOTIATION",
        seed: "Négociation 6 étapes avec objections (LED) et issue conditionnelle.",
      },
    ],
    partnerSeeds: [
      {
        partnerId: "P_LED_MAIN",
        partnerName: "NeoVision",
        profile: "DEMANDING",
        topic: "LED",
      },
    ],
  },
  {
    turnNumber: 5,
    title: "Activation sponsors & fan zone",
    learningGoal:
      "Comprendre l'effet différé de l'activation sur la satisfaction et la fidélité des partenaires.",
    fixedContext: {
      lastWeekHook:
        "Les sponsors demandent davantage d'activation. Les fans veulent une meilleure expérience avant match.",
      tone: "construction de valeur",
    },
    n1Baselines: {
      ads: { digitalSeason: 5000, giantScreenSeason: 10000 },
    },
    forcedEvents: [
      {
        type: "GOOD_NEWS",
        severity: 1,
        seed:
          "Une opportunité de co-branding local se présente (petit coût, potentiel d'image).",
      },
    ],
    requiredDecisions: {
      sliders: [
        {
          id: "S_ACTIVATION_BUDGET",
          label: "Budget activation sponsors (ce tour)",
          metric: "activation_budget",
          unit: "€",
          min: 0,
          max: 30000,
          step: 1000,
          defaultValue: 8000,
          recommendedRange: { min: 6000, max: 15000 },
        },
      ],
      choices: [
        {
          id: "C_ACTIVATION_TYPE",
          prompt: "Quelle activation priorisez-vous ?",
          options: [
            {
              id: "A",
              label: "Fan zone avant match",
              hint: "Fans +++ / logistique",
            },
            {
              id: "B",
              label: "Activation digitale (concours)",
              hint: "Brand + / coût modéré",
            },
            {
              id: "C",
              label: "Packages écran géant sponsorisés",
              hint: "Sponsors + / contenu",
            },
            {
              id: "D",
              label: "Aucune activation (économies)",
              hint: "Cash + / sponsors -",
            },
          ],
        },
      ],
    },
    requiredScenes: [
      {
        type: "INTERNAL_MEETING",
        seed:
          "Meeting marketing: choix d'activation et mesure de performance (KPI).",
      },
    ],
    partnerSeeds: [
      {
        partnerId: "P_DIGITAL",
        partnerName: "PulseTech",
        profile: "LOYAL",
        topic: "DIGITAL",
      },
    ],
  },
  {
    turnNumber: 6,
    title: "Bad buzz supporters & communication",
    learningGoal:
      "Gérer l'image en crise, arbitrer transparence vs contrôle et limiter l'effet sur les revenus.",
    fixedContext: {
      lastWeekHook:
        "Un hashtag critique le club: prix élevés, expérience stade jugée décevante.",
      tone: "crise médiatique",
    },
    n1Baselines: {
      tickets: { virage: 15, centrale: 35 },
      subscriptions: { virage: 220, centrale: 520 },
    },
    forcedEvents: [
      {
        type: "SOCIAL_BACKLASH",
        severity: 2,
        seed: "Bad buzz: 'Beyond FC se déconnecte de ses supporters'.",
      },
    ],
    requiredDecisions: {
      sliders: [],
      choices: [
        {
          id: "C_PUBLIC_RESPONSE",
          prompt: "Quelle réponse publique adoptez-vous dans les 2 heures ?",
          options: [
            {
              id: "A",
              label: "Silence + monitoring",
              hint: "Risque escalade",
            },
            {
              id: "B",
              label: "Justification factuelle",
              hint: "Peut paraître froid",
            },
            {
              id: "C",
              label: "Mea culpa + engagement",
              hint: "Confiance + / expose",
            },
            {
              id: "D",
              label: "Geste immédiat (promo/bonus)",
              hint: "Apaise / coût",
            },
          ],
        },
      ],
    },
    requiredScenes: [
      {
        type: "MEDIA",
        seed: "Point de communication: message, ton, et plan d'action 48h.",
      },
    ],
    partnerSeeds: [],
  },
  {
    turnNumber: 7,
    title: "Sponsor principal maillot: sécurité vs dépendance",
    learningGoal:
      "Comparer un gros deal unique à une stratégie multi-partenaires (risque, stabilité, image).",
    fixedContext: {
      lastWeekHook:
        "Une entreprise propose un sponsoring maillot élevé mais exige exclusivité et forte visibilité.",
      tone: "opportunité sous conditions",
    },
    n1Baselines: {
      jerseyPrice: 40,
      ads: { digitalSeason: 5000, interviewBackdropSeason: 7000 },
    },
    forcedEvents: [
      {
        type: "GOOD_NEWS",
        severity: 2,
        seed:
          "Offre sponsor maillot: gros montant, contraintes strictes et clause d'image.",
      },
    ],
    requiredDecisions: {
      sliders: [],
      choices: [
        {
          id: "C_SPONSOR_STRATEGY",
          prompt: "Quelle stratégie de sponsoring maillot choisissez-vous ?",
          options: [
            {
              id: "A",
              label: "Gros sponsor unique (exclusif)",
              hint: "Cash +++ / dépendance",
            },
            {
              id: "B",
              label: "2 sponsors moyens (partage)",
              hint: "Risque réduit / cash ++",
            },
            {
              id: "C",
              label: "3 sponsors secondaires + activation",
              hint: "Diversifié / complexe",
            },
            {
              id: "D",
              label: "Refuser et préserver l'image",
              hint: "Brand + / cash -",
            },
          ],
        },
      ],
    },
    requiredScenes: [
      {
        type: "INTERNAL_MEETING",
        seed:
          "Conseil de direction: analyse risques/ROI, clauses et cohérence de marque.",
      },
    ],
    partnerSeeds: [
      {
        partnerId: "P_JERSEY_OFFER",
        partnerName: "Finora Group",
        profile: "OPPORTUNIST",
        topic: "JERSEY_SPONSOR",
      },
    ],
  },
  {
    turnNumber: 8,
    title: "Incident en loge & négociation à chaud",
    learningGoal:
      "Gérer conflit B2B en situation sensible, désamorcer et restaurer la confiance.",
    fixedContext: {
      lastWeekHook:
        "Après le match, altercation en loge entre un partenaire hospitalité et un supporter. Témoins, malaise.",
      tone: "crise relationnelle",
    },
    n1Baselines: {
      tickets: { loge: 120 },
      ads: { hospitalityPackageSeason: 15000 },
    },
    forcedEvents: [
      {
        type: "HOSPITALITY_INCIDENT",
        severity: 3,
        seed:
          "Le partenaire hospitalité menace de quitter si le club ne prend pas des mesures immédiates.",
      },
    ],
    requiredDecisions: {
      sliders: [],
      choices: [
        {
          id: "C_FIRST_RESPONSE",
          prompt: "Quelle est votre première réponse au partenaire, sur place ?",
          options: [
            {
              id: "A",
              label: "Excuses + prise en charge immédiate",
              hint: "Apaisement rapide",
            },
            {
              id: "B",
              label: "Rappeler le cadre & minimiser",
              hint: "Risque d'escalade",
            },
            {
              id: "C",
              label: "Promettre une compensation financière",
              hint: "Coût / calme",
            },
            {
              id: "D",
              label: "Proposer rencontre privée dès demain",
              hint: "Contrôle / délai",
            },
          ],
        },
      ],
    },
    requiredScenes: [
      {
        type: "NEGOTIATION",
        seed:
          "Négociation 6 étapes avec objections (hospitalité/loge) et issue conditionnelle.",
      },
    ],
    partnerSeeds: [
      {
        partnerId: "P_HOSP",
        partnerName: "LuxeHabitat",
        profile: "EMOTIONAL",
        topic: "HOSPITALITY",
      },
    ],
  },
  {
    turnNumber: 9,
    title: "Tensions financières & arbitrages budgétaires",
    learningGoal:
      "Arbitrer court terme vs long terme: couper des coûts sans détruire la valeur future.",
    fixedContext: {
      lastWeekHook:
        "Les marges sont sous pression. La direction demande un plan d'économies rapide.",
      tone: "urgence financière",
    },
    n1Baselines: {
      ads: { digitalSeason: 5000 },
      tickets: { virage: 15, centrale: 35 },
    },
    forcedEvents: [
      {
        type: "MATCH_RESULT_NEWS",
        severity: 1,
        seed:
          "Résultat récent mitigé, la dynamique commerciale n'est pas portée par l'enthousiasme sportif.",
      },
    ],
    requiredDecisions: {
      sliders: [
        {
          id: "S_MARKETING_CUT",
          label: "Réduction budget marketing (ce tour)",
          metric: "marketing_cut",
          unit: "€",
          min: 0,
          max: 40000,
          step: 2000,
          defaultValue: 12000,
          recommendedRange: { min: 8000, max: 20000 },
        },
      ],
      choices: [
        {
          id: "C_CUT_AREA",
          prompt: "Où coupez-vous en priorité ?",
          options: [
            {
              id: "A",
              label: "Activation sponsors",
              hint: "Cash + / sponsors -",
            },
            {
              id: "B",
              label: "Communication & contenu",
              hint: "Brand - / cash +",
            },
            {
              id: "C",
              label: "Expérience stade (animations)",
              hint: "Fans - / cash +",
            },
            {
              id: "D",
              label: "Coupe répartie (partout)",
              hint: "Impact modéré / complexité",
            },
          ],
        },
      ],
    },
    requiredScenes: [
      {
        type: "BRIEFING",
        seed: "Réunion de crise: plan d'économies et impacts à 2-3 tours.",
      },
    ],
    partnerSeeds: [],
  },
  {
    turnNumber: 10,
    title: "Bilan & projection",
    learningGoal:
      "Analyser les conséquences cumulées, identifier son style de gestion et préparer la suite.",
    fixedContext: {
      lastWeekHook:
        "Fin de cycle: vous présentez un bilan au conseil et projetez la stratégie du prochain trimestre.",
      tone: "bilan stratégique",
    },
    n1Baselines: {},
    forcedEvents: [
      {
        type: "GOOD_NEWS",
        severity: 1,
        seed:
          "Le conseil accepte un plan si des KPI clairs sont présentés.",
      },
    ],
    requiredDecisions: {
      sliders: [],
      choices: [
        {
          id: "C_NEXT_QUARTER_FOCUS",
          prompt:
            "Quel axe stratégique priorisez-vous pour le prochain trimestre ?",
          options: [
            {
              id: "A",
              label: "Maximiser cash (rentabilité)",
              hint: "Court terme",
            },
            {
              id: "B",
              label: "Reconquérir fans (expérience)",
              hint: "Valeur long terme",
            },
            {
              id: "C",
              label: "Premium sponsors (B2B)",
              hint: "Stabilité contrats",
            },
            {
              id: "D",
              label: "Brand & notoriété (média)",
              hint: "Attractivité globale",
            },
          ],
        },
      ],
    },
    requiredScenes: [
      {
        type: "INTERNAL_MEETING",
        seed:
          "Debrief direction: KPI, enseignements, risques et opportunités.",
      },
      {
        type: "MEDIA",
        seed:
          "Synthèse publique: message de fin de cycle et engagement fans/partenaires.",
      },
    ],
    partnerSeeds: [],
  },
];


