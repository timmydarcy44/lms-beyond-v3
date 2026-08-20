/** Données démo Paris Saint-Germain (présentations équipes). */

export const PSG_ORG_ID = "cb2bc84a-2f19-4744-8539-d5a13a3d7006";

export const PSG_DEMO_VIEWER_EMAILS = new Set([
  "demo@psg.fr",
  "demoapprenant@psg.fr",
  "timmydarcy44@gmail.com",
  "jerome.picot@edgebs.fr",
  "contact@edgebs.fr",
]);

export function isPsgDemoViewer(email: string | null | undefined): boolean {
  return Boolean(email && PSG_DEMO_VIEWER_EMAILS.has(email.trim().toLowerCase()));
}

export const PSG_DEMO_METIERS = [
  {
    id: "psg-metier-performance",
    title: "Analyste performance",
    description: "Mesurer et optimiser la performance sportive et individuelle.",
    hard_skills: ["Data sport", "GPS tracking", "Reporting KPI", "Vidéo analyse"],
    soft_skills: ["Rigueur", "Curiosité", "Communication", "Esprit d’équipe"],
  },
  {
    id: "psg-metier-medical",
    title: "Staff médical / récupération",
    description: "Prévenir les blessures et accompagner le retour à la compétition.",
    hard_skills: ["Préparation physique", "Protocoles blessure", "Suivi charge", "Nutrition"],
    soft_skills: ["Empathie", "Discernement", "Calme", "Coordination"],
  },
  {
    id: "psg-metier-academy",
    title: "Éducateur Academy",
    description: "Former les jeunes talents et transmettre la culture club.",
    hard_skills: ["Pédagogie football", "Détection", "Suivi scolaire", "LMS"],
    soft_skills: ["Transmission", "Patience", "Leadership", "Exigence"],
  },
  {
    id: "psg-metier-rh",
    title: "RH / People Club",
    description: "Développer l’engagement et les parcours internes du club.",
    hard_skills: ["GPEC", "Onboarding", "SIRH", "Entretiens"],
    soft_skills: ["Écoute", "Discrétion", "Influence", "Organisation"],
  },
  {
    id: "psg-metier-ops",
    title: "Operations matchday",
    description: "Sécuriser l’organisation des matchs et événements Parc des Princes.",
    hard_skills: ["Logistique", "Sécurité", "Coordination partenaires", "Planning"],
    soft_skills: ["Réactivité", "Stress management", "Collaboration", "Rigueur"],
  },
  {
    id: "psg-metier-commercial",
    title: "Hospitalité & partenariats",
    description: "Valoriser l’expérience VIP et les relations partenaires.",
    hard_skills: ["CRM", "Négociation", "Événementiel", "Relation client"],
    soft_skills: ["Relationnel", "Présentation", "Créativité", "Service"],
  },
] as const;

export const PSG_DEMO_FORMATIONS = {
  presentiel: [
    {
      id: "psg-sess-1",
      title: "Leadership staff technique",
      formateur: "Claire Moreau",
      date: new Date().toISOString().slice(0, 10),
      time: "09:00",
      status: "confirmee",
      confirmed: 14,
      total: 16,
    },
    {
      id: "psg-sess-2",
      title: "Communication de crise media",
      formateur: "Antoine Vidal",
      date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      time: "14:00",
      status: "planifiee",
      confirmed: 9,
      total: 12,
    },
    {
      id: "psg-sess-3",
      title: "Mindset & récupération mentale",
      formateur: "Sara Benali",
      date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      time: "10:30",
      status: "planifiee",
      confirmed: 18,
      total: 20,
    },
  ],
  elearning: [
    {
      path_id: "psg-path-1",
      title: "Soft skills haute performance",
      enrolled: 48,
      completion_pct: 67,
      avg_quiz_score: 82,
      badges_count: 31,
    },
    {
      path_id: "psg-path-2",
      title: "Communication club & médias",
      enrolled: 36,
      completion_pct: 54,
      avg_quiz_score: 78,
      badges_count: 22,
    },
    {
      path_id: "psg-path-3",
      title: "Sécurité & protocoles matchday",
      enrolled: 28,
      completion_pct: 71,
      avg_quiz_score: 88,
      badges_count: 19,
    },
  ],
} as const;
