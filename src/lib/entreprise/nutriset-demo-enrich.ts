/** Enrichit le payload overview Nutriset quand les KPI réels sont incomplets (démo visuels). */

const NUTRISET_ORG_ID = "163c8e74-b648-4792-9167-2b4031a888b3";

const DEMO_VIEWER_EMAILS = new Set([
  "timmydarcy44@gmail.com",
  "demo@entreprise.fr",
  "contact@edgebs.fr",
]);

type OverviewPayload = Record<string, unknown>;

export function shouldEnrichNutrisetDemo(orgId: string, viewerEmail: string | null): boolean {
  return orgId === NUTRISET_ORG_ID && Boolean(viewerEmail && DEMO_VIEWER_EMAILS.has(viewerEmail.toLowerCase()));
}

export function enrichNutrisetDemoOverview(payload: OverviewPayload): OverviewPayload {
  const employees = (payload.employees as Array<Record<string, unknown>>) ?? [];
  const kpis = (payload.kpis as Record<string, unknown>) ?? {};

  const employeesTotal = Math.max(Number(kpis.employees_total ?? 0), 24);
  const diagnosticsCompleted = Math.max(Number(kpis.diagnostics_completed ?? 0), 18);

  const namedHighlights: Array<Record<string, unknown>> = [
    {
      id: "demo-clara",
      first_name: "Clara",
      last_name: "Martin",
      email: "clara.martin@nutriset-demo.fr",
      job_title: "RH",
      department: "Ressources Humaines",
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
      diagnostic_done: false,
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
      diagnostic_done: false,
      diagnostic_started: false,
      idmc_score: null,
      formation_active: true,
      demo_note: "Parcours Productivité IA",
    },
  ];

  const mergedEmployees = [...employees];
  for (const highlight of namedHighlights) {
    const idx = mergedEmployees.findIndex(
      (e) => e.email === highlight.email || e.id === highlight.id,
    );
    if (idx >= 0) mergedEmployees[idx] = { ...mergedEmployees[idx], ...highlight };
    else mergedEmployees.unshift(highlight);
  }

  while (mergedEmployees.length < employeesTotal) {
    const n = mergedEmployees.length + 1;
    mergedEmployees.push({
      id: `demo-emp-${n}`,
      first_name: "Collaborateur",
      last_name: `${n}`,
      job_title: "—",
      department: "—",
      diagnostic_done: n <= diagnosticsCompleted,
      idmc_score: n <= diagnosticsCompleted ? 55 + (n % 20) : null,
      formation_active: n % 3 === 0,
    });
  }

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
      { level: "attention", text: "3 collaborateurs sans diagnostic complet" },
      { level: "info", text: "8 badges attribués ce trimestre" },
      { level: "critical", text: "Écart IA métier sur l'équipe Marketing" },
    ],
  };

  return {
    ...payload,
    demo_enriched: true,
    kpis: {
      ...kpis,
      employees_total: employeesTotal,
      diagnostics_completed: diagnosticsCompleted,
      diagnostics_total: employeesTotal,
      diagnostics_pct: Math.round((diagnosticsCompleted / employeesTotal) * 100),
      enrollments_active: Math.max(Number(kpis.enrollments_active ?? 0), 12),
      badges_awarded: 8,
      team_score: 67,
      maturity_label: "Organisation structurée",
      attention_signals: {
        insufficient: false,
        attention: 3,
        critical: 1,
      },
    },
    employees: mergedEmployees.slice(0, employeesTotal),
    collaborators_preview: mergedEmployees.slice(0, 5),
    equipe_insight: {
      ...((payload.equipe_insight as Record<string, unknown>) ?? {}),
      ...equipeInsight,
    },
    this_week: {
      ...((payload.this_week as Record<string, unknown>) ?? {}),
      recent_activity: [
        { id: "act-1", title: "Badge Modern Prospecting — Paul Darcy", at: new Date().toISOString(), kind: "badge" },
        { id: "act-2", title: "Diagnostic complété — Clara Martin", at: new Date().toISOString(), kind: "diagnostic" },
        { id: "act-3", title: "Parcours IA démarré — Sarah Petit", at: new Date().toISOString(), kind: "course" },
        ...(((payload.this_week as Record<string, unknown>)?.recent_activity as unknown[]) ?? []),
      ],
    },
  };
}
