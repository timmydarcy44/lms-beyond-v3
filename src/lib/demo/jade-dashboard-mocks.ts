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

export const JADE_ENTREPRISE_OVERVIEW: EntrepriseOverviewData = {
  demo_enriched: true,
  configuration_required: false,
  viewer: { email: "jade@byound.fr", prenom: "Jade", nom: "Martin" },
  organisation: { id: "jade-org", name: "Byound Business" },
  kpis: {
    employees_total: 32,
    diagnostics_completed: 24,
    diagnostics_total: 32,
    diagnostics_pct: 75,
    enrollments_active: 18,
  },
  employees: [
    { id: "e1", first_name: "Léa", last_name: "Bernard", email: "lea@example.com", job_title: "Commerciale", department: "Ventes", created_at: iso(-80), diagnostic_done: true, idmc_score: 78, formation_active: true },
    { id: "e2", first_name: "Hugo", last_name: "Martin", email: "hugo@example.com", job_title: "Account manager", department: "Ventes", created_at: iso(-60), diagnostic_done: true, idmc_score: 71, formation_active: true },
    { id: "e3", first_name: "Inès", last_name: "Morel", email: "ines@example.com", job_title: "SDR", department: "Prospection", created_at: iso(-20), diagnostic_done: false, idmc_score: null, formation_active: true },
    { id: "e4", first_name: "Noah", last_name: "Petit", email: "noah@example.com", job_title: "Customer success", department: "Relation client", created_at: iso(-12), diagnostic_done: true, idmc_score: 84, formation_active: false },
  ],
  employees_pending: 1,
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
