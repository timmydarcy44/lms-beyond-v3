import type { ExpertAccessRow } from "@/lib/expert/expert-access";
import type { TutorWorkspacePayload } from "@/lib/tuteur/workspace-server";
import type { EntrepriseOverviewData } from "@/lib/entreprise/overview-types";

const iso = (daysFromNow: number, hour = 9) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const JADE_EXPERT: ExpertAccessRow = {
  id: "jade-demo",
  email: "jade@byound.fr",
  first_name: "Jade",
  last_name: "Martin",
  headline: "Experte commerciale",
  bio: "Accompagne les équipes sur la prospection et le closing.",
  review_status: "approved",
  is_active: true,
  is_certified_beyond: true,
  certification_status: "certified",
  specialties: ["Prospection", "Closing", "CRM"],
  formats_supported: ["Présentiel", "Visio"],
  regions: ["Normandie", "Île-de-France"],
  wants_certification: true,
  registration_step: 4,
};

export const JADE_EXPERT_MISSIONS = [
  { id: "jade-m1", action_type: "intervention", target_label: "Atelier closing — Byound", status: "completed", created_at: iso(-40), scheduled_at: iso(-40, 14), metadata: {} },
  { id: "jade-m2", action_type: "intervention", target_label: "Prospection B2B — NTC", status: "completed", created_at: iso(-28), scheduled_at: iso(-28, 9), metadata: {} },
  { id: "jade-m3", action_type: "coaching", target_label: "Coaching individuel — Léa", status: "completed", created_at: iso(-18), scheduled_at: iso(-18, 11), metadata: {} },
  { id: "jade-m4", action_type: "intervention", target_label: "Négociation — promo 2026", status: "completed", created_at: iso(-7), scheduled_at: iso(-7, 15), metadata: {} },
  { id: "jade-m5", action_type: "intervention", target_label: "Entretien Jade · aujourd'hui", status: "scheduled", created_at: iso(-2), scheduled_at: iso(0, 16), metadata: {} },
  { id: "jade-m6", action_type: "intervention", target_label: "Atelier closing · vendredi", status: "accepted", created_at: iso(-1), scheduled_at: iso(2, 10), metadata: {} },
  { id: "jade-m7", action_type: "coaching", target_label: "Point commercial · Inès", status: "expert_notified", created_at: iso(-1), scheduled_at: iso(4, 11), metadata: {} },
];

export const JADE_FORMATEUR_SLOTS = [
  { id: "jade-s1", starts_at: iso(0, 9), ends_at: iso(0, 12), duration_hours: 3, module: { name: "Prospection B2B" }, class: { name: "NTC AI Business" } },
  { id: "jade-s2", starts_at: iso(1, 14), ends_at: iso(1, 17), duration_hours: 3, module: { name: "CRM" }, class: { name: "Salle 2" } },
  { id: "jade-s3", starts_at: iso(3, 9), ends_at: iso(3, 12), duration_hours: 3, module: { name: "Plan d'actions" }, class: { name: "NTC Business Sport" } },
];

export const JADE_COURSES = [
  {
    title: "CCP1 — Stratégie de prospection",
    href: "/catalog/formations",
    progress: "62 %",
    percent: 62,
    cover: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "NTC AI Business",
    href: "/catalog/formations",
    progress: "40 %",
    percent: 40,
    cover: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Négociation commerciale",
    href: "/catalog/formations",
    progress: "18 %",
    percent: 18,
    cover: "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=1200&q=80",
  },
];

export const JADE_DISC_SCORES = { D: 68, I: 82, S: 54, C: 61 };

export const JADE_IDMC_AXES = {
  A1: 76,
  A2: 64,
  A3: 71,
  A4: 82,
  A5: 69,
  A6: 74,
  A7: 66,
  A8: 80,
};

const JADE_SOFT_TITLES = [
  "Communication interpersonnelle",
  "Écoute active",
  "Empathie",
  "Gestion des conflits",
  "Leadership",
  "Collaboration et travail en équipe",
  "Adaptabilité",
  "Gestion du stress",
  "Intelligence émotionnelle",
  "Confiance en soi",
  "Résolution des problèmes",
  "Prise de décision",
  "Gestion du temps",
  "Persévérance",
  "Esprit critique",
  "Créativité",
  "Proactivité",
  "Sens de l'organisation",
  "Ouverture d'esprit",
  "Sens des responsabilités",
];

export const JADE_SOFT_SKILLS_RADAR = JADE_SOFT_TITLES.map((skill, index) => ({
  skill,
  score: 58 + ((index * 7) % 34),
}));

export const JADE_SOFT_SKILLS_RECORD = Object.fromEntries(
  JADE_SOFT_SKILLS_RADAR.map((row) => [row.skill, row.score]),
);

const JADE_TEAM = [
  ["Léa", "Bernard", "Commerciale", "Ventes", true, 78, true],
  ["Hugo", "Martin", "Account manager", "Ventes", true, 71, true],
  ["Inès", "Morel", "SDR", "Prospection", false, null, true],
  ["Noah", "Petit", "Customer success", "Relation client", true, 84, false],
  ["Camille", "Roux", "Responsable pédagogique", "Formation", true, 81, true],
  ["Adam", "Garcia", "Talent partner", "Ressources humaines", true, 73, true],
  ["Zoé", "Laurent", "Cheffe de projet", "Opérations", false, null, true],
  ["Ethan", "Simon", "Manager d'équipe", "Management", true, 69, true],
  ["Lina", "David", "Brand manager", "Marketing", true, 77, false],
  ["Tom", "Moreau", "Formateur interne", "Formation", false, null, false],
] as const;

export const JADE_ENTREPRISE_OVERVIEW: EntrepriseOverviewData = {
  demo_enriched: true,
  configuration_required: false,
  viewer: { email: "jade@byound.fr", prenom: "Jade", nom: "Martin" },
  organisation: { id: "jade-org", name: "Byound Business" },
  kpis: {
    employees_total: JADE_TEAM.length,
    diagnostics_completed: JADE_TEAM.filter((row) => row[4]).length,
    diagnostics_total: JADE_TEAM.length,
    diagnostics_pct: Math.round((JADE_TEAM.filter((row) => row[4]).length / JADE_TEAM.length) * 100),
    enrollments_active: JADE_TEAM.filter((row) => row[6]).length,
  },
  employees: JADE_TEAM.map((row, index) => ({
    id: `jade-emp-${index + 1}`,
    first_name: row[0],
    last_name: row[1],
    email: `${row[0].toLowerCase()}.${row[1].toLowerCase()}@byound.fr`,
    job_title: row[2],
    department: row[3],
    created_at: iso(-90 + index * 6),
    diagnostic_done: row[4],
    idmc_score: row[5],
    formation_active: row[6],
  })),
  employees_pending: JADE_TEAM.filter((row) => !row[4]).length,
};

export const JADE_TUTOR_WORKSPACE: TutorWorkspacePayload = {
  tutorName: "Jade Martin",
  assignments: [
    {
      id: "a1",
      learnerId: "l1",
      firstName: "Léa",
      lastName: "Bernard",
      displayName: "Léa Bernard",
      email: "lea@example.com",
      phone: null,
      ecole: "CFA Byound",
      contratType: "Alternance",
      rythmeAlternance: "3 jours entreprise",
      dateDebut: iso(-90),
      dateFin: iso(180),
      missionsTotal: 8,
      missionsValidees: 5,
      missionsAValider: 1,
      statut: "en_cours",
    },
    {
      id: "a2",
      learnerId: "l2",
      firstName: "Inès",
      lastName: "Morel",
      displayName: "Inès Morel",
      email: "ines@example.com",
      phone: null,
      ecole: "CFA Byound",
      contratType: "Alternance",
      rythmeAlternance: "2 jours entreprise",
      dateDebut: iso(-40),
      dateFin: iso(200),
      missionsTotal: 6,
      missionsValidees: 2,
      missionsAValider: 2,
      statut: "en_retard",
    },
  ],
  pendingMissions: [
    { id: "pm1", title: "Livret de Léa", learnerName: "Léa Bernard", dueDate: iso(2), assignmentId: "a1" },
    { id: "pm2", title: "Point pédagogique", learnerName: "Inès Morel", dueDate: iso(4), assignmentId: "a2" },
  ],
  alerts: ["Visite entreprise jeudi"],
  kpis: { learners: 7, pendingMissionActions: 2, evaluationsTodo: 1, badgesAwarded: 3 },
  todoPreview: [{ id: "td1", title: "Signer le livret de Léa" }],
};

export const JADE_HARD_SKILLS: Array<{ name: string; level: "Débutant" | "Intermédiaire" | "Confirmé" | "Expert"; category: string }> = [
  { name: "Prospection", level: "Confirmé", category: "Vente" },
  { name: "Négociation", level: "Intermédiaire", category: "Vente" },
  { name: "CRM", level: "Confirmé", category: "CRM" },
  { name: "Closing", level: "Intermédiaire", category: "Vente" },
  { name: "Prise de parole", level: "Expert", category: "Communication" },
  { name: "Qualification de besoin", level: "Confirmé", category: "Vente" },
];

export const JADE_JOB_OFFERS = [
  { id: "jade-job-1", title: "Commerciale B2B", city: "Le Havre", contract_type: "CDI", salary_range: "32–38 k€", description: "Développer un portefeuille de comptes formation.", company_name: "Byound Business", company_hidden_from_learner: false },
  { id: "jade-job-2", title: "Business developer", city: "Paris", contract_type: "CDI", salary_range: "36–42 k€", description: "Prospection et closing de parcours entreprise.", company_name: "NTC Partners", company_hidden_from_learner: false },
  { id: "jade-job-3", title: "Chargée de clientèle", city: "Rouen", contract_type: "Alternance", salary_range: "Selon grille", description: "Suivi des apprenants et relances commerciales.", company_name: "CFA Byound", company_hidden_from_learner: false },
];

export function jadePlanningSlots(weekStart: Date) {
  const at = (dayOffset: number, hour: number, minutes = 90) => {
    const start = new Date(weekStart);
    start.setDate(start.getDate() + dayOffset);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + minutes * 60_000);
    return { starts_at: start.toISOString(), ends_at: end.toISOString() };
  };
  return [
    { id: "jade-slot-1", ...at(0, 9), module: { name: "Veille commerciale", code: "CCP1" }, instructor: { full_name: "Camille Roux" }, room: { name: "Salle 2" }, class: { name: "Promo Jade" } },
    { id: "jade-slot-2", ...at(1, 14), module: { name: "Closing", code: "CCP2" }, instructor: { full_name: "Hugo Martin" }, room: { name: "Visio" }, class: { name: "Promo Jade" } },
    { id: "jade-slot-3", ...at(3, 10), module: { name: "Entretien de vente", code: "CCP3" }, instructor: { full_name: "Léa Bernard" }, room: { name: "Salle 1" }, class: { name: "Promo Jade" } },
  ];
}
