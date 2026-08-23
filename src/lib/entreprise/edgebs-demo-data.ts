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
    soft_skills: ["Assertivité", "Écoute", "Résilience", "Influence"],
  },
  {
    id: "edgebs-metier-rh",
    title: "Talent Partner RH",
    description: "Piloter compétences, engagement et parcours collaborateurs.",
    hard_skills: ["GPEC", "SIRH", "Recrutement", "Reporting RH"],
    soft_skills: ["Empathie", "Discernement", "Communication", "Organisation"],
  },
  {
    id: "edgebs-metier-manager",
    title: "Manager d’équipe",
    description: "Animer la performance collective et accompagner la montée en compétences.",
    hard_skills: ["People management", "KPI", "Délégation", "Conduite du changement"],
    soft_skills: ["Leadership", "Feedback", "Coopération", "Gestion du stress"],
  },
  {
    id: "edgebs-metier-learning",
    title: "Learning & Development",
    description: "Concevoir des parcours blended et mesurer l’impact formation.",
    hard_skills: ["Ingénierie pédagogique", "LMS", "Évaluation", "Blended learning"],
    soft_skills: ["Pédagogie", "Créativité", "Transmission", "Écoute"],
  },
  {
    id: "edgebs-metier-ops",
    title: "Chef de projet Ops",
    description: "Orchestrer les projets transverses et sécuriser les livraisons.",
    hard_skills: ["Planification", "Risques", "Outils collaboratifs", "Reporting"],
    soft_skills: ["Rigueur", "Adaptabilité", "Communication", "Organisation"],
  },
  {
    id: "edgebs-metier-marketing",
    title: "Marketing & marque employeur",
    description: "Renforcer la marque EDGE et les campagnes acquisition talents.",
    hard_skills: ["Content", "Analytics", "SEO", "Automation"],
    soft_skills: ["Storytelling", "Créativité", "Curiosité", "Collaboration"],
  },
] as const;

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
