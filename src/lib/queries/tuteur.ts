import { getServerClient } from "@/lib/supabase/server";

export type TutorKpiSnapshot = {
  learners: number;
  activeMissions: number;
  pendingForms: number;
  badgesAwarded: number;
};

export type TutorLearnerOverview = {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  progression: number;
  lastActivity: string;
  nextMission?: string;
  latestScore?: number;
  lastScoreLabel?: string;
};

export type TutorFollowupTodo = {
  id: string;
  learnerName: string;
  dueDate: string;
  formTitle: string;
  status: "pending" | "completed" | "overdue";
};

export type TutorMissionHighlight = {
  id: string;
  title: string;
  learnerName: string;
  dueDate: string;
  status: "todo" | "in_progress" | "done";
  domain: string;
  description: string;
};

export type TutorReferentialProfile = {
  id: string;
  title: string;
  description: string;
  domain: string;
  level: string;
  organization?: string;
  skillFocus: string[];
  missionExamples: Array<{
    id: string;
    title: string;
    objective: string;
    outcome: string;
    difficulty: "starter" | "core" | "expert";
    suggestedTimeline: string;
  }>;
};

export type TutorDashboardData = {
  kpis: TutorKpiSnapshot;
  learners: TutorLearnerOverview[];
  followups: TutorFollowupTodo[];
  missions: TutorMissionHighlight[];
  referential: TutorReferentialProfile;
};

const fallbackData: TutorDashboardData = {
  kpis: {
    learners: 4,
    activeMissions: 7,
    pendingForms: 3,
    badgesAwarded: 12,
  },
  learners: [
    {
      id: "learner-1",
      name: "Anaïs Dupont",
      role: "Commerciale B2B",
      company: "NeoTech",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
      progression: 68,
      lastActivity: "05 sept. 2025",
      nextMission: "Plan de prospection Q4",
      latestScore: 82,
      lastScoreLabel: "Diagnostic neurosciences",
    },
    {
      id: "learner-2",
      name: "Maxime Leroy",
      role: "Manager retail",
      company: "Orion Retail",
      avatar: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80",
      progression: 54,
      lastActivity: "04 sept. 2025",
      nextMission: "Débrief visite terrain",
      latestScore: 74,
      lastScoreLabel: "Storytelling émotionnel",
    },
    {
      id: "learner-3",
      name: "Louise Martin",
      role: "Chargée de clientèle",
      company: "Trans&Co",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      progression: 91,
      lastActivity: "01 sept. 2025",
      nextMission: "Simulation rendez-vous",
      latestScore: 88,
      lastScoreLabel: "Échelle confiance live",
    },
  ],
  followups: [
    {
      id: "form-1",
      learnerName: "Anaïs Dupont",
      dueDate: "2025-09-08",
      formTitle: "Suivi mensuel commerce",
      status: "pending",
    },
    {
      id: "form-2",
      learnerName: "Maxime Leroy",
      dueDate: "2025-09-10",
      formTitle: "Check-in management",
      status: "overdue",
    },
    {
      id: "form-3",
      learnerName: "Louise Martin",
      dueDate: "2025-09-15",
      formTitle: "Autonomie & missions",
      status: "pending",
    },
  ],
  missions: [
    {
      id: "mission-1",
      title: "Prospection clients premium",
      learnerName: "Anaïs Dupont",
      dueDate: "2025-09-12",
      status: "in_progress",
      domain: "Commerce",
      description: "Valider 10 prises de contact ciblées et qualifier les besoins.",
    },
    {
      id: "mission-2",
      title: "Audit merchandising rentrée",
      learnerName: "Maxime Leroy",
      dueDate: "2025-09-08",
      status: "todo",
      domain: "Retail",
      description: "Documenter les écarts et proposer 3 actions rapides.",
    },
    {
      id: "mission-3",
      title: "Préparation support keynote",
      learnerName: "Louise Martin",
      dueDate: "2025-09-05",
      status: "done",
      domain: "Communication",
      description: "Co-construire la présentation commerciale de lancement.",
    },
  ],
  referential: {
    id: "ref-ntc",
    title: "Titre Professionnel Négociateur Technico-Commercial",
    description:
      "Deux blocs de compétences centrés sur la prospection, la négociation et la fidélisation clients. Objectif : atteindre l’autonomie commerciale en environnement B2B.",
    domain: "Commerce",
    level: "Bac+2",
    organization: "Beyond Learning",
    skillFocus: [
      "Prospection & ciblage",
      "Argumentation et scénarisation",
      "Suivi satisfaction & fidélisation",
      "Analyse de performance",
    ],
    missionExamples: [
      {
        id: "mission-ex-1",
        title: "Cartographie prospects stratégiques",
        objective: "Construire une liste de 30 prospects à fort potentiel dans le secteur prioritaire.",
        outcome: "Fichier enrichi (personas, besoins, canal privilégié)",
        difficulty: "starter",
        suggestedTimeline: "Semaines 1-2",
      },
      {
        id: "mission-ex-2",
        title: "Sprint rendez-vous découverte",
        objective: "Conduire 5 rendez-vous découverte et produire un compte rendu structuré.",
        outcome: "Grille de qualification, synthèse besoins, plan d’actions",
        difficulty: "core",
        suggestedTimeline: "Semaines 3-5",
      },
      {
        id: "mission-ex-3",
        title: "Cycle de négociation complet",
        objective: "Mener une négociation (argumentaire, objection, closing) sur une offre stratégique.",
        outcome: "Compte rendu négociation, analyse des leviers utilisés",
        difficulty: "core",
        suggestedTimeline: "Semaines 6-8",
      },
      {
        id: "mission-ex-4",
        title: "Plan fidélisation portefeuille",
        objective: "Construire un plan d’actions pour sécuriser 3 clients clés",
        outcome: "Roadmap trimestrielle + KPI de suivi",
        difficulty: "expert",
        suggestedTimeline: "Semaines 9-12",
      },
    ],
  },
};

export const getTutorDashboardData = async (): Promise<TutorDashboardData> => {
  const supabase = await getServerClient();

  if (!supabase) {
    console.warn("[tuteur] Supabase client unavailable, returning fallback data");
    return fallbackData;
  }

  try {
    // TODO: remplacer par de vraies requêtes une fois les tables tuteur créées.
    return fallbackData;
  } catch (error) {
    console.warn("[tuteur] Supabase query failed, returning fallback data", error);
    return fallbackData;
  }
};
