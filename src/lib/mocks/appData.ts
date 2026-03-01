export type DiscScores = {
  D: number;
  I: number;
  S: number;
  C: number;
};

export type MockUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  school_class: string;
  contract_type: "Alternance" | "Initial";
  avatar_url?: string | null;
  cv_url?: string | null;
  cerfa_url?: string | null;
  motivation_letter_url?: string | null;
  rqth_url?: string | null;
  disc_profile: string;
  disc_scores: DiscScores;
  soft_skills_scores: Record<string, number>;
  open_badges: string[];
  tutor_feedback: string;
  live_status?: "live" | "en_poste" | "test";
  handicap_alert?: {
    label: "DYS" | "Stress Eleve";
    recommendations: string[];
  };
  cognitive_tests?: {
    mai: {
      global: number;
      declarative: number;
      procedures: number;
      conditional?: number;
      error_management: number;
    };
    stress?: {
      restricted: boolean;
      physical: number;
      management: number;
    };
    dys?: {
      restricted: boolean;
      oral_language: number;
      executive: number;
      motor: number;
    };
  };
};

export type MockOffer = {
  id: string;
  title: string;
  city: string;
  description: string;
  target_disc: DiscScores;
  desired_profile: string;
  logo_url?: string;
  disc_focus?: string;
};

export type MockProspect = {
  id: string;
  name: string;
  company_name?: string;
  status: string;
  amount?: number | null;
  npc_value?: number | null;
  opco_name?: string | null;
  city?: string | null;
  positions?: number;
  cursus?: string;
  hot?: boolean;
};

const makeScores = (scores: DiscScores) => scores;

const defaultCognitiveTests = {
  mai: {
    global: 0,
    declarative: 0,
    procedures: 0,
    conditional: 0,
    error_management: 0,
  },
  stress: {
    restricted: true,
    physical: 0,
    management: 0,
  },
  dys: {
    restricted: true,
    oral_language: 0,
    executive: 0,
    motor: 0,
  },
};

const withCognitiveDefaults = (user: MockUser): MockUser => ({
  ...user,
  cognitive_tests: user.cognitive_tests ?? {
    mai: { ...defaultCognitiveTests.mai },
    stress: { ...defaultCognitiveTests.stress },
    dys: { ...defaultCognitiveTests.dys },
  },
});

const rawMockUsers: MockUser[] = [
  {
    id: "mock-01",
    first_name: "Jean",
    last_name: "Durand",
    email: "jean.durand@beyond-cfa.fr",
    phone: "06 12 45 89 33",
    school_class: "Bachelor Commerce",
    contract_type: "Alternance",
    avatar_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    disc_profile: "Le Dominant",
    disc_scores: makeScores({ D: 88, I: 64, S: 30, C: 38 }),
    soft_skills_scores: {
      Empathie: 62,
      Resilience: 86,
      Leadership: 90,
      Negotiation: 88,
      Rigueur: 68,
    },
    open_badges: ["Vente Retail PSG", "Ambassadeur HAC"],
    tutor_feedback:
      "Très à l'aise en boutique, doit canaliser son énergie lors des pics de stress.",
    live_status: "live",
  },
  {
    id: "mock-02",
    first_name: "Sarah",
    last_name: "Benguigi",
    email: "sarah.benguigi@beyond-cfa.fr",
    phone: "06 22 18 40 90",
    school_class: "Mastère Business",
    contract_type: "Alternance",
    avatar_url:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    disc_profile: "La Consciencieuse",
    disc_scores: makeScores({ D: 58, I: 52, S: 62, C: 88 }),
    soft_skills_scores: {
      Empathie: 70,
      Resilience: 82,
      Leadership: 74,
      Negotiation: 70,
      Rigueur: 92,
    },
    open_badges: ["Expert AFEST", "Beyond Care - Résilience"],
    tutor_feedback:
      "Profil très structuré, excellente tenue des KPI, gagnerait à prendre plus de risques.",
    live_status: "en_poste",
  },
  {
    id: "mock-03",
    first_name: "Yanis",
    last_name: "El Khouri",
    email: "yanis.elkhouri@beyond-cfa.fr",
    phone: "06 33 57 21 18",
    school_class: "Bachelor RH",
    contract_type: "Alternance",
    avatar_url:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    disc_profile: "Le Stable",
    disc_scores: makeScores({ D: 38, I: 54, S: 86, C: 60 }),
    soft_skills_scores: {
      Empathie: 92,
      Resilience: 68,
      Leadership: 60,
      Negotiation: 55,
      Rigueur: 73,
    },
    open_badges: ["Beyond Care - Résilience", "HAC Academy"],
    tutor_feedback:
      "Très apprécié par les équipes, doit oser cadrer davantage lorsqu'il est en réunion.",
    handicap_alert: {
      label: "DYS",
      recommendations: ["Temps majoré requis", "Besoin de supports visuels"],
    },
  },
  {
    id: "mock-04",
    first_name: "Camille",
    last_name: "Duval",
    email: "camille.duval@beyond-cfa.fr",
    phone: "06 18 70 11 52",
    school_class: "Mastère RH",
    contract_type: "Initial",
    avatar_url:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
    disc_profile: "L'Influent",
    disc_scores: makeScores({ D: 54, I: 86, S: 52, C: 42 }),
    soft_skills_scores: {
      Empathie: 82,
      Resilience: 72,
      Leadership: 70,
      Negotiation: 66,
      Rigueur: 68,
    },
    open_badges: ["RMC Storytelling", "Ambassadeur HAC"],
    tutor_feedback:
      "Très bonne énergie en présentation, doit renforcer la phase de closing.",
  },
  {
    id: "mock-05",
    first_name: "Ines",
    last_name: "Saidi",
    email: "ines.saidi@beyond-cfa.fr",
    phone: "07 01 63 22 08",
    school_class: "Bachelor Commerce",
    contract_type: "Alternance",
    avatar_url:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
    disc_profile: "La Dominante",
    disc_scores: makeScores({ D: 91, I: 70, S: 26, C: 44 }),
    soft_skills_scores: {
      Empathie: 60,
      Resilience: 88,
      Leadership: 92,
      Negotiation: 90,
      Rigueur: 70,
    },
    open_badges: ["Vente Retail PSG", "HAC Academy"],
    tutor_feedback:
      "Très performante en closing, veille à garder une écoute active lors des négociations longues.",
    live_status: "test",
  },
  {
    id: "mock-06",
    first_name: "Hugo",
    last_name: "Bernard",
    email: "hugo.bernard@beyond-cfa.fr",
    phone: "06 45 02 90 14",
    school_class: "Bachelor Commerce",
    contract_type: "Alternance",
    avatar_url:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
    disc_profile: "L'Influent",
    disc_scores: makeScores({ D: 60, I: 86, S: 50, C: 40 }),
    soft_skills_scores: {
      Empathie: 74,
      Resilience: 69,
      Leadership: 72,
      Negotiation: 71,
      Rigueur: 65,
    },
    open_badges: ["RMC Storytelling", "Vente Retail PSG"],
    tutor_feedback:
      "Très bon storytelling, doit structurer davantage ses relances pour monter en volume.",
  },
  {
    id: "mock-07",
    first_name: "Maya",
    last_name: "Rossi",
    email: "maya.rossi@beyond-cfa.fr",
    phone: "06 29 84 53 77",
    school_class: "Mastère Business",
    contract_type: "Alternance",
    avatar_url:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
    disc_profile: "La Dominante",
    disc_scores: makeScores({ D: 84, I: 78, S: 34, C: 52 }),
    soft_skills_scores: {
      Empathie: 66,
      Resilience: 80,
      Leadership: 86,
      Negotiation: 78,
      Rigueur: 72,
    },
    open_badges: ["Expert AFEST", "Vente Retail PSG"],
    tutor_feedback:
      "Très bonne projection stratégique, reste à renforcer la rigueur sur les process.",
    handicap_alert: {
      label: "Stress Eleve",
      recommendations: ["Rythme de rendez-vous allégé", "Pause encadrée en fin de journée"],
    },
  },
  {
    id: "mock-08",
    first_name: "Leo",
    last_name: "Garcia",
    email: "leo.garcia@beyond-cfa.fr",
    phone: "06 77 38 60 05",
    school_class: "Bachelor RH",
    contract_type: "Initial",
    avatar_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    disc_profile: "Le Stable",
    disc_scores: makeScores({ D: 34, I: 56, S: 90, C: 66 }),
    soft_skills_scores: {
      Empathie: 94,
      Resilience: 70,
      Leadership: 54,
      Negotiation: 58,
      Rigueur: 78,
    },
    open_badges: ["Beyond Care - Résilience", "RMC Storytelling"],
    tutor_feedback:
      "Très apprécié pour sa posture d'écoute, doit gagner en assertivité lors des briefs.",
  },
  {
    id: "mock-09",
    first_name: "Nina",
    last_name: "Perret",
    email: "nina.perret@beyond-cfa.fr",
    phone: "06 13 09 44 62",
    school_class: "Mastère RH",
    contract_type: "Alternance",
    avatar_url:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    disc_profile: "La Consciencieuse",
    disc_scores: makeScores({ D: 46, I: 38, S: 64, C: 92 }),
    soft_skills_scores: {
      Empathie: 68,
      Resilience: 74,
      Leadership: 62,
      Negotiation: 52,
      Rigueur: 96,
    },
    open_badges: ["Expert AFEST", "HAC Academy"],
    tutor_feedback:
      "Excellente rigueur documentaire, doit travailler la prise de parole en public.",
  },
  {
    id: "mock-10",
    first_name: "Valentin",
    last_name: "Lamaille",
    email: "valentin.lamaille@beyond-cfa.fr",
    phone: "06 58 12 11 09",
    school_class: "Bachelor Commerce",
    contract_type: "Alternance",
    avatar_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    cv_url: "/docs/CV_Valentin.pdf",
    rqth_url: "/docs/Dossier_Inscription.pdf",
    disc_profile: "Le Stable",
    disc_scores: makeScores({ D: 42, I: 58, S: 88, C: 64 }),
    soft_skills_scores: {
      Empathie: 80,
      Resilience: 78,
      Leadership: 62,
      Negotiation: 58,
      Rigueur: 72,
    },
    open_badges: ["Beyond Care - Résilience", "Expert AFEST"],
    tutor_feedback:
      "Posture fiable en clientèle, doit gagner en confiance lors des prises de parole.",
    cognitive_tests: {
      mai: {
        global: 78,
        declarative: 85,
        procedures: 60,
        conditional: 40,
        error_management: 84,
      },
      stress: {
        restricted: true,
        physical: 1,
        management: 4,
      },
      dys: {
        restricted: true,
        oral_language: 2,
        executive: 4,
        motor: 2,
      },
    },
  },
];

export const mockUsers = rawMockUsers.map(withCognitiveDefaults);

export const mockOffers: MockOffer[] = [
  {
    id: "offer-sm-caen",
    title: "SM Caen - Chargé(e) de partenariats",
    city: "Caen",
    description:
      "Développement du portefeuille sponsors, activation terrain et gestion des relations VIP.",
    target_disc: makeScores({ D: 80, I: 60, S: 30, C: 40 }),
    desired_profile: "Dominant",
    logo_url: "https://ui-avatars.com/api/?name=SM+Caen&background=E8F5E9&color=2E7D32&bold=true",
    disc_focus: "Majorité D & I",
  },
  {
    id: "offer-fc-rouen",
    title: "FC Rouen - Business Developer",
    city: "Rouen",
    description: "Prospection B2B, closing et reporting hebdo sur le pipe commercial.",
    target_disc: makeScores({ D: 86, I: 64, S: 28, C: 42 }),
    desired_profile: "Dominant",
    logo_url: "https://ui-avatars.com/api/?name=FC+Rouen&background=E8F5E9&color=2E7D32&bold=true",
    disc_focus: "D élevé, I solide",
  },
  {
    id: "offer-hac",
    title: "HAC - Account Manager",
    city: "Le Havre",
    description: "Suivi des comptes clés, upsell et animation des événements partenaires.",
    target_disc: makeScores({ D: 60, I: 72, S: 62, C: 50 }),
    desired_profile: "Stable",
    logo_url: "https://ui-avatars.com/api/?name=HAC&background=E8F5E9&color=2E7D32&bold=true",
    disc_focus: "S & I équilibrés",
  },
  {
    id: "offer-ol",
    title: "OL - Responsable CRM & Fan Experience",
    city: "Lyon",
    description: "Animation CRM, campagnes multicanal et pilotage de la fidélisation.",
    target_disc: makeScores({ D: 58, I: 86, S: 54, C: 44 }),
    desired_profile: "Influent",
    logo_url: "https://ui-avatars.com/api/?name=OL&background=E8F5E9&color=2E7D32&bold=true",
    disc_focus: "I très dominant",
  },
  {
    id: "offer-rmc",
    title: "RMC - Chargé(e) de communication",
    city: "Paris",
    description: "Création de contenus, storytelling audio/vidéo et coordination éditoriale.",
    target_disc: makeScores({ D: 52, I: 88, S: 56, C: 48 }),
    desired_profile: "Influent",
    logo_url: "https://ui-avatars.com/api/?name=RMC&background=E8F5E9&color=2E7D32&bold=true",
    disc_focus: "I très dominant",
  },
];

export const mockProspects: MockProspect[] = [
  {
    id: "prospect-01",
    name: "SM Caen",
    company_name: "SM Caen",
    status: "Prospect",
    amount: 9000,
    npc_value: 9000,
    opco_name: "AFDAS",
    city: "Caen",
    positions: 2,
    cursus: "Bachelor",
    hot: true,
  },
  {
    id: "prospect-02",
    name: "FC Rouen",
    company_name: "FC Rouen",
    status: "Présentation",
    amount: 14500,
    npc_value: 14500,
    opco_name: "AFDAS",
    city: "Rouen",
    positions: 1,
    cursus: "Mastere",
  },
  {
    id: "prospect-03",
    name: "HAC",
    company_name: "HAC",
    status: "Offre en cours",
    amount: 13500,
    npc_value: 13500,
    opco_name: "AFDAS",
    city: "Le Havre",
    positions: 1,
    cursus: "Mastere",
    hot: true,
  },
  {
    id: "prospect-04",
    name: "OL",
    company_name: "OL",
    status: "Envoi CERFA",
    amount: 16000,
    npc_value: 16000,
    opco_name: "OPCO Mobilités",
    city: "Lyon",
    positions: 1,
    cursus: "Bachelor",
  },
  {
    id: "prospect-05",
    name: "RMC",
    company_name: "RMC",
    status: "Gagné",
    amount: 11000,
    npc_value: 11000,
    opco_name: "AFDAS",
    city: "Paris",
    positions: 2,
    cursus: "Mastere",
  },
];

export const getMockHandicapRows = () =>
  mockUsers
    .filter((user) => user.handicap_alert)
    .map((user) => ({
      student_id: user.id,
      accommodation_type: user.handicap_alert?.label || null,
      justification_files: null,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      city: "Le Havre",
      address: "Campus Beyond, 22 rue du Foot",
      zip_code: "76600",
      class_name: user.school_class,
      avatar_url: user.avatar_url || null,
      recommendations: user.handicap_alert?.recommendations || [],
      live_status: user.live_status,
    }));

export const computeDiscMatch = (student: DiscScores, offer: DiscScores) => {
  const deltas = [
    100 - Math.abs(student.D - offer.D),
    100 - Math.abs(student.I - offer.I),
    100 - Math.abs(student.S - offer.S),
    100 - Math.abs(student.C - offer.C),
  ];
  const avg = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  return Math.max(55, Math.min(98, Math.round(avg)));
};

export const getMatchingScoreForOffer = (student?: MockUser | null, offer?: MockOffer | null) => {
  if (!student || !offer) return 0;
  return computeDiscMatch(student.disc_scores, offer.target_disc);
};

