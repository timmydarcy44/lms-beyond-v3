/** Enrichit le payload overview Nutriset pour les présentations démo. */

import {
  NUTRISET_DEMO_FORMATIONS,
  NUTRISET_ORG_ID,
  isNutrisetDemoViewer,
} from "@/lib/entreprise/nutriset-demo-data";

/** Cible démo : 50 collaborateurs au total sur le dashboard. */
const DEMO_EMPLOYEES_TOTAL = 50;
const DEMO_DIAGNOSTICS_COMPLETED = 42;

const FIRST_NAMES = [
  "Léa", "Hugo", "Chloé", "Louis", "Emma", "Nathan", "Manon", "Lucas", "Camille", "Arthur",
  "Inès", "Gabriel", "Jade", "Raphaël", "Lina", "Adam", "Zoé", "Noah", "Alice", "Ethan",
  "Louise", "Tom", "Nina", "Maxime", "Sarah", "Antoine", "Clara", "Julien", "Marie", "Paul",
];

const LAST_NAMES = [
  "Bernard", "Dubois", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Garcia", "David",
  "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "André", "Mercier", "Dupont",
  "Lambert", "Bonnet", "François", "Martinez", "Legrand", "Garnier", "Faure",
];

const DEPARTMENTS = [
  { department: "Ressources Humaines", titles: ["RH", "Chargé RH", "Talent Manager"], metier: "Talent Manager RH" },
  { department: "Sales", titles: ["Commercial", "Account Manager", "Sales"], metier: "Commercial terrain" },
  { department: "Marketing", titles: ["Marketing", "Brand Manager", "Content"], metier: "Marketing digital" },
  { department: "Formation", titles: ["Formateur", "Ingénieur pédagogique", "Learning"], metier: "Ingénieur pédagogique" },
  { department: "Management", titles: ["Manager", "Team Lead", "Responsable d’équipe"], metier: "Manager d’équipe" },
  { department: "Ops", titles: ["Ops", "Coordinateur", "Chef de projet"], metier: "Chef de projet Ops" },
  { department: "Finance", titles: ["Comptable", "Contrôleur de gestion", "Finance"], metier: "Chef de projet Ops" },
  { department: "IT", titles: ["IT Support", "Data Analyst", "Product"], metier: "Chef de projet Ops" },
] as const;

type OverviewPayload = Record<string, unknown>;

export function shouldEnrichNutrisetDemo(orgId: string, viewerEmail: string | null): boolean {
  return orgId === NUTRISET_ORG_ID && isNutrisetDemoViewer(viewerEmail);
}

function slugEmail(first: string, last: string) {
  return `${first.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${last.toLowerCase()}@nutriset-demo.fr`;
}

function enrichEmployeeResults(base: Record<string, unknown>, index: number): Record<string, unknown> {
  const diagnosticDone = Boolean(base.diagnostic_done);
  const idmc = typeof base.idmc_score === "number" ? base.idmc_score : diagnosticDone ? 52 + ((index * 7) % 28) : null;
  const entretienDaysAgo = 20 + (index % 40);
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
      date: new Date(Date.now() - entretienDaysAgo * 86400000).toISOString().slice(0, 10),
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
      id: `demo-emp-${index + 1}`,
      first_name: first,
      last_name: last,
      email: slugEmail(first, last),
      job_title: title,
      department: dept.department,
      metier: dept.metier,
      diagnostic_done: diagnosticDone,
      diagnostic_started: diagnosticDone || index % 5 === 0,
      idmc_score: diagnosticDone ? 52 + ((index * 7) % 28) : null,
      formation_active: index % 3 !== 2,
      demo_note: diagnosticDone ? "Profil enrichi démo" : "Diagnostic à compléter",
    },
    index,
  );
}

export function enrichNutrisetDemoOverview(payload: OverviewPayload): OverviewPayload {
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
      id: "demo-clara",
      first_name: "Clara",
      last_name: "Martin",
      email: "clara.martin@nutriset-demo.fr",
      job_title: "RH",
      department: "Ressources Humaines",
      metier: "Talent Manager RH",
      diagnostic_done: true,
      diagnostic_started: true,
      idmc_score: 74,
      formation_active: true,
      demo_note: "Parcours IA recommandé",
    },
    {
      id: "67a7f459-0af6-44a2-a9a7-058c502f5a26",
      first_name: "Paul",
      last_name: "Darcy",
      email: "paullearning14@gmail.com",
      job_title: "Sales",
      department: "Sales",
      metier: "Commercial terrain",
      diagnostic_done: true,
      diagnostic_started: true,
      idmc_score: 58,
      formation_active: true,
      demo_note: "Badge Modern Prospecting",
    },
    {
      id: "demo-julie",
      first_name: "Julie",
      last_name: "Morel",
      email: "julie.morel@nutriset-demo.fr",
      job_title: "Formatrice",
      department: "Formation",
      metier: "Ingénieur pédagogique",
      diagnostic_done: true,
      idmc_score: 69,
      formation_active: true,
      demo_note: "Badge Communication",
    },
    {
      id: "demo-thomas",
      first_name: "Thomas",
      last_name: "Leroy",
      email: "thomas.leroy@nutriset-demo.fr",
      job_title: "Manager",
      department: "Management",
      metier: "Manager d’équipe",
      diagnostic_done: true,
      idmc_score: 76,
      formation_active: true,
      demo_note: "Parcours Leadership",
    },
    {
      id: "demo-sarah",
      first_name: "Sarah",
      last_name: "Petit",
      email: "sarah.petit@nutriset-demo.fr",
      job_title: "Marketing",
      department: "Marketing",
      metier: "Marketing digital",
      diagnostic_done: true,
      diagnostic_started: true,
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

  const enrichedList = mergedEmployees.slice(0, employeesTotal).map((e, i) =>
    enrichEmployeeResults(e, i),
  );

  const equipeInsight = {
    week_end: new Date().toISOString().slice(0, 10),
    insight:
      "Organisation structurée — 3 écarts critiques détectés sur l'IA métier et le leadership. 2 parcours prioritaires recommandés.",
    idmc: 67,
    stress: 58,
    cohesion: 72,
    insufficient: false,
    completed: diagnosticsCompleted,
    threshold: 5,
    maturity_label: "Organisation structurée",
    team_score: 67,
    skills_evolution_6m: [
      { month: "Jan", score: 58 },
      { month: "Fév", score: 60 },
      { month: "Mar", score: 62 },
      { month: "Avr", score: 64 },
      { month: "Mai", score: 65 },
      { month: "Juin", score: 67 },
    ],
    critical_skills: ["IA métier", "Leadership inter-équipes", "Communication client"],
    ai_recommendations: [
      "Activer le parcours IA Productivité pour 6 collaborateurs",
      "Attribuer le badge Modern Prospecting à l'équipe Sales",
      "Planifier un module Leadership pour les managers",
    ],
    recent_badges: [
      { name: "Modern Prospecting", employee: "Paul Darcy" },
      { name: "Communication", employee: "Julie Morel" },
      { name: "AI Prompting", employee: "Clara Martin" },
    ],
    priority_alerts: [
      { level: "attention", text: "8 collaborateurs avec entretien à programmer" },
      { level: "info", text: "42 diagnostics complets · 8 badges ce trimestre" },
      { level: "critical", text: "Écart IA métier sur l'équipe Marketing" },
    ],
  };

  const presentielExisting = Array.isArray(formations.presentiel) ? formations.presentiel : [];
  const elearningExisting = Array.isArray(formations.elearning) ? formations.elearning : [];

  return {
    ...payload,
    demo_enriched: true,
    kpis: {
      ...kpis,
      employees_total: employeesTotal,
      diagnostics_completed: diagnosticsCompleted,
      diagnostics_total: employeesTotal,
      diagnostics_pct: Math.round((diagnosticsCompleted / employeesTotal) * 100),
      enrollments_active: Math.max(Number(kpis.enrollments_active ?? 0), 22),
      badges_awarded: Math.max(Number(kpis.badges_awarded ?? 0), 14),
      team_score: 67,
      maturity_label: "Organisation structurée",
      entretiens_realises: 36,
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
        presentielExisting.length > 0 ? presentielExisting : [...NUTRISET_DEMO_FORMATIONS.presentiel],
      elearning:
        elearningExisting.length > 0 ? elearningExisting : [...NUTRISET_DEMO_FORMATIONS.elearning],
    },
    mobility: {
      ...((payload.mobility as Record<string, unknown>) ?? {}),
      enabled: true,
      completed: diagnosticsCompleted,
      threshold: 10,
    },
    metiers_preview: [
      { title: "Commercial terrain", headcount: 9 },
      { title: "Manager d’équipe", headcount: 7 },
      { title: "Talent Manager RH", headcount: 5 },
      { title: "Marketing digital", headcount: 6 },
    ],
    equipe_insight: {
      ...((payload.equipe_insight as Record<string, unknown>) ?? {}),
      ...equipeInsight,
    },
    this_week: {
      ...((payload.this_week as Record<string, unknown>) ?? {}),
      recent_activity: [
        { id: "act-1", title: "Entretien individuel — Clara Martin", at: new Date().toISOString(), kind: "entretien" },
        { id: "act-2", title: "Badge Modern Prospecting — Paul Darcy", at: new Date().toISOString(), kind: "badge" },
        { id: "act-3", title: "Diagnostic complété — Sarah Petit", at: new Date().toISOString(), kind: "diagnostic" },
        { id: "act-4", title: "Parcours IA démarré — Thomas Leroy", at: new Date().toISOString(), kind: "course" },
        ...(((payload.this_week as Record<string, unknown>)?.recent_activity as unknown[]) ?? []),
      ],
    },
  };
}
