/** Enrichit le payload overview EDGE Business Demo. */

import {
  EDGEBS_DEMO_FORMATIONS,
  EDGEBS_ORG_ID,
  isEdgebsDemoViewer,
} from "@/lib/entreprise/edgebs-demo-data";

const DEMO_EMPLOYEES_TOTAL = 48;
const DEMO_DIAGNOSTICS_COMPLETED = 39;

const FIRST_NAMES = [
  "Léa", "Hugo", "Chloé", "Louis", "Emma", "Nathan", "Manon", "Lucas", "Camille", "Arthur",
  "Inès", "Gabriel", "Jade", "Raphaël", "Lina", "Adam", "Zoé", "Noah", "Alice", "Ethan",
  "Louise", "Tom", "Nina", "Maxime", "Sarah", "Antoine", "Clara", "Julien", "Marie", "Paul",
];

const LAST_NAMES = [
  "Bernard", "Dubois", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Garcia", "David",
  "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "André", "Mercier", "Dupont",
];

const DEPARTMENTS = [
  { department: "Ressources Humaines", titles: ["RH", "Talent Partner", "People"], metier: "Talent Partner RH" },
  { department: "Sales", titles: ["Commercial", "Account Manager", "SDR"], metier: "Commercial B2B" },
  { department: "Marketing", titles: ["Marketing", "Brand", "Content"], metier: "Marketing & marque employeur" },
  { department: "Learning", titles: ["L&D", "Formateur", "Learning"], metier: "Learning & Development" },
  { department: "Management", titles: ["Manager", "Team Lead", "Responsable"], metier: "Manager d’équipe" },
  { department: "Ops", titles: ["Ops", "PMO", "Chef de projet"], metier: "Chef de projet Ops" },
] as const;

type OverviewPayload = Record<string, unknown>;

export function shouldEnrichEdgebsDemo(orgId: string, viewerEmail: string | null): boolean {
  return orgId === EDGEBS_ORG_ID && isEdgebsDemoViewer(viewerEmail);
}

function slugEmail(first: string, last: string) {
  return `${first
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")}.${last.toLowerCase()}@edgebs-demo.fr`;
}

function enrichEmployeeResults(base: Record<string, unknown>, index: number): Record<string, unknown> {
  const diagnosticDone = Boolean(base.diagnostic_done);
  const idmc =
    typeof base.idmc_score === "number" ? base.idmc_score : diagnosticDone ? 54 + ((index * 6) % 28) : null;
  return {
    ...base,
    diagnostic_done: diagnosticDone,
    diagnostic_started: diagnosticDone || Boolean(base.diagnostic_started),
    idmc_score: idmc,
    disc_done: diagnosticDone,
    soft_skills_done: diagnosticDone,
    disc_profile: diagnosticDone ? ["Dominant", "Influent", "Stable", "Conforme"][index % 4] : null,
    soft_skills_top: diagnosticDone
      ? ["Communication", "Collaboration", "Résilience", "Leadership"].slice(0, 2 + (index % 2))
      : [],
    metier: base.metier ?? DEPARTMENTS[index % DEPARTMENTS.length]!.metier,
    last_entretien: {
      type: index % 3 === 0 ? "bilan_annuel" : "entretien_individuel",
      label: index % 3 === 0 ? "Bilan annuel 2026" : "Entretien individuel",
      date: new Date(Date.now() - (15 + (index % 40)) * 86400000).toISOString().slice(0, 10),
      status: "réalisé",
    },
    entretiens_count: diagnosticDone ? 1 + (index % 3) : index % 2,
  };
}

function buildFillerEmployee(index: number): Record<string, unknown> {
  const first = FIRST_NAMES[index % FIRST_NAMES.length]!;
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]!;
  const dept = DEPARTMENTS[index % DEPARTMENTS.length]!;
  const title = dept.titles[index % dept.titles.length]!;
  const diagnosticDone = index < DEMO_DIAGNOSTICS_COMPLETED;
  return enrichEmployeeResults(
    {
      id: `edgebs-demo-emp-${index + 1}`,
      first_name: first,
      last_name: last,
      email: slugEmail(first, last),
      job_title: title,
      department: dept.department,
      metier: dept.metier,
      diagnostic_done: diagnosticDone,
      diagnostic_started: diagnosticDone,
      formation_active: index % 3 !== 2,
      demo_note: diagnosticDone ? "Profil enrichi démo EDGE" : "Diagnostic à compléter",
    },
    index,
  );
}

export function enrichEdgebsDemoOverview(payload: OverviewPayload): OverviewPayload {
  const employees = (payload.employees as Array<Record<string, unknown>>) ?? [];
  const kpis = (payload.kpis as Record<string, unknown>) ?? {};
  const formations = (payload.formations as Record<string, unknown>) ?? {};

  const employeesTotal = Math.max(Number(kpis.employees_total ?? 0), DEMO_EMPLOYEES_TOTAL);
  const diagnosticsCompleted = Math.max(
    Number(kpis.diagnostics_completed ?? 0),
    DEMO_DIAGNOSTICS_COMPLETED,
  );

  const namedHighlights: Array<Record<string, unknown>> = [
    {
      id: "edgebs-demo-clara",
      first_name: "Clara",
      last_name: "Martin",
      email: "clara.martin@edgebs-demo.fr",
      job_title: "Talent Partner",
      department: "Ressources Humaines",
      metier: "Talent Partner RH",
      diagnostic_done: true,
      diagnostic_started: true,
      idmc_score: 74,
      formation_active: true,
      demo_note: "Parcours IA recommandé",
    },
    {
      id: "edgebs-demo-alex",
      first_name: "Alex",
      last_name: "Martin",
      email: "demosalarie@edgebs.fr",
      job_title: "Account Manager",
      department: "Sales",
      metier: "Commercial B2B",
      diagnostic_done: true,
      diagnostic_started: true,
      idmc_score: 68,
      formation_active: true,
      demo_note: "Compte démo salarié",
    },
    {
      id: "edgebs-demo-julie",
      first_name: "Julie",
      last_name: "Morel",
      email: "julie.morel@edgebs-demo.fr",
      job_title: "L&D",
      department: "Learning",
      metier: "Learning & Development",
      diagnostic_done: true,
      idmc_score: 71,
      formation_active: true,
      demo_note: "Badge Communication",
    },
    {
      id: "edgebs-demo-thomas",
      first_name: "Thomas",
      last_name: "Leroy",
      email: "thomas.leroy@edgebs-demo.fr",
      job_title: "Manager",
      department: "Management",
      metier: "Manager d’équipe",
      diagnostic_done: true,
      idmc_score: 76,
      formation_active: true,
      demo_note: "Parcours Leadership",
    },
    {
      id: "edgebs-demo-sarah",
      first_name: "Sarah",
      last_name: "Petit",
      email: "sarah.petit@edgebs-demo.fr",
      job_title: "Marketing",
      department: "Marketing",
      metier: "Marketing & marque employeur",
      diagnostic_done: true,
      idmc_score: 63,
      formation_active: true,
      demo_note: "Parcours Productivité IA",
    },
  ].map((row, i) => enrichEmployeeResults(row, i));

  const mergedEmployees = [...employees];
  for (const highlight of namedHighlights) {
    const idx = mergedEmployees.findIndex(
      (e) => e.email === highlight.email || e.id === highlight.id,
    );
    if (idx >= 0) mergedEmployees[idx] = enrichEmployeeResults({ ...mergedEmployees[idx], ...highlight }, idx);
    else mergedEmployees.unshift(highlight);
  }

  let fillerIndex = 0;
  while (mergedEmployees.length < employeesTotal) {
    mergedEmployees.push(buildFillerEmployee(fillerIndex));
    fillerIndex += 1;
  }

  const enrichedList = mergedEmployees.slice(0, employeesTotal).map((e, i) => enrichEmployeeResults(e, i));

  const equipeInsight = {
    week_end: new Date().toISOString().slice(0, 10),
    insight:
      "EDGE Business Demo — organisation structurée. Priorités : IA métier, leadership managers, accélération Modern Prospecting.",
    idmc: 69,
    stress: 54,
    cohesion: 74,
    insufficient: false,
    completed: diagnosticsCompleted,
    threshold: 5,
    maturity_label: "Organisation structurée",
    team_score: 69,
    skills_evolution_6m: [
      { month: "Jan", score: 58 },
      { month: "Fév", score: 61 },
      { month: "Mar", score: 63 },
      { month: "Avr", score: 65 },
      { month: "Mai", score: 67 },
      { month: "Juin", score: 69 },
    ],
    critical_skills: ["IA métier", "Leadership", "Prospection moderne"],
    ai_recommendations: [
      "Activer le parcours IA Productivité pour 8 collaborateurs",
      "Attribuer Modern Prospecting à l’équipe Sales",
      "Planifier un module Leadership pour les managers",
    ],
    recent_badges: [
      { name: "Modern Prospecting", employee: "Alex Martin" },
      { name: "Communication", employee: "Julie Morel" },
      { name: "AI Prompting", employee: "Clara Martin" },
    ],
    priority_alerts: [
      { level: "attention", text: "6 collaborateurs avec entretien à programmer" },
      { level: "info", text: "39 diagnostics complets · 11 badges ce trimestre" },
      { level: "critical", text: "Écart IA métier sur Marketing" },
    ],
  };

  const presentielExisting = Array.isArray(formations.presentiel) ? formations.presentiel : [];
  const elearningExisting = Array.isArray(formations.elearning) ? formations.elearning : [];

  return {
    ...payload,
    demo_enriched: true,
    organisation: {
      ...((payload.organisation as Record<string, unknown>) ?? {}),
      name: "EDGE Business Demo",
    },
    kpis: {
      ...kpis,
      employees_total: employeesTotal,
      diagnostics_completed: diagnosticsCompleted,
      diagnostics_total: employeesTotal,
      diagnostics_pct: Math.round((diagnosticsCompleted / employeesTotal) * 100),
      enrollments_active: Math.max(Number(kpis.enrollments_active ?? 0), 24),
      badges_awarded: Math.max(Number(kpis.badges_awarded ?? 0), 16),
      team_score: 69,
      maturity_label: "Organisation structurée",
      entretiens_realises: 31,
      attention_signals: {
        insufficient: false,
        attention: 3,
        critical: 1,
      },
    },
    employees: enrichedList,
    collaborators_preview: enrichedList.slice(0, 5),
    formations: {
      presentiel:
        presentielExisting.length > 0 ? presentielExisting : [...EDGEBS_DEMO_FORMATIONS.presentiel],
      elearning:
        elearningExisting.length > 0 ? elearningExisting : [...EDGEBS_DEMO_FORMATIONS.elearning],
    },
    mobility: {
      ...((payload.mobility as Record<string, unknown>) ?? {}),
      enabled: true,
      completed: diagnosticsCompleted,
      threshold: 10,
    },
    metiers_preview: [
      { title: "Commercial B2B", headcount: 10 },
      { title: "Manager d’équipe", headcount: 7 },
      { title: "Talent Partner RH", headcount: 5 },
      { title: "Learning & Development", headcount: 4 },
    ],
    equipe_insight: {
      ...((payload.equipe_insight as Record<string, unknown>) ?? {}),
      ...equipeInsight,
    },
    this_week: {
      ...((payload.this_week as Record<string, unknown>) ?? {}),
      recent_activity: [
        { id: "edgebs-act-1", title: "Entretien individuel — Clara Martin", at: new Date().toISOString(), kind: "entretien" },
        { id: "edgebs-act-2", title: "Badge Modern Prospecting — Alex Martin", at: new Date().toISOString(), kind: "badge" },
        { id: "edgebs-act-3", title: "Diagnostic complété — Sarah Petit", at: new Date().toISOString(), kind: "diagnostic" },
        { id: "edgebs-act-4", title: "Parcours IA démarré — Thomas Leroy", at: new Date().toISOString(), kind: "course" },
        ...(((payload.this_week as Record<string, unknown>)?.recent_activity as unknown[]) ?? []),
      ],
    },
  };
}
