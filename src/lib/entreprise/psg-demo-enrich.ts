/** Enrichit le payload overview PSG pour les présentations démo. */

import {
  PSG_DEMO_FORMATIONS,
  PSG_ORG_ID,
  isPsgDemoViewer,
} from "@/lib/entreprise/psg-demo-data";

const DEMO_EMPLOYEES_TOTAL = 64;
const DEMO_DIAGNOSTICS_COMPLETED = 51;

const FIRST_NAMES = [
  "Kylian", "Presnel", "Marquinhos", "Vitinha", "Achraf", "Ousmane", "Warren", "Lee",
  "Khvicha", "Bradley", "Nuno", "Gianluigi", "Lucas", "Fabián", "Randal", "Désiré",
  "Camille", "Léa", "Hugo", "Inès", "Nathan", "Manon", "Arthur", "Zoé", "Emma", "Louis",
];

const LAST_NAMES = [
  "Moreau", "Bernard", "Lefebvre", "Garcia", "Dubois", "Martin", "Roux", "Petit",
  "Laurent", "Simon", "Michel", "Leroy", "Morel", "Fournier", "Girard", "Bonnet",
];

const DEPARTMENTS = [
  { department: "Performance", titles: ["Analyste perf.", "Data sport", "Vidéo"], metier: "Analyste performance" },
  { department: "Médical", titles: ["Kinésithérapeute", "Prépa physique", "Médecin"], metier: "Staff médical / récupération" },
  { department: "Academy", titles: ["Éducateur", "Référent U19", "Scooting"], metier: "Éducateur Academy" },
  { department: "People", titles: ["RH Club", "Talent", "People Partner"], metier: "RH / People Club" },
  { department: "Operations", titles: ["Matchday Ops", "Sécurité", "Logistique"], metier: "Operations matchday" },
  { department: "Hospitalité", titles: ["VIP Host", "Partenariats", "Events"], metier: "Hospitalité & partenariats" },
] as const;

type OverviewPayload = Record<string, unknown>;

export function shouldEnrichPsgDemo(orgId: string, viewerEmail: string | null): boolean {
  return orgId === PSG_ORG_ID && isPsgDemoViewer(viewerEmail);
}

function slugEmail(first: string, last: string) {
  return `${first
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")}.${last.toLowerCase()}@psg-demo.fr`;
}

function enrichEmployeeResults(base: Record<string, unknown>, index: number): Record<string, unknown> {
  const diagnosticDone = Boolean(base.diagnostic_done);
  const idmc =
    typeof base.idmc_score === "number" ? base.idmc_score : diagnosticDone ? 55 + ((index * 5) % 30) : null;
  return {
    ...base,
    diagnostic_done: diagnosticDone,
    diagnostic_started: diagnosticDone || Boolean(base.diagnostic_started),
    idmc_score: idmc,
    disc_done: diagnosticDone,
    soft_skills_done: diagnosticDone,
    disc_profile: diagnosticDone ? ["Dominant", "Influent", "Stable", "Conforme"][index % 4] : null,
    soft_skills_top: diagnosticDone
      ? ["Leadership", "Résilience", "Communication", "Coopération"].slice(0, 2 + (index % 2))
      : [],
    metier: base.metier ?? DEPARTMENTS[index % DEPARTMENTS.length]!.metier,
    last_entretien: {
      type: index % 3 === 0 ? "bilan_annuel" : "entretien_individuel",
      label: index % 3 === 0 ? "Bilan annuel 2026" : "Entretien individuel",
      date: new Date(Date.now() - (12 + (index % 35)) * 86400000).toISOString().slice(0, 10),
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
      id: `psg-demo-emp-${index + 1}`,
      first_name: first,
      last_name: last,
      email: slugEmail(first, last),
      job_title: title,
      department: dept.department,
      metier: dept.metier,
      diagnostic_done: diagnosticDone,
      diagnostic_started: diagnosticDone || index % 4 === 0,
      idmc_score: diagnosticDone ? 55 + ((index * 5) % 30) : null,
      formation_active: index % 3 !== 2,
      demo_note: diagnosticDone ? "Profil enrichi démo PSG" : "Diagnostic à compléter",
    },
    index,
  );
}

export function enrichPsgDemoOverview(payload: OverviewPayload): OverviewPayload {
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
      id: "psg-demo-camille",
      first_name: "Camille",
      last_name: "Rousseau",
      email: "camille.rousseau@psg-demo.fr",
      job_title: "People Partner",
      department: "People",
      metier: "RH / People Club",
      diagnostic_done: true,
      diagnostic_started: true,
      idmc_score: 78,
      formation_active: true,
      demo_note: "Parcours Leadership staff",
    },
    {
      id: "psg-demo-amine",
      first_name: "Amine",
      last_name: "Benali",
      email: "amine.benali@psg-demo.fr",
      job_title: "Analyste perf.",
      department: "Performance",
      metier: "Analyste performance",
      diagnostic_done: true,
      idmc_score: 71,
      formation_active: true,
      demo_note: "Badge Data Sport",
    },
    {
      id: "psg-demo-lea",
      first_name: "Léa",
      last_name: "Martin",
      email: "lea.martin@psg-demo.fr",
      job_title: "VIP Host",
      department: "Hospitalité",
      metier: "Hospitalité & partenariats",
      diagnostic_done: true,
      idmc_score: 66,
      formation_active: true,
      demo_note: "Communication club",
    },
    {
      id: "psg-demo-hugo",
      first_name: "Hugo",
      last_name: "Petit",
      email: "hugo.petit@psg-demo.fr",
      job_title: "Éducateur U17",
      department: "Academy",
      metier: "Éducateur Academy",
      diagnostic_done: true,
      idmc_score: 73,
      formation_active: true,
      demo_note: "Mindset jeunes talents",
    },
    {
      id: "psg-demo-sarah",
      first_name: "Sarah",
      last_name: "Nguyen",
      email: "sarah.nguyen@psg-demo.fr",
      job_title: "Matchday Ops",
      department: "Operations",
      metier: "Operations matchday",
      diagnostic_done: true,
      idmc_score: 69,
      formation_active: true,
      demo_note: "Sécurité & protocoles",
    },
  ].map((row, i) => enrichEmployeeResults(row, i));

  const mergedEmployees = [...employees];
  for (const highlight of namedHighlights) {
    const idx = mergedEmployees.findIndex((e) => e.email === highlight.email || e.id === highlight.id);
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
      "Club haute performance — 4 écarts prioritaires sur leadership staff, communication media et récupération mentale. Parcours Academy et Matchday à accélérer.",
    idmc: 71,
    stress: 54,
    cohesion: 76,
    insufficient: false,
    completed: diagnosticsCompleted,
    threshold: 5,
    maturity_label: "Haute performance",
    team_score: 71,
    skills_evolution_6m: [
      { month: "Jan", score: 61 },
      { month: "Fév", score: 63 },
      { month: "Mar", score: 65 },
      { month: "Avr", score: 67 },
      { month: "Mai", score: 69 },
      { month: "Juin", score: 71 },
    ],
    critical_skills: ["Leadership staff", "Communication media", "Récupération mentale"],
    ai_recommendations: [
      "Lancer Soft skills haute performance pour le staff Academy",
      "Planifier Communication de crise media (12 places)",
      "Attribuer le parcours Mindset & récupération au staff médical",
    ],
    recent_badges: [
      { name: "Data Sport", employee: "Amine Benali" },
      { name: "Leadership staff", employee: "Camille Rousseau" },
      { name: "Matchday Ops", employee: "Sarah Nguyen" },
    ],
    priority_alerts: [
      { level: "attention", text: "11 collaborateurs avec entretien à programmer" },
      { level: "info", text: "51 diagnostics complets · 27 badges ce trimestre" },
      { level: "critical", text: "Écart communication media sur Hospitalité VIP" },
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
      enrollments_active: Math.max(Number(kpis.enrollments_active ?? 0), 34),
      badges_awarded: Math.max(Number(kpis.badges_awarded ?? 0), 27),
      team_score: 71,
      maturity_label: "Haute performance",
      entretiens_realises: 41,
      attention_signals: {
        insufficient: false,
        attention: 4,
        critical: 1,
      },
    },
    employees: enrichedList,
    collaborators_preview: enrichedList.slice(0, 5),
    formations: {
      presentiel:
        presentielExisting.length > 0 ? presentielExisting : [...PSG_DEMO_FORMATIONS.presentiel],
      elearning:
        elearningExisting.length > 0 ? elearningExisting : [...PSG_DEMO_FORMATIONS.elearning],
    },
    mobility: {
      ...((payload.mobility as Record<string, unknown>) ?? {}),
      enabled: true,
      completed: diagnosticsCompleted,
      threshold: 10,
    },
    metiers_preview: [
      { title: "Analyste performance", headcount: 11 },
      { title: "Éducateur Academy", headcount: 14 },
      { title: "Operations matchday", headcount: 9 },
      { title: "RH / People Club", headcount: 7 },
    ],
    equipe_insight: {
      ...((payload.equipe_insight as Record<string, unknown>) ?? {}),
      ...equipeInsight,
    },
    this_week: {
      ...((payload.this_week as Record<string, unknown>) ?? {}),
      recent_activity: [
        {
          id: "psg-act-1",
          title: "Entretien individuel — Camille Rousseau",
          at: new Date().toISOString(),
          kind: "entretien",
        },
        {
          id: "psg-act-2",
          title: "Badge Data Sport — Amine Benali",
          at: new Date().toISOString(),
          kind: "badge",
        },
        {
          id: "psg-act-3",
          title: "Diagnostic complété — Léa Martin",
          at: new Date().toISOString(),
          kind: "diagnostic",
        },
        {
          id: "psg-act-4",
          title: "Parcours Soft skills démarré — Hugo Petit",
          at: new Date().toISOString(),
          kind: "course",
        },
        ...(((payload.this_week as Record<string, unknown>)?.recent_activity as unknown[]) ?? []),
      ],
    },
  };
}
