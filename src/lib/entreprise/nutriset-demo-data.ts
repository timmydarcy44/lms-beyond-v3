/** Données démo partagées Nutriset (présentations). */

export const NUTRISET_ORG_ID = "163c8e74-b648-4792-9167-2b4031a888b3";

export const NUTRISET_DEMO_VIEWER_EMAILS = new Set([
  "timmydarcy44@gmail.com",
  "jerome.picot@edgebs.fr",
  "demo@entreprise.fr",
  "contact@edgebs.fr",
]);

/** Comptes salarié à enrichir pour les démos /dashboard/salarie. */
export const SALARIE_DEMO_EMAILS = new Set([
  "timmydarcy44@gmail.com",
  "jerome.picot@edgebs.fr",
  "demoapprenant@psg.fr",
]);

export function isNutrisetDemoViewer(email: string | null | undefined): boolean {
  return Boolean(email && NUTRISET_DEMO_VIEWER_EMAILS.has(email.trim().toLowerCase()));
}

export function isSalarieDemoEmail(email: string | null | undefined): boolean {
  return Boolean(email && SALARIE_DEMO_EMAILS.has(email.trim().toLowerCase()));
}

export const NUTRISET_DEMO_METIERS = [
  {
    id: "demo-metier-commercial",
    title: "Commercial terrain",
    description: "Développer le portefeuille clients et conclure des opportunités à fort enjeu.",
    hard_skills: ["CRM", "Prospection multicanale", "Négociation", "Pipeline management"],
    soft_skills: ["Assertivité", "Écoute active", "Résilience", "Influence"],
  },
  {
    id: "demo-metier-rh",
    title: "Talent Manager RH",
    description: "Piloter le développement des compétences et l’engagement des collaborateurs.",
    hard_skills: ["GPEC", "Recrutement", "SIRH", "Reporting RH"],
    soft_skills: ["Empathie", "Communication", "Discernement", "Leadership"],
  },
  {
    id: "demo-metier-manager",
    title: "Manager d’équipe",
    description: "Animer la performance collective et accompagner la montée en compétences.",
    hard_skills: ["Pilot management", "Conduite du changement", "Pilotage KPI", "Délégation"],
    soft_skills: ["Leadership", "Feedback", "Gestion du stress", "Coopération"],
  },
  {
    id: "demo-metier-marketing",
    title: "Marketing digital",
    description: "Concevoir des campagnes data-driven et renforcer la marque employeur.",
    hard_skills: ["SEO / SEA", "Content marketing", "Analytics", "Automation"],
    soft_skills: ["Créativité", "Storytelling", "Collaboration", "Curiosité"],
  },
  {
    id: "demo-metier-ops",
    title: "Chef de projet Ops",
    description: "Orchestrer les projets transverses et sécuriser les livraisons.",
    hard_skills: ["Planification", "Gestion de risques", "Outils collaboratifs", "Reporting"],
    soft_skills: ["Organisation", "Rigueur", "Communication", "Adaptabilité"],
  },
  {
    id: "demo-metier-formation",
    title: "Ingénieur pédagogique",
    description: "Concevoir des parcours blended et mesurer l’impact learning.",
    hard_skills: ["Ingénierie pédagogique", "LMS", "Évaluation", "Blended learning"],
    soft_skills: ["Pédagogie", "Écoute", "Créativité", "Transmission"],
  },
] as const;

export const NUTRISET_DEMO_FORMATIONS = {
  presentiel: [
    {
      id: "demo-sess-1",
      title: "Leadership inter-équipes",
      formateur: "Claire Dupont",
      date: new Date().toISOString().slice(0, 10),
      time: "09:30",
      status: "confirmee",
      confirmed: 12,
      total: 14,
    },
    {
      id: "demo-sess-2",
      title: "Négociation avancée",
      formateur: "Marc Lefèvre",
      date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      time: "14:00",
      status: "confirmee",
      confirmed: 8,
      total: 10,
    },
  ],
  elearning: [
    {
      id: "demo-path-1",
      title: "Parcours IA Productivité",
      learners: 22,
      completion_pct: 64,
    },
    {
      id: "demo-path-2",
      title: "Modern Prospecting",
      learners: 15,
      completion_pct: 71,
    },
    {
      id: "demo-path-3",
      title: "Soft Skills Manager",
      learners: 18,
      completion_pct: 48,
    },
  ],
} as const;

/** Snapshot tests pour dashboards salarié (DISC / IDMC / soft skills). */
export function buildSalarieDemoSnapshot(email: string) {
  const lower = email.toLowerCase();
  const isJerome = lower.includes("jerome");
  const isPsgApprenant = lower.includes("demoapprenant@psg.fr");
  return {
    firstName: isPsgApprenant ? "Demo" : isJerome ? "Jerome" : "Timmy",
    jobTitle: isPsgApprenant
      ? "Analyste performance"
      : isJerome
        ? "Responsable Commercial"
        : "Directeur Associé",
    discScores: isJerome
      ? { D: 72, I: 64, S: 38, C: 41 }
      : isPsgApprenant
        ? { D: 61, I: 58, S: 44, C: 67 }
        : { D: 58, I: 71, S: 45, C: 52 },
    idmcAxes: isJerome
      ? {
          attention: 62,
          memoire: 58,
          logique: 71,
          verbal: 66,
          spatial: 54,
          global: 64,
        }
      : isPsgApprenant
        ? {
            attention: 70,
            memoire: 65,
            logique: 78,
            verbal: 62,
            spatial: 71,
            global: 72,
          }
        : {
            attention: 68,
            memoire: 61,
            logique: 74,
            verbal: 70,
            spatial: 59,
            global: 69,
          },
    softSkillsRadar: [
      { title: "Leadership", score: isPsgApprenant ? 71 : isJerome ? 74 : 78 },
      { title: "Communication", score: isPsgApprenant ? 68 : isJerome ? 81 : 76 },
      { title: "Collaboration", score: isPsgApprenant ? 80 : isJerome ? 69 : 82 },
      { title: "Résilience", score: isPsgApprenant ? 76 : isJerome ? 72 : 70 },
      { title: "Créativité", score: isPsgApprenant ? 64 : isJerome ? 61 : 73 },
      { title: "Organisation", score: isPsgApprenant ? 79 : isJerome ? 77 : 68 },
    ],
    aiAnalysis: isPsgApprenant
      ? "Profil performance sport : conformité et logique élevées, forte organisation et collaboration. Priorité : communication media et leadership transverse staff Academy."
      : isJerome
        ? "Profil orienté performance commerciale : dominance DISC élevée, logique IDMC solide, communication et résilience au-dessus de la moyenne. Priorité : renforcer le leadership d’équipe et l’IA métier."
        : "Profil stratégique équilibré : influence et logique élevées, forte coopération. Priorité : structurer le pilotage compétences et accélérer les parcours Learning+.",
  };
}

export function buildSalarieDemoMissions(email: string) {
  const owner = email.toLowerCase().includes("jerome") ? "Jerome" : "Timmy";
  const base = Date.now();
  return [
    {
      id: `demo-mission-${owner}-1`,
      title: "Compléter le diagnostic Soft Skills",
      description: "Finaliser le 3ᵉ test pour débloquer le badge Profil comportemental EDGE.",
      due_date: new Date(base + 3 * 86400000).toISOString().slice(0, 10),
      status: "in_progress",
      created_at: new Date(base - 5 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: `demo-mission-${owner}-2`,
      title: "Parcours Modern Prospecting — module 2",
      description: "Suivre le module e-learning et valider le quiz associé.",
      due_date: new Date(base + 10 * 86400000).toISOString().slice(0, 10),
      status: "todo",
      created_at: new Date(base - 2 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: `demo-mission-${owner}-3`,
      title: "Entretien individuel RH — préparation",
      description: "Préparer les axes de développement issus du plan d’action personnalisé.",
      due_date: new Date(base + 14 * 86400000).toISOString().slice(0, 10),
      status: "todo",
      created_at: new Date(base - 1 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: `demo-mission-${owner}-4`,
      title: "Partager le badge Communication",
      description: "Publier le badge obtenu sur le wallet et le profil LinkedIn.",
      due_date: new Date(base - 1 * 86400000).toISOString().slice(0, 10),
      status: "done",
      created_at: new Date(base - 12 * 86400000).toISOString(),
      updated_at: new Date(base - 2 * 86400000).toISOString(),
    },
  ];
}

export function buildSalarieDemoBadges() {
  return {
    earnedOpenBadges: [
      {
        id: "a1000001-0000-4000-8000-000000000001",
        name: "Profil comportemental EDGE",
        image_url: null,
        awardedAt: new Date().toISOString(),
      },
      {
        id: "demo-badge-communication",
        name: "Communication",
        image_url: null,
        awardedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: "demo-badge-prospecting",
        name: "Modern Prospecting",
        image_url: null,
        awardedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
    ],
    visibleOpenBadges: [
      {
        id: "demo-badge-ai",
        name: "AI Prompting",
        image_url: null,
      },
      {
        id: "demo-badge-leadership",
        name: "Leadership Foundation",
        image_url: null,
      },
    ],
  };
}
