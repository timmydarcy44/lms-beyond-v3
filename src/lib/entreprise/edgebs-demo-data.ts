/** Données démo EDGE Business (comptes @edgebs.fr). */

export const EDGEBS_ORG_ID = "e7b5c4d2-8a1f-4e3b-9c6d-2f0a8b7e5d41";

export const EDGEBS_DEMO_VIEWER_EMAILS = new Set([
  "demo@edgebs.fr",
  "demoentreprise@edgebs.fr",
  "demosalarie@edgebs.fr",
  "timmydarcy44@gmail.com",
  "jerome.picot@edgebs.fr",
  "contact@edgebs.fr",
]);

export function isEdgebsDemoViewer(email: string | null | undefined): boolean {
  return Boolean(email && EDGEBS_DEMO_VIEWER_EMAILS.has(email.trim().toLowerCase()));
}

export const EDGEBS_DEMO_METIERS = [
  {
    id: "edgebs-metier-commercial",
    title: "Commercial B2B",
    description: "Développer le portefeuille clients entreprises et conclure des opportunités Learning.",
    hard_skills: ["CRM", "Prospection", "Négociation", "Pipeline"],
    soft_skills: ["Assertivité::13", "Écoute::12", "Résilience::12", "Influence::12", "Organisation::11"],
  },
  {
    id: "edgebs-metier-rh",
    title: "Talent Partner RH",
    description: "Piloter compétences, engagement et parcours collaborateurs.",
    hard_skills: ["GPEC", "SIRH", "Recrutement", "Reporting RH"],
    soft_skills: ["Empathie::13", "Discernement::12", "Communication::13", "Organisation::12", "Confidentialité::14"],
  },
  {
    id: "edgebs-metier-manager",
    title: "Manager d’équipe",
    description: "Animer la performance collective et accompagner la montée en compétences.",
    hard_skills: ["People management", "KPI", "Délégation", "Conduite du changement"],
    soft_skills: ["Leadership::13", "Feedback::13", "Coopération::12", "Gestion du stress::12", "Décision::12"],
  },
  {
    id: "edgebs-metier-learning",
    title: "Learning & Development",
    description: "Concevoir des parcours blended et mesurer l’impact formation.",
    hard_skills: ["Ingénierie pédagogique", "LMS", "Évaluation", "Blended learning"],
    soft_skills: ["Pédagogie::14", "Créativité::12", "Transmission::13", "Écoute::12", "Organisation::11"],
  },
  {
    id: "edgebs-metier-ops",
    title: "Chef de projet Ops",
    description: "Orchestrer les projets transverses et sécuriser les livraisons.",
    hard_skills: ["Planification", "Risques", "Outils collaboratifs", "Reporting"],
    soft_skills: ["Rigueur::13", "Adaptabilité::12", "Communication::12", "Organisation::13", "Gestion du stress::11"],
  },
  {
    id: "edgebs-metier-marketing",
    title: "Marketing & marque employeur",
    description: "Renforcer la marque EDGE et les campagnes acquisition talents.",
    hard_skills: ["Content", "Analytics", "SEO", "Automation"],
    soft_skills: ["Storytelling::13", "Créativité::13", "Curiosité::12", "Collaboration::12", "Communication::12"],
  },
] as const;

/** Offres recrutement démo (UUIDs stables). */
export const EDGEBS_DEMO_JOB_OFFERS = [
  {
    id: "a1b2c3d4-e5f6-4789-a012-3456789abc01",
    title: "Account Manager B2B — EDGE Business",
    description:
      "Développez un portefeuille PME/ETI sur l’offre Learning EDGE. Prospection, closing et suivi client.",
    city: "Le Havre / Remote",
    salary_range: "38-45k",
    contract_type: "CDI",
    status: "published",
    applications_count: 12,
    requirements: "Expérience commerciale B2B, aisance CRM, appétence formation.",
  },
  {
    id: "a1b2c3d4-e5f6-4789-a012-3456789abc02",
    title: "Talent Partner RH",
    description:
      "Pilotez diagnostics, entretiens et parcours collaborateurs au sein d’EDGE Business Demo.",
    city: "Paris",
    salary_range: "42-50k",
    contract_type: "CDI",
    status: "published",
    applications_count: 8,
    requirements: "Expérience RH / talent, sensibilité data people, anglais opérationnel.",
  },
  {
    id: "a1b2c3d4-e5f6-4789-a012-3456789abc03",
    title: "Alternance — Learning Designer",
    description:
      "Concevez des micro-modules blended et mesurez l’impact formation avec l’équipe L&D.",
    city: "Remote France",
    salary_range: "Selon grille",
    contract_type: "Alternance",
    status: "published",
    applications_count: 21,
    requirements: "Formation Bac+3/5 pédagogie ou digital learning.",
  },
] as const;

export const EDGEBS_DEMO_STATS = {
  coursesCount: 14,
  publishedCount: 11,
  enrollmentsCount: 86,
  completedCount: 29,
  avgCompletionPercent: 67,
  testsPassedCount: 54,
  totalConnectionSeconds: 312 * 3600,
  totalConnectionLabel: "312 h",
  activeLearnersCount: 39,
  quizRecent: [
    {
      id: "edgebs-quiz-1",
      userId: "edgebs-demo-alex",
      userName: "Alex Martin",
      score: 82,
      testTitle: "Quiz Modern Prospecting",
      createdAt: new Date().toISOString(),
    },
    {
      id: "edgebs-quiz-2",
      userId: "edgebs-demo-clara",
      userName: "Clara Martin",
      score: 91,
      testTitle: "Quiz Leadership",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "edgebs-quiz-3",
      userId: "edgebs-demo-julie",
      userName: "Julie Morel",
      score: 76,
      testTitle: "Quiz Soft Skills",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "edgebs-quiz-4",
      userId: "edgebs-demo-thomas",
      userName: "Thomas Leroy",
      score: 88,
      testTitle: "Quiz IA managers",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
  topFormations: [
    { courseId: "edgebs-tf-1", title: "Modern Prospecting", seconds: 86 * 3600, label: "86 h" },
    { courseId: "edgebs-tf-2", title: "Leadership inter-équipes", seconds: 64 * 3600, label: "64 h" },
    { courseId: "edgebs-tf-3", title: "Parcours IA Productivité", seconds: 51 * 3600, label: "51 h" },
    { courseId: "edgebs-tf-4", title: "Soft Skills Manager", seconds: 44 * 3600, label: "44 h" },
  ],
} as const;

export const EDGEBS_DEMO_EQUIPE_ID = "b2c3d4e5-f6a7-4890-b123-456789abcdef";

export const EDGEBS_DEMO_EQUIPES = [
  { id: EDGEBS_DEMO_EQUIPE_ID, name: "Sales & Account Management", organisation_id: EDGEBS_ORG_ID },
  {
    id: "b2c3d4e5-f6a7-4890-b123-456789abcde0",
    name: "People & Learning",
    organisation_id: EDGEBS_ORG_ID,
  },
] as const;

export function buildEdgebsDemoEquipeAggregat(equipeId: string, organisationId: string) {
  const now = new Date();
  const debut = new Date(now.getTime() - 30 * 86400000);
  return {
    id: `edgebs-agg-${equipeId.slice(0, 8)}`,
    equipe_id: equipeId,
    organisation_id: organisationId,
    periode_debut: debut.toISOString().slice(0, 10),
    periode_fin: now.toISOString().slice(0, 10),
    nb_membres_actifs: 12,
    nb_diagnostics_completes: 11,
    idmc_moyen: 68,
    idmc_zone: "attention" as const,
    stress_moyen: 42,
    stress_signal: "modere" as const,
    disc_d_pct: 22,
    disc_i_pct: 31,
    disc_s_pct: 28,
    disc_c_pct: 19,
    taux_completion_moyen: 64,
    nb_abandons_semaine: 1,
    connexions_hors_horaires: 4,
    gaps_competences: ["Négociation avancée", "IA générative", "Feedback managérial"],
    modules_recommandes: ["Modern Prospecting", "Leadership inter-équipes", "IA pour managers"],
    nb_signaux_attention: 2,
    nb_signaux_critique: 0,
    insight_principal:
      "L’équipe Sales progresse bien sur la prospection ; renforcer le coaching négociation et limiter les connexions hors horaires.",
    cohesion_score: 74,
    profil_manquant: "Profil Conforme (C) sous-représenté",
    insuffisant: false,
    created_at: now.toISOString(),
  };
}

export const EDGEBS_DEMO_FORMATIONS = {
  presentiel: [
    {
      id: "edgebs-sess-1",
      title: "Leadership inter-équipes EDGE",
      formateur: "Claire Dupont",
      date: new Date().toISOString().slice(0, 10),
      time: "09:30",
      status: "confirmee",
      confirmed: 12,
      total: 14,
    },
    {
      id: "edgebs-sess-2",
      title: "Négociation commerciale avancée",
      formateur: "Marc Lefèvre",
      date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      time: "14:00",
      status: "planifiee",
      confirmed: 8,
      total: 12,
    },
    {
      id: "edgebs-sess-3",
      title: "IA générative pour managers",
      formateur: "Sara Benali",
      date: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
      time: "10:00",
      status: "planifiee",
      confirmed: 16,
      total: 18,
    },
  ],
  elearning: [
    {
      path_id: "edgebs-path-1",
      title: "Parcours IA Productivité",
      enrolled: 28,
      completion_pct: 64,
      avg_quiz_score: 81,
      badges_count: 17,
    },
    {
      path_id: "edgebs-path-2",
      title: "Modern Prospecting",
      enrolled: 19,
      completion_pct: 71,
      avg_quiz_score: 78,
      badges_count: 12,
    },
    {
      path_id: "edgebs-path-3",
      title: "Soft Skills Manager",
      enrolled: 22,
      completion_pct: 53,
      avg_quiz_score: 74,
      badges_count: 9,
    },
  ],
} as const;
