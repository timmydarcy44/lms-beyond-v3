import type { SupabaseClient } from "@supabase/supabase-js";

import { getDropoutSignals, getTutorStudentStatus, TUTOR_DROPOUT_THRESHOLDS, type TutorStudentStatus } from "@/lib/tuteur/student-status";

type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  telephone?: string | null;
  phone_number?: string | null;
  ecole?: string | null;
  organisme_formation?: string | null;
  rythme_alternance?: string | null;
  type_contrat?: string | null;
  poste_actuel?: string | null;
};

export type TutorPlace = "ecole" | "entreprise" | null;

export type TutorHomeStudent = {
  assignmentId: string;
  learnerId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  formation: string | null;
  email: string | null;
  phone: string | null;
  rythme: string | null;
  statut: TutorStudentStatus;
  signals: string[];
  missionsValidees: number;
  missionsTotal: number;
  missionsAValider: number;
  nextDeadline: string | null;
  todayPlace: TutorPlace;
};

export type TutorAction = {
  id: string;
  kind: "validation" | "evaluation" | "signature" | "message";
  title: string;
  subtitle: string;
  dueAt: string | null;
  missionId?: string;
  learnerId: string;
  href?: string;
};

export type TutorDeadline = { id: string; label: string; dateLabel: string; at: string };

export type TutorWeekDay = {
  date: string;
  label: string;
  lieu: "ecole" | "entreprise" | "weekend" | null;
  absence: boolean;
  today: boolean;
  schoolCount: number;
  companyCount: number;
};

export type TutorHomePayload = {
  tutorFirstName: string;
  tutorName: string;
  students: TutorHomeStudent[];
  actions: TutorAction[];
  deadlines: TutorDeadline[];
  week: { label: string; days: TutorWeekDay[] } | null;
  watch: { learnerId: string; name: string; signals: string[] }[];
  counts: { validate: number; evaluate: number; sign: number; writeCfa: number; total: number };
  inCompanyToday: number;
};

function missing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

function displayName(p: ProfileRow | undefined) {
  const fn = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  if (fn) return fn;
  const full = String(p?.full_name ?? "").trim();
  if (full) return full;
  return String(p?.email ?? "").split("@")[0] || "Alternant";
}

function firstNameOf(p: ProfileRow | undefined, fallback: string) {
  const fn = String(p?.first_name ?? "").trim();
  if (fn) return fn;
  return fallback.split(" ")[0] || fallback;
}

function lastNameOf(p: ProfileRow | undefined, fallback: string) {
  const ln = String(p?.last_name ?? "").trim();
  if (ln) return ln;
  const parts = fallback.split(" ");
  return parts.slice(1).join(" ");
}

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(from: Date) {
  const x = new Date(from);
  x.setHours(0, 0, 0, 0);
  const mondayOffset = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - mondayOffset);
  return x;
}

function formatFr(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export async function buildTutorHome(supabase: SupabaseClient, tutorId: string, tutorName: string): Promise<TutorHomePayload> {
  const first = tutorName.split(" ")[0] || tutorName;
  const empty: TutorHomePayload = {
    tutorFirstName: first,
    tutorName,
    students: [],
    actions: [],
    deadlines: [],
    week: null,
    watch: [],
    counts: { validate: 0, evaluate: 0, sign: 0, writeCfa: 0, total: 0 },
    inCompanyToday: 0,
  };

  const { data: assignments, error: aErr } = await supabase
    .from("tutor_assignments")
    .select("id, learner_id, organization_id, status, started_at")
    .eq("tutor_id", tutorId)
    .in("status", ["active", "paused"]);

  if (aErr || !assignments?.length) return empty;

  const learnerIds = [...new Set(assignments.map((r) => String(r.learner_id)))];
  const assignmentIds = assignments.map((r) => String(r.id));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, telephone, phone_number, ecole, organisme_formation, rythme_alternance, type_contrat, poste_actuel")
    .in("id", learnerIds);
  const profileById = new Map<string, ProfileRow>();
  for (const row of (profiles ?? []) as ProfileRow[]) profileById.set(row.id, row);

  let missionRows: Array<Record<string, unknown>> = [];
  const withCompetency = await supabase
    .from("tutor_missions")
    .select("id, assignment_id, title, status, due_date, completed_at, competency_label, competency_code")
    .in("assignment_id", assignmentIds);
  if (missing(withCompetency.error)) {
    const base = await supabase
      .from("tutor_missions")
      .select("id, assignment_id, title, status, due_date, completed_at")
      .in("assignment_id", assignmentIds);
    missionRows = (base.data ?? []) as Array<Record<string, unknown>>;
  } else {
    missionRows = (withCompetency.data ?? []) as Array<Record<string, unknown>>;
  }

  const now = Date.now();
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("class_id, student_id")
    .in("student_id", learnerIds);
  const classIds = [...new Set((enrollments ?? []).map((e) => String(e.class_id)))];
  const classesByStudent = new Map<string, string[]>();
  for (const e of enrollments ?? []) {
    const sid = String(e.student_id);
    const list = classesByStudent.get(sid) ?? [];
    list.push(String(e.class_id));
    classesByStudent.set(sid, list);
  }

  let slots: Array<{ class_id: string; starts_at: string; id: string; status: string }> = [];
  if (classIds.length) {
    const { data } = await supabase
      .from("school_planning_slots")
      .select("id, class_id, starts_at, status")
      .in("class_id", classIds)
      .gte("starts_at", weekStart.toISOString())
      .lt("starts_at", weekEnd.toISOString());
    slots = (data ?? []) as typeof slots;
  }

  const slotIds = slots.map((s) => s.id);
  let absences: Array<{ learner_id: string; slot_id: string; status: string; created_at: string }> = [];
  if (slotIds.length) {
    const { data } = await supabase
      .from("school_absences")
      .select("learner_id, slot_id, status, created_at")
      .in("learner_id", learnerIds)
      .in("slot_id", slotIds);
    absences = (data ?? []) as typeof absences;
  }

  const since = new Date(now - TUTOR_DROPOUT_THRESHOLDS.absenceWindowDays * 86400000).toISOString();
  const { data: recentAbsences } = await supabase
    .from("school_absences")
    .select("learner_id, status, created_at")
    .in("learner_id", learnerIds)
    .gte("created_at", since);

  const reported = await supabase
    .from("tutor_absence_reports")
    .select("learner_id, absence_date, motif")
    .in("learner_id", learnerIds)
    .gte("absence_date", since.slice(0, 10));
  const reportedRows = missing(reported.error) ? [] : (reported.data ?? []);

  const activity = await supabase
    .from("learning_sessions")
    .select("user_id, started_at")
    .in("user_id", learnerIds)
    .order("started_at", { ascending: false });
  const lastActivity = new Map<string, number>();
  if (!missing(activity.error)) {
    for (const row of activity.data ?? []) {
      const id = String(row.user_id);
      if (!lastActivity.has(id)) lastActivity.set(id, new Date(String(row.started_at)).getTime());
    }
  }

  const milestones = await supabase
    .from("contract_milestones")
    .select("id, learner_id, kind, title, due_on, done_at")
    .in("learner_id", learnerIds)
    .order("due_on", { ascending: true });
  const milestoneRows = missing(milestones.error) ? [] : (milestones.data ?? []);

  const today = dayKey(new Date());
  const schoolDaysByStudent = new Map<string, Set<string>>();
  const absenceDaysByStudent = new Map<string, Set<string>>();
  for (const slot of slots) {
    if (slot.status === "cancelled") continue;
    const key = dayKey(new Date(slot.starts_at));
    for (const [studentId, classes] of classesByStudent) {
      if (!classes.includes(slot.class_id)) continue;
      const set = schoolDaysByStudent.get(studentId) ?? new Set();
      set.add(key);
      schoolDaysByStudent.set(studentId, set);
    }
  }
  for (const abs of absences) {
    const slot = slots.find((s) => s.id === abs.slot_id);
    if (!slot) continue;
    const set = absenceDaysByStudent.get(String(abs.learner_id)) ?? new Set();
    set.add(dayKey(new Date(slot.starts_at)));
    absenceDaysByStudent.set(String(abs.learner_id), set);
  }

  function placeOn(learnerId: string, rythme: string | null, date: string): TutorPlace {
    if (schoolDaysByStudent.get(learnerId)?.has(date)) return "ecole";
    const hasSchoolThisWeek = (schoolDaysByStudent.get(learnerId)?.size ?? 0) > 0;
    if (hasSchoolThisWeek && rythme) return "entreprise";
    return null;
  }

  const students: TutorHomeStudent[] = [];
  const actions: TutorAction[] = [];
  const deadlines: TutorDeadline[] = [];

  for (const a of assignments) {
    const learnerId = String(a.learner_id);
    const profile = profileById.get(learnerId);
    const name = displayName(profile);
    const missions = missionRows.filter((m) => String(m.assignment_id) === String(a.id));
    const total = missions.length;
    const validees = missions.filter((m) => m.status === "done").length;
    const aValider = missions.filter((m) => m.status === "in_progress").length;
    const overdueMissions = missions.filter((m) => {
      if (!m.due_date || m.status === "done" || m.status === "invalid") return false;
      return new Date(String(m.due_date)).getTime() < now;
    }).length;
    const unjustified = (recentAbsences ?? []).filter(
      (row) => String(row.learner_id) === learnerId && (row.status === "to_justify" || row.status === "refused"),
    ).length + reportedRows.filter((row) => String(row.learner_id) === learnerId).length;
    const last = lastActivity.get(learnerId);
    const inactiveDays = last == null ? null : Math.floor((now - last) / 86400000);
    const livret = milestoneRows.find(
      (row) => String(row.learner_id) === learnerId && String(row.kind) === "livret" && !row.done_at,
    );
    const unsignedLivretDays = livret
      ? Math.floor((now - new Date(String(livret.due_on)).getTime()) / 86400000)
      : null;
    const signals = getDropoutSignals({
      overdueMissions,
      unjustifiedAbsences: unjustified,
      inactiveDays,
      unsignedLivretDays,
    });
    const statut = getTutorStudentStatus({ overdueMissions, signals });
    const rythme = profile?.rythme_alternance ?? null;
    const nextMission = missions
      .filter((m) => m.due_date && m.status !== "done" && m.status !== "invalid")
      .sort((x, y) => new Date(String(x.due_date)).getTime() - new Date(String(y.due_date)).getTime())[0];

    students.push({
      assignmentId: String(a.id),
      learnerId,
      firstName: firstNameOf(profile, name),
      lastName: lastNameOf(profile, name),
      displayName: name,
      formation: profile?.poste_actuel || profile?.type_contrat || profile?.ecole || profile?.organisme_formation || null,
      email: profile?.email ?? null,
      phone: profile?.telephone ?? profile?.phone_number ?? null,
      rythme,
      statut,
      signals,
      missionsValidees: validees,
      missionsTotal: total,
      missionsAValider: aValider,
      nextDeadline: nextMission?.due_date ? formatFr(String(nextMission.due_date)) : null,
      todayPlace: placeOn(learnerId, rythme, today),
    });

    for (const mission of missions.filter((m) => m.status === "in_progress")) {
      actions.push({
        id: `val-${mission.id}`,
        kind: "validation",
        title: `Valider · ${String(mission.title ?? "Mission")}`,
        subtitle: `${name}${mission.due_date ? ` · ${formatFr(String(mission.due_date))}` : ""}`,
        dueAt: mission.due_date ? String(mission.due_date) : null,
        missionId: String(mission.id),
        learnerId,
      });
    }
  }

  for (const a of assignments) {
    const learnerId = String(a.learner_id);
    const student = students.find((s) => s.learnerId === learnerId);
    const orgId = a.organization_id as string | null;
    let formQuery = supabase.from("tutor_followup_forms").select("id, title").eq("active", true);
    formQuery = orgId ? formQuery.or(`organization_id.is.null,organization_id.eq.${orgId}`) : formQuery.is("organization_id", null);
    const { data: forms } = await formQuery;
    for (const form of forms ?? []) {
      const { count: questions } = await supabase
        .from("tutor_followup_questions")
        .select("id", { count: "exact", head: true })
        .eq("form_id", form.id);
      if (!questions) continue;
      const { count: responses } = await supabase
        .from("tutor_followup_responses")
        .select("id", { count: "exact", head: true })
        .eq("form_id", form.id)
        .eq("assignment_id", a.id);
      if ((responses ?? 0) < questions) {
        actions.push({
          id: `eval-${a.id}-${form.id}`,
          kind: "evaluation",
          title: `Évaluer · ${String(form.title ?? "Entretien")}`,
          subtitle: student?.displayName ?? "Alternant",
          dueAt: null,
          learnerId,
          href: `/dashboard/tuteur/formulaires/${a.id}/${form.id}`,
        });
      }
    }
  }

  for (const row of milestoneRows) {
    if (row.done_at) continue;
    const student = students.find((s) => s.learnerId === String(row.learner_id));
    if (!student) continue;
    const at = `${row.due_on}T12:00:00`;
    deadlines.push({
      id: String(row.id),
      label: `${student.firstName} · ${String(row.title)}`,
      dateLabel: formatFr(at) ?? String(row.due_on),
      at,
    });
    if (String(row.kind) === "signature" || String(row.kind) === "livret") {
      actions.push({
        id: `sign-${row.id}`,
        kind: "signature",
        title: `Signer · ${String(row.title)}`,
        subtitle: student.displayName,
        dueAt: at,
        learnerId: student.learnerId,
        href: "/dashboard/tuteur/livrets",
      });
    }
  }

  for (const mission of missionRows) {
    if (!mission.due_date || mission.status === "done" || mission.status === "invalid") continue;
    const assignment = assignments.find((a) => String(a.id) === String(mission.assignment_id));
    const student = students.find((s) => s.learnerId === String(assignment?.learner_id));
    if (!student) continue;
    deadlines.push({
      id: `m-${mission.id}`,
      label: `${student.firstName} · ${String(mission.title)}`,
      dateLabel: formatFr(String(mission.due_date)) ?? "",
      at: String(mission.due_date),
    });
  }

  const watch = students
    .filter((s) => s.statut === "a_surveiller")
    .map((s) => ({ learnerId: s.learnerId, name: s.displayName, signals: s.signals }));

  for (const item of watch) {
    actions.push({
      id: `cfa-${item.learnerId}`,
      kind: "message",
      title: `Écrire au CFA · ${item.name}`,
      subtitle: item.signals[0] ?? "Suivi à signaler",
      dueAt: null,
      learnerId: item.learnerId,
      href: "/dashboard/student/community",
    });
  }

  actions.sort((a, b) => {
    if (!a.dueAt && !b.dueAt) return 0;
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
  deadlines.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const rank = { a_surveiller: 0, en_retard: 1, a_jour: 2 };
  students.sort((a, b) => rank[a.statut] - rank[b.statut] || a.displayName.localeCompare(b.displayName, "fr"));

  const days: TutorWeekDay[] = [];
  let anyPlace = false;
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const key = dayKey(date);
    const weekend = i >= 5;
    let schoolCount = 0;
    let companyCount = 0;
    let absence = false;
    for (const student of students) {
      const place = weekend ? null : placeOn(student.learnerId, student.rythme, key);
      if (place === "ecole") schoolCount += 1;
      if (place === "entreprise") companyCount += 1;
      if (absenceDaysByStudent.get(student.learnerId)?.has(key)) absence = true;
    }
    if (schoolCount || companyCount) anyPlace = true;
    days.push({
      date: key,
      label: date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      lieu: weekend ? "weekend" : schoolCount ? "ecole" : companyCount ? "entreprise" : null,
      absence,
      today: key === today,
      schoolCount,
      companyCount,
    });
  }

  const counts = {
    validate: actions.filter((a) => a.kind === "validation").length,
    evaluate: actions.filter((a) => a.kind === "evaluation").length,
    sign: actions.filter((a) => a.kind === "signature").length,
    writeCfa: actions.filter((a) => a.kind === "message").length,
    total: actions.length,
  };

  return {
    tutorFirstName: first,
    tutorName,
    students,
    actions,
    deadlines: deadlines.slice(0, 3),
    week: anyPlace ? { label: `Semaine du ${weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`, days } : null,
    watch,
    counts,
    inCompanyToday: students.filter((s) => s.todayPlace === "entreprise").length,
  };
}
