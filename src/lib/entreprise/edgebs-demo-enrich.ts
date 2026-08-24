/** Enrichit le payload overview EDGE Business Demo. */

import {
  EDGEBS_DEMO_FORMATIONS,
  EDGEBS_DEMO_METIERS,
  EDGEBS_ORG_ID,
  isEdgebsDemoViewer,
} from "@/lib/entreprise/edgebs-demo-data";
import {
  computeSoftSkillGaps,
  parseMetierSoftSkillTargets,
} from "@/lib/entreprise/metier-skill-gaps";
import { AXES_LABELS, IDMC_AXIS_KEYS, type AxisKey } from "@/lib/idmc/idmc-display";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

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
  const metierTitle = String(base.metier ?? DEPARTMENTS[index % DEPARTMENTS.length]!.metier);
  const metier =
    EDGEBS_DEMO_METIERS.find((role) => role.title === metierTitle) ?? EDGEBS_DEMO_METIERS[index % EDGEBS_DEMO_METIERS.length]!;
  const targets = parseMetierSoftSkillTargets([...metier.soft_skills]);
  return {
    ...base,
    diagnostic_done: diagnosticDone,
    diagnostic_started: diagnosticDone || Boolean(base.diagnostic_started),
    idmc_score: idmc,
    disc_done: diagnosticDone,
    soft_skills_done: diagnosticDone,
    disc_profile: diagnosticDone ? ["Dominant", "Influent", "Stable", "Conforme"][index % 4] : null,
    soft_skills_top: diagnosticDone
      ? targets.slice(0, 2 + (index % 2)).map((t) => t.label)
      : [],
    metier: metierTitle,
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

export function isEdgebsDemoEmployeeId(id: string | null | undefined): boolean {
  return Boolean(id && String(id).startsWith("edgebs-demo-"));
}

function namedDemoHighlights(): Array<Record<string, unknown>> {
  return [
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
}

/** Liste complète des collaborateurs démo (highlights + fillers). */
export function listEdgebsDemoEmployees(baseEmployees: Array<Record<string, unknown>> = []): Array<Record<string, unknown>> {
  const namedHighlights = namedDemoHighlights();
  const mergedEmployees = [...baseEmployees];
  for (const highlight of namedHighlights) {
    const idx = mergedEmployees.findIndex(
      (e) => e.email === highlight.email || e.id === highlight.id,
    );
    if (idx >= 0) mergedEmployees[idx] = enrichEmployeeResults({ ...mergedEmployees[idx], ...highlight }, idx);
    else mergedEmployees.unshift(highlight);
  }

  let fillerIndex = 0;
  while (mergedEmployees.length < DEMO_EMPLOYEES_TOTAL) {
    mergedEmployees.push(buildFillerEmployee(fillerIndex));
    fillerIndex += 1;
  }

  return mergedEmployees.slice(0, DEMO_EMPLOYEES_TOTAL).map((e, i) => enrichEmployeeResults(e, i));
}

export function getEdgebsDemoEmployeeById(id: string): Record<string, unknown> | null {
  if (!isEdgebsDemoEmployeeId(id)) return null;
  return listEdgebsDemoEmployees().find((e) => String(e.id) === id) ?? null;
}

function findDemoMetierForEmployee(employee: Record<string, unknown>) {
  const metier = String(employee.metier ?? "").trim();
  const jobTitle = String(employee.job_title ?? "").trim();
  return (
    EDGEBS_DEMO_METIERS.find((role) => role.title === metier) ??
    EDGEBS_DEMO_METIERS.find(
      (role) =>
        role.title.toLowerCase().includes(jobTitle.toLowerCase()) ||
        jobTitle.toLowerCase().includes(role.title.toLowerCase().split(" ")[0] ?? ""),
    ) ??
    EDGEBS_DEMO_METIERS[0]!
  );
}

function buildDemoDisc(index: number) {
  const profiles = [
    { D: 42, I: 28, S: 18, C: 12, label: "Décisionnel" },
    { D: 18, I: 44, S: 22, C: 16, label: "Relationnel" },
    { D: 14, I: 20, S: 46, C: 20, label: "Stable" },
    { D: 16, I: 18, S: 24, C: 42, label: "Structuré" },
  ] as const;
  const profile = profiles[index % profiles.length]!;
  return {
    D: profile.D + (index % 5),
    I: profile.I + ((index * 2) % 5),
    S: profile.S + ((index * 3) % 4),
    C: profile.C + ((index * 4) % 4),
    label: profile.label,
  };
}

function buildDemoIdmcAxes(index: number): Record<AxisKey, number> {
  const axes = {} as Record<AxisKey, number>;
  IDMC_AXIS_KEYS.forEach((key, axisIndex) => {
    axes[key] = Math.max(
      38,
      Math.min(96, 52 + ((index * 5 + axisIndex * 9) % 40) - (axisIndex % 3 === 0 ? 12 : 0)),
    );
  });
  return axes;
}

function buildDemoSoftSkills(index: number): Array<{ skill: string; score: number }> {
  return SOFT_SKILLS.map((skill, skillIndex) => {
    const pattern = (index + skillIndex) % 7;
    const delta =
      pattern === 0
        ? 14
        : pattern === 1
          ? 8
          : pattern === 2
            ? 2
            : pattern === 3
              ? -4
              : pattern === 4
                ? -10
                : pattern === 5
                  ? -16
                  : -22;
    return {
      skill: skill.titre,
      score: Math.max(32, Math.min(98, 72 + delta + ((index + skillIndex) % 5))),
    };
  }).sort((a, b) => b.score - a.score);
}

/** Payload fiche collaborateur compatible avec /api/.../employees/[id]. */
export function buildEdgebsDemoEmployeeDetailPayload(id: string) {
  const employee = getEdgebsDemoEmployeeById(id);
  if (!employee) return null;

  const index = Number(String(id).replace(/\D/g, "")) || 1;
  const forcedDone = Boolean(employee.diagnostic_done);
  const metier = findDemoMetierForEmployee(employee);
  const targets = parseMetierSoftSkillTargets([...metier.soft_skills]);
  const softSkills = forcedDone ? buildDemoSoftSkills(index) : [];
  const disc = forcedDone ? buildDemoDisc(index) : null;
  const idmcAxes = forcedDone ? buildDemoIdmcAxes(index) : null;
  const idmc =
    typeof employee.idmc_score === "number"
      ? employee.idmc_score
      : idmcAxes
        ? Math.round(
            IDMC_AXIS_KEYS.reduce((sum, key) => sum + idmcAxes[key], 0) / IDMC_AXIS_KEYS.length,
          )
        : null;
  const stressSkill = softSkills.find((s) => /gestion du stress/i.test(s.skill));
  const stress = forcedDone ? stressSkill?.score ?? 45 + ((index * 7) % 35) : null;

  const diagnostics = forcedDone
    ? [
        {
          id: `${id}-diag-1`,
          employee_id: id,
          created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
          idmc_score: idmc,
          results: { stress },
          source: "edgebs_demo" as const,
        },
      ]
    : [];

  const skillGaps = computeSoftSkillGaps(targets, softSkills);
  const criticalGaps = skillGaps.filter((g) => g.status === "critical" || g.status === "attention");

  return {
    employee: {
      id,
      first_name: employee.first_name ?? null,
      last_name: employee.last_name ?? null,
      email: employee.email ?? null,
      phone: `06 ${String(40 + (index % 50)).padStart(2, "0")} ${String(10 + (index % 80)).padStart(2, "0")} ${String(20 + (index % 70)).padStart(2, "0")} ${String(30 + (index % 60)).padStart(2, "0")}`,
      hire_date: new Date(Date.now() - (400 + (index % 900)) * 86400000).toISOString().slice(0, 10),
      job_title: employee.job_title ?? null,
      department: employee.department ?? null,
      metier: metier.title,
      profile_id: null,
      company_id: EDGEBS_ORG_ID,
      created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    },
    diagnostics,
    test_results: forcedDone
      ? {
          disc: disc ? { D: disc.D, I: disc.I, S: disc.S, C: disc.C } : null,
          behavioral_profile: disc?.label ?? null,
          idmc_score: idmc,
          idmc_axes: idmcAxes,
          soft_skills: softSkills,
        }
      : {
          disc: null,
          behavioral_profile: null,
          idmc_score: null,
          idmc_axes: null,
          soft_skills: [],
        },
    test_status: {
      has_disc: forcedDone,
      has_idmc: forcedDone,
      has_soft_skills: forcedDone,
      all_tests_done: forcedDone,
      share_consent: true,
    },
    pending_share_consent: false,
    has_diagnostics: forcedDone,
    recommended_action: forcedDone
      ? {
          id: `${id}-action`,
          title:
            criticalGaps[0] != null
              ? `Renforcer « ${criticalGaps[0].skill} »`
              : "Parcours de développement recommandé",
          dimension_key: "communication",
          description:
            criticalGaps[0] != null
              ? `Écart de ${Math.abs(criticalGaps[0].gap ?? 0)} pts vs cible métier ${metier.title}.`
              : String(employee.demo_note ?? "Action prioritaire démo EDGE"),
        }
      : null,
    metier_match: {
      id: metier.id,
      title: metier.title,
      hard_skills: [...metier.hard_skills],
      soft_skill_targets: targets,
      soft_skill_gaps: skillGaps,
    },
    profile_analysis: forcedDone
      ? {
          strengths: softSkills
            .filter((s) => s.score >= 78)
            .slice(0, 4)
            .map((s) => `${s.skill} solide (${s.score}/100)`),
          improvements: [
            ...skillGaps
              .filter((g) => g.status === "critical" || g.status === "attention")
              .slice(0, 2)
              .map((g) =>
                g.gap != null
                  ? `${g.skill} : ${g.actual}/100 vs cible ${g.target} (écart ${g.gap})`
                  : `${g.skill} non mesuré`,
              ),
            ...(idmcAxes
              ? IDMC_AXIS_KEYS.filter((key) => idmcAxes[key] < 55)
                  .slice(0, 2)
                  .map((key) => `${AXES_LABELS[key]} (IDMC ${idmcAxes[key]}/100) à renforcer`)
              : []),
          ].slice(0, 4),
          summary: `Profil comportemental « ${disc?.label ?? "—"} » · IDMC ${idmc ?? "—"}/100 sur 8 axes · ${softSkills.length} soft skills mesurées. Comparaison avec « ${metier.title} ».`,
          updatedAt: new Date().toISOString(),
          cached: true,
        }
      : null,
    missions: forcedDone
      ? [
          {
            id: `${id}-mission-1`,
            title: "Compléter le parcours soft skills prioritaire",
            description: criticalGaps[0]
              ? `Focus sur ${criticalGaps[0].skill} vs cible métier.`
              : "Consolider les forces identifiées au diagnostic.",
            due_date: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
            status: "in_progress",
            created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
      : [],
    hr_documents: [
      {
        id: `${id}-doc-1`,
        document_type: "entretien_individuel",
        title: "Entretien individuel Q1",
        document_date: new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10),
        notes: JSON.stringify({
          kind: "entretien_v1",
          participants: `${employee.first_name ?? "Collaborateur"} ${employee.last_name ?? ""}, Clara Martin (RH)`.trim(),
          location: "Salle Horizon / Visio",
          time: "10:30",
          employee_feedback: "Souhaite plus de clarté sur les priorités et un accompagnement soft skills.",
          hr_feedback: "Alignement métier confirmé. Plan de développement à activer sur les écarts identifiés.",
          extra_notes: "",
        }),
        file_url: null,
        file_name: null,
        created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
      {
        id: `${id}-doc-2`,
        document_type: "bilan_annuel",
        title: "Bilan annuel 2025",
        document_date: new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10),
        notes: JSON.stringify({
          kind: "entretien_v1",
          participants: `${employee.first_name ?? "Collaborateur"} ${employee.last_name ?? ""}, Manager, RH`.trim(),
          location: "Bureau direction",
          time: "15:00",
          employee_feedback: "Bilan positif, demande de formation IA métier.",
          hr_feedback: "Objectifs atteints. Recommandation : parcours IA + suivi trimestriel.",
          extra_notes: "",
        }),
        file_url: null,
        file_name: null,
        created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
      },
    ],
    demo: true,
  };
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

  const enrichedList = listEdgebsDemoEmployees(employees).slice(0, employeesTotal);

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
      {
        level: "critical",
        text: "Sarah Petit — écart fort sur IA métier vs fiche Marketing (−22 pts)",
        employee_id: "edgebs-demo-sarah",
      },
      {
        level: "critical",
        text: "Alex Martin — écart négociation avancée vs cible Commercial B2B (−18 pts)",
        employee_id: "edgebs-demo-alex",
      },
      {
        level: "attention",
        text: "6 collaborateurs avec entretien à programmer",
        href: "/dashboard/entreprise/salaries",
      },
      {
        level: "attention",
        text: "Thomas Leroy — leadership sous la cible Manager (−12 pts)",
        employee_id: "edgebs-demo-thomas",
      },
    ],
    recommended_actions: [
      {
        id: "act-ia",
        title: "Activer le parcours IA Productivité",
        detail: "8 collaborateurs Marketing / Ops sous la cible IA métier",
        href: "/dashboard/entreprise/formations/demander",
      },
      {
        id: "act-sales",
        title: "Attribuer Modern Prospecting à l’équipe Sales",
        detail: "Combler l’écart négociation / prospection moderne",
        href: "/dashboard/entreprise/formations/catalogue",
      },
      {
        id: "act-lead",
        title: "Planifier un module Leadership managers",
        detail: "Écarts leadership détectés sur 3 managers",
        href: "/dashboard/entreprise/formations/demander",
      },
      {
        id: "act-entretiens",
        title: "Programmer les entretiens en retard",
        detail: "6 collaborateurs concernés",
        href: "/dashboard/entreprise/salaries",
      },
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
