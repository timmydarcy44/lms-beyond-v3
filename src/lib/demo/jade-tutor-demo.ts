import type { TutorAssignmentDetail, TutorWorkspacePayload } from "@/lib/tuteur/workspace-server";
import type { TutorFiche } from "@/lib/tuteur/tutor-fiche-server";
import type { TutorHomePayload, TutorWeekDay } from "@/lib/tuteur/tutor-home-server";

function monday(from = new Date()) {
  const date = new Date(from);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function plusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

const week = monday();
const today = dayKey(new Date());
const days: TutorWeekDay[] = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(week);
  date.setDate(week.getDate() + index);
  const key = dayKey(date);
  const weekend = index >= 5;
  const school = index === 0 || index === 1;
  return {
    date: key,
    label: date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
    lieu: weekend ? "weekend" : school ? "ecole" : "entreprise",
    absence: index === 3,
    today: key === today,
    schoolCount: school ? 4 : 0,
    companyCount: !weekend && !school ? 4 : 0,
  };
});

export const JADE_TUTOR_HOME: TutorHomePayload = {
  tutorFirstName: "Jade",
  tutorName: "Jade Martin",
  inCompanyToday: 2,
  counts: { validate: 2, evaluate: 1, sign: 1, writeCfa: 1, total: 5 },
  students: [
    {
      assignmentId: "a-lea",
      learnerId: "l-lea",
      firstName: "Léa",
      lastName: "Bernard",
      displayName: "Léa Bernard",
      formation: "Négociateur technico-commercial",
      email: "lea.bernard@example.com",
      phone: "06 12 45 78 90",
      rythme: "2 jours école / 3 jours entreprise",
      statut: "a_jour",
      signals: [],
      missionsValidees: 6,
      missionsTotal: 8,
      missionsAValider: 1,
      nextDeadline: "vendredi",
      todayPlace: "entreprise",
    },
    {
      assignmentId: "a-ines",
      learnerId: "l-ines",
      firstName: "Inès",
      lastName: "Morel",
      displayName: "Inès Morel",
      formation: "Négociateur technico-commercial",
      email: "ines.morel@example.com",
      phone: "06 18 22 40 11",
      rythme: "2 jours école / 3 jours entreprise",
      statut: "a_surveiller",
      signals: ["2 missions en retard", "Inactif sur la plateforme depuis 9 jours"],
      missionsValidees: 2,
      missionsTotal: 6,
      missionsAValider: 1,
      nextDeadline: "hier",
      todayPlace: "entreprise",
    },
    {
      assignmentId: "a-noah",
      learnerId: "l-noah",
      firstName: "Noah",
      lastName: "Petit",
      displayName: "Noah Petit",
      formation: "Négociateur technico-commercial",
      email: "noah.petit@example.com",
      phone: "06 44 10 28 63",
      rythme: "2 jours école / 3 jours entreprise",
      statut: "en_retard",
      signals: ["1 mission en retard"],
      missionsValidees: 3,
      missionsTotal: 7,
      missionsAValider: 0,
      nextDeadline: "lundi",
      todayPlace: "ecole",
    },
    {
      assignmentId: "a-tom",
      learnerId: "l-tom",
      firstName: "Tom",
      lastName: "Leroy",
      displayName: "Tom Leroy",
      formation: "Négociateur technico-commercial",
      email: "tom.garcia@example.com",
      phone: "06 70 15 33 08",
      rythme: "2 jours école / 3 jours entreprise",
      statut: "a_jour",
      signals: [],
      missionsValidees: 4,
      missionsTotal: 4,
      missionsAValider: 0,
      nextDeadline: null,
      todayPlace: "ecole",
    },
  ],
  actions: [
    {
      id: "act-val-lea",
      kind: "validation",
      title: "Valider · Compte rendu de prospection",
      subtitle: "Léa Bernard · déposé hier",
      dueAt: plusDays(2),
      missionId: "jm-lea-1",
      learnerId: "l-lea",
    },
    {
      id: "act-val-ines",
      kind: "validation",
      title: "Valider · Relance client",
      subtitle: "Inès Morel · échéance dépassée",
      dueAt: plusDays(-1),
      missionId: "jm-ines-1",
      learnerId: "l-ines",
    },
    {
      id: "act-eval",
      kind: "evaluation",
      title: "Évaluer · Point mensuel",
      subtitle: "Noah Petit",
      dueAt: plusDays(3),
      learnerId: "l-noah",
      href: "/dashboard/tuteur/formulaires/a-noah/f-mensuel",
    },
    {
      id: "act-sign",
      kind: "signature",
      title: "Signer · Livret de Léa",
      subtitle: "Léa Bernard",
      dueAt: plusDays(4),
      learnerId: "l-lea",
      href: "/dashboard/tuteur/livrets",
    },
    {
      id: "act-cfa",
      kind: "message",
      title: "Écrire au CFA · Inès Morel",
      subtitle: "2 missions en retard",
      dueAt: null,
      learnerId: "l-ines",
      href: "/dashboard/student/community",
    },
  ],
  deadlines: [
    { id: "d1", label: "Inès · Relance client", dateLabel: "Hier", at: plusDays(-1) },
    { id: "d2", label: "Léa · Compte rendu de prospection", dateLabel: "Vendredi", at: plusDays(2) },
    { id: "d3", label: "Noah · Point mensuel", dateLabel: "Lundi", at: plusDays(3) },
  ],
  week: { label: `Semaine du ${week.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`, days },
  watch: [
    {
      learnerId: "l-ines",
      name: "Inès Morel",
      signals: ["2 missions en retard", "Inactif sur la plateforme depuis 9 jours"],
    },
  ],
};

function ficheFrom(learnerId: string, shared: TutorFiche["shares"]): TutorFiche | null {
  const student = JADE_TUTOR_HOME.students.find((item) => item.learnerId === learnerId);
  if (!student) return null;
  const missions = [
    { id: `${learnerId}-m1`, title: "Compte rendu de prospection", status: "in_progress" as const, competency: "CCP1 · Prospecter", competencyCode: "CCP1" },
    { id: `${learnerId}-m2`, title: "Fichier de cibles", status: "done" as const, competency: "CCP1 · Prospecter", competencyCode: "CCP1" },
    { id: `${learnerId}-m3`, title: "Relance client", status: learnerId === "l-ines" ? "todo" as const : "done" as const, competency: "CCP2 · Négocier", competencyCode: "CCP2" },
  ];
  return {
    student,
    diploma: "Titre professionnel",
    promotion: "2025-2026",
    missions: missions.map((mission) => ({
      ...mission,
      dueDate: plusDays(learnerId === "l-ines" ? -2 : 4),
      completedAt: mission.status === "done" ? plusDays(-6) : null,
      instructions: "Compte rendu joint",
    })),
    interviews: [
      {
        id: `${learnerId}-int`,
        title: "Point mensuel",
        kind: "point",
        startsAt: plusDays(5),
        place: "Visio",
        status: "planned",
        report: null,
      },
    ],
    milestones: [
      { id: `${learnerId}-livret`, title: "Livret d'alternance", kind: "livret", dueOn: plusDays(12).slice(0, 10), doneAt: learnerId === "l-tom" ? plusDays(-2) : null },
    ],
    agendaDays: days.map((day) => ({ date: day.date, lieu: day.lieu, absence: day.absence && learnerId === "l-ines" })),
    shares: shared,
  };
}

const FICHES: Record<string, TutorFiche> = {
  "l-lea": ficheFrom("l-lea", [{ scope: "disc", grantedAt: plusDays(-12) }])!,
  "l-ines": ficheFrom("l-ines", [])!,
  "l-noah": ficheFrom("l-noah", [{ scope: "soft_skills", grantedAt: plusDays(-4) }])!,
  "l-tom": ficheFrom("l-tom", [{ scope: "idmc", grantedAt: plusDays(-20) }])!,
};

export function jadeTutorFiche(learnerId: string) {
  return FICHES[learnerId] ?? null;
}

export function jadeTutorResults(learnerId: string) {
  const fiche = FICHES[learnerId];
  if (!fiche) return null;
  const results: Record<string, unknown> = {};
  for (const share of fiche.shares) {
    if (share.scope === "disc") results.disc = { D: 18, I: 32, S: 24, C: 26 };
    if (share.scope === "idmc") results.idmc = { A1: 72, A2: 64, A3: 81, A4: 58, A5: 70, A6: 66, A7: 74, A8: 61 };
    if (share.scope === "soft_skills") results.soft_skills = { Écoute: 12, Adaptation: 11, Organisation: 9 };
  }
  return { shares: fiche.shares, results };
}

export const JADE_TUTOR_WORKSPACE: TutorWorkspacePayload = {
  tutorName: "Jade Martin",
  assignments: JADE_TUTOR_HOME.students.map((student) => ({
    id: student.assignmentId,
    learnerId: student.learnerId,
    firstName: student.firstName,
    lastName: student.lastName,
    displayName: student.displayName,
    email: student.email,
    phone: student.phone,
    ecole: "Byound School",
    contratType: "Alternance",
    rythmeAlternance: student.rythme,
    dateDebut: plusDays(-80).slice(0, 10),
    dateFin: plusDays(180).slice(0, 10),
    missionsTotal: student.missionsTotal,
    missionsValidees: student.missionsValidees,
    missionsAValider: student.missionsAValider,
    statut: student.statut === "a_surveiller" ? "en_retard" : student.statut === "en_retard" ? "en_retard" : "a_jour",
  })),
  pendingMissions: [
    { id: "jm-lea-1", title: "Compte rendu de prospection", learnerName: "Léa Bernard", dueDate: "vendredi", assignmentId: "a-lea" },
    { id: "jm-ines-1", title: "Relance client", learnerName: "Inès Morel", dueDate: "hier", assignmentId: "a-ines" },
  ],
  alerts: ["Inès Morel a deux missions en retard"],
  kpis: { learners: 4, pendingMissionActions: 2, evaluationsTodo: 1, badgesAwarded: 0 },
  todoPreview: [
    { id: "td1", title: "Signer le livret de Léa" },
    { id: "td2", title: "Prévenir le CFA pour Inès" },
  ],
};

export function jadeTutorAssignment(assignmentId: string): TutorAssignmentDetail | null {
  const student = JADE_TUTOR_HOME.students.find((item) => item.assignmentId === assignmentId);
  if (!student) return null;
  const fiche = FICHES[student.learnerId];
  return {
    assignment: { id: assignmentId, learnerId: student.learnerId, organizationId: null, startedAt: plusDays(-80) },
    learner: {
      displayName: student.displayName,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      ecole: "Byound School",
      contratType: "Alternance",
      rythmeAlternance: student.rythme,
      dateDebut: plusDays(-80).slice(0, 10),
      dateFin: plusDays(180).slice(0, 10),
    },
    missions: (fiche?.missions ?? []).map((mission) => ({
      id: mission.id,
      title: mission.title,
      description: mission.instructions,
      status: mission.status === "done" ? "VALIDEE" : mission.status === "in_progress" ? "EN_COURS" : "A_FAIRE",
      dueDate: mission.dueDate,
    })),
    evaluations: [
      { id: "f-mensuel", title: "Point mensuel", status: student.learnerId === "l-noah" ? "A_REMPLIR" : "COMPLETE", dueDate: plusDays(5) },
    ],
    timeline: [{ id: "tl1", label: "Mission déposée", dateLabel: "hier" }],
  };
}

export function jadeTutorForm(assignmentId: string, formId: string) {
  const detail = jadeTutorAssignment(assignmentId);
  if (!detail || formId !== "f-mensuel") return null;
  return {
    form: { id: formId, title: "Point mensuel", description: "Bilan du mois avec l'alternant." },
    questions: [
      { id: "q1", question: "Quels objectifs ont été tenus ?", question_type: "textarea", order_index: 0, metadata: null },
      { id: "q2", question: "Quels points restent à travailler ?", question_type: "textarea", order_index: 1, metadata: null },
    ],
    responses: detail.evaluations[0]?.status === "COMPLETE" ? [{ id: "r1", question_id: "q1", response: { text: "Les objectifs de prospection sont tenus." }, created_at: plusDays(-3) }] : [],
    learnerId: detail.assignment.learnerId,
  };
}

export const JADE_TUTOR_TODO = [
  { id: "todo-1", title: "Signer le livret de Léa", description: "Livret à signer avant vendredi.", status: "todo", priority: "high", school_id: "jade", due_date: plusDays(4), task_type: "student_followup", role_filter: "tuteur", tags: ["Léa"], subtasks: [], kanban_position: 0, created_at: plusDays(-1), updated_at: plusDays(-1) },
  { id: "todo-2", title: "Préparer la visite d'Inès", description: "Visite entreprise à confirmer.", status: "in_progress", priority: "urgent", school_id: "jade", due_date: plusDays(1), task_type: "tutoring_session", role_filter: "tuteur", tags: ["Inès"], subtasks: [], kanban_position: 1, created_at: plusDays(-2), updated_at: plusDays(-1) },
  { id: "todo-3", title: "Valider le compte rendu de Noah", description: null, status: "done", priority: "normal", school_id: "jade", due_date: plusDays(-2), task_type: "correction", role_filter: "tuteur", tags: ["Noah"], subtasks: [], kanban_position: 2, created_at: plusDays(-5), updated_at: plusDays(-1) },
];
