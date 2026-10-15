export const JADE_DEMO_EMAIL = "jade@byound.fr";

export function isJadeDemoEmail(email?: string | null): boolean {
  return String(email ?? "").trim().toLowerCase() === JADE_DEMO_EMAIL;
}

export const JADE_DEMO_SPACES = [
  { id: "apprenant", label: "Apprenant", href: "/dashboard/apprenant" },
  { id: "student", label: "Étudiant", href: "/dashboard/student" },
  { id: "formateur", label: "Formateur", href: "/dashboard/formateur" },
  { id: "ecole", label: "École", href: "/dashboard/ecole" },
  { id: "expert", label: "Expert", href: "/dashboard/expert" },
  { id: "entreprise", label: "Entreprise", href: "/dashboard/entreprise" },
  { id: "salarie", label: "Salarié", href: "/dashboard/salarie" },
  { id: "praticien", label: "Praticien", href: "/dashboard/praticien" },
  { id: "tuteur", label: "Tuteur", href: "/dashboard/tuteur" },
  { id: "club", label: "Club", href: "/dashboard/club" },
  { id: "partenaire", label: "Partenaire", href: "/dashboard/partenaire" },
] as const;

export type JadeDemoSpace = (typeof JADE_DEMO_SPACES)[number]["id"];

export const JADE_DEMO_MOCK: Record<JadeDemoSpace, { kicker: string; title: string; stats: Array<{ label: string; value: string }>; rows: string[] }> = {
  apprenant: {
    kicker: "Espace apprenant",
    title: "Jade Martin",
    stats: [
      { label: "Formations", value: "4" },
      { label: "Progression", value: "62 %" },
      { label: "Badges", value: "2" },
    ],
    rows: ["CCP1 — Stratégie de prospection · 62 %", "NTC AI Business · 40 %", "Quiz de la semaine · à faire", "Session coach · jeudi 10 h"],
  },
  student: {
    kicker: "Espace étudiant",
    title: "Promo NTC 2026",
    stats: [
      { label: "Cours", value: "6" },
      { label: "Présence", value: "96 %" },
      { label: "Devoirs", value: "1" },
    ],
    rows: ["Cours du jour · Prospection B2B", "Devoir · Plan d'actions commercial", "Classe · NTC AI Business"],
  },
  formateur: {
    kicker: "Espace formateur",
    title: "Planning de la semaine",
    stats: [
      { label: "Séances", value: "8" },
      { label: "Apprenants", value: "24" },
      { label: "Journaux", value: "3" },
    ],
    rows: ["Lundi 9 h · Prospection · 12 présents", "Mardi 14 h · CRM · salle 2", "Journal à valider · Léa Bernard"],
  },
  ecole: {
    kicker: "Espace école",
    title: "CFA Byound",
    stats: [
      { label: "Classes", value: "5" },
      { label: "Apprenants", value: "86" },
      { label: "Entreprises", value: "18" },
    ],
    rows: ["NTC AI Business · 22 inscrits", "NTC Business Sport · 16 inscrits", "3 conventions à signer"],
  },
  expert: {
    kicker: "Espace expert",
    title: "Agenda expert",
    stats: [
      { label: "RDV", value: "6" },
      { label: "Revenus", value: "1 840 €" },
      { label: "Avis", value: "4,9" },
    ],
    rows: ["Entretien Jade · aujourd'hui 16 h", "Atelier closing · vendredi", "Versement du mois · en cours"],
  },
  entreprise: {
    kicker: "Espace entreprise",
    title: "Byound Business",
    stats: [
      { label: "Collaborateurs", value: "32" },
      { label: "Formations", value: "7" },
      { label: "Complétion", value: "71 %" },
    ],
    rows: ["Équipe commerciale · 18 personnes", "Parcours prospection · 71 %", "2 nouvelles inscriptions"],
  },
  salarie: {
    kicker: "Espace salarié",
    title: "Mon parcours",
    stats: [
      { label: "Modules", value: "5" },
      { label: "Avancement", value: "48 %" },
      { label: "Coachings", value: "2" },
    ],
    rows: ["Module 2 · Qualifier un prospect", "Coaching · mardi 11 h", "Quiz · score 16/20"],
  },
  praticien: {
    kicker: "Espace praticien",
    title: "Suivi des séances",
    stats: [
      { label: "Séances", value: "11" },
      { label: "Clients", value: "9" },
      { label: "À venir", value: "3" },
    ],
    rows: ["Séance découverte · Camille", "Bilan de compétences · Noah", "Compte-rendu à envoyer"],
  },
  tuteur: {
    kicker: "Espace tuteur",
    title: "Suivi alternance",
    stats: [
      { label: "Alternants", value: "7" },
      { label: "Visites", value: "2" },
      { label: "Alertes", value: "1" },
    ],
    rows: ["Visite entreprise · jeudi", "Livret de Léa · à signer", "Point pédagogique · Inès"],
  },
  club: {
    kicker: "Espace club",
    title: "Club Byound",
    stats: [
      { label: "Membres", value: "140" },
      { label: "Événements", value: "3" },
      { label: "Messages", value: "12" },
    ],
    rows: ["Afterwork · 22 octobre", "Nouveau membre · Studio Nord", "Fil de discussion · partenariats"],
  },
  partenaire: {
    kicker: "Espace partenaire",
    title: "Partenaire démo",
    stats: [
      { label: "Leads", value: "15" },
      { label: "Offres", value: "4" },
      { label: "Taux", value: "28 %" },
    ],
    rows: ["Offre stage commercial · 6 vues", "Lead qualifié · Hugo Martin", "Publication club · en ligne"],
  },
};
