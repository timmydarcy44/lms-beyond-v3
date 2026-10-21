import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export function relationMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return error.code === "42P01" || error.code === "42703" || error.code === "PGRST205" || msg.includes("does not exist") || msg.includes("schema cache");
}

export type MissionRow = {
  id: string;
  assignmentId: string;
  learnerId: string;
  learnerName: string;
  title: string;
  instructions: string | null;
  blockCode: string | null;
  blockId: string | null;
  dueDate: string | null;
  status: string;
  late: boolean;
  deliverable: string | null;
  submittedAt: string | null;
  validatedAt: string | null;
  tutorComment: string | null;
};

export function missionBucket(row: { status: string; late: boolean }) {
  if (row.status === "validated" || row.status === "done") return "validees";
  if (row.late) return "en_retard";
  if (row.status === "submitted" || row.status === "in_progress") return "a_valider";
  return "en_cours";
}

async function assignedLearners(supabase: SupabaseClient, tutorId: string) {
  const { data } = await supabase
    .from("tutor_assignments")
    .select("id, learner_id, started_at, organization_id")
    .eq("tutor_id", tutorId)
    .in("status", ["active", "paused"]);
  return data ?? [];
}

async function names(supabase: SupabaseClient, ids: string[]) {
  if (!ids.length) return new Map<string, { name: string; first: string; email: string | null; phone: string | null; rythme: string | null; formation: string | null; school: string | null; end: string | null }>();
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, full_name, email, telephone, phone_number, rythme_alternance, poste_actuel, type_contrat, date_fin_contrat, organisme_formation, ecole")
    .in("id", ids);
  const map = new Map<string, { name: string; first: string; email: string | null; phone: string | null; rythme: string | null; formation: string | null; school: string | null; end: string | null }>();
  for (const row of data ?? []) {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || String(row.full_name ?? row.email ?? "Alternant");
    map.set(String(row.id), {
      name,
      first: String(row.first_name ?? name.split(" ")[0] ?? name),
      email: row.email ? String(row.email) : null,
      phone: row.telephone ? String(row.telephone) : row.phone_number ? String(row.phone_number) : null,
      rythme: row.rythme_alternance ? String(row.rythme_alternance) : null,
      formation: row.poste_actuel || row.type_contrat || row.organisme_formation || null,
      school: row.ecole || row.organisme_formation || null,
      end: row.date_fin_contrat ? String(row.date_fin_contrat).slice(0, 10) : null,
    });
  }
  return map;
}

export async function listTutorMissions(supabase: SupabaseClient, tutorId: string): Promise<MissionRow[]> {
  const assignments = await assignedLearners(supabase, tutorId);
  if (!assignments.length) return [];
  const ids = assignments.map((row) => String(row.id));
  const learnerOf = new Map(assignments.map((row) => [String(row.id), String(row.learner_id)]));
  const rich = await supabase
    .from("tutor_missions")
    .select("id, assignment_id, title, instructions, status, due_date, completed_at, competency_code, competency_block_id, deliverable, submitted_at, validated_at, tutor_comment")
    .in("assignment_id", ids);
  const rows = relationMissing(rich.error)
    ? (await supabase.from("tutor_missions").select("id, assignment_id, title, instructions, status, due_date, completed_at, competency_code").in("assignment_id", ids)).data
    : rich.data;
  const people = await names(supabase, [...new Set(assignments.map((row) => String(row.learner_id)))]);
  const now = Date.now();
  return (rows ?? []).map((row) => {
    const learnerId = learnerOf.get(String(row.assignment_id)) ?? "";
    const status = String(row.status ?? "todo");
    const due = row.due_date ? String(row.due_date) : null;
    const closed = status === "done" || status === "validated";
    const late = Boolean(due && !closed && new Date(due).getTime() < now);
    return {
      id: String(row.id),
      assignmentId: String(row.assignment_id),
      learnerId,
      learnerName: people.get(learnerId)?.name ?? "Alternant",
      title: String(row.title ?? "Mission"),
      instructions: row.instructions ? String(row.instructions) : null,
      blockCode: "competency_code" in row && row.competency_code ? String(row.competency_code) : null,
      blockId: "competency_block_id" in row && row.competency_block_id ? String(row.competency_block_id) : null,
      dueDate: due,
      status,
      late,
      deliverable: "deliverable" in row && row.deliverable ? String(row.deliverable) : null,
      submittedAt: "submitted_at" in row && row.submitted_at ? String(row.submitted_at) : null,
      validatedAt: "validated_at" in row && row.validated_at ? String(row.validated_at) : row.completed_at ? String(row.completed_at) : null,
      tutorComment: "tutor_comment" in row && row.tutor_comment ? String(row.tutor_comment) : null,
    };
  });
}

export async function listBlocks(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("competency_blocks").select("id, code, title, kind").order("code");
  if (relationMissing(error)) return [];
  return data ?? [];
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export async function ensureBooklet(supabase: SupabaseClient, tutorId: string, studentId: string) {
  const existing = await supabase.from("apprenticeship_booklets").select("id").eq("student_id", studentId).eq("tutor_id", tutorId).maybeSingle();
  if (relationMissing(existing.error)) return null;
  if (existing.data?.id) return String(existing.data.id);
  const assignment = await supabase
    .from("tutor_assignments")
    .select("id, started_at")
    .eq("tutor_id", tutorId)
    .eq("learner_id", studentId)
    .in("status", ["active", "paused"])
    .maybeSingle();
  if (!assignment.data) return null;
  const profile = await supabase.from("profiles").select("date_fin_contrat").eq("id", studentId).maybeSingle();
  const start = assignment.data.started_at ? String(assignment.data.started_at).slice(0, 10) : null;
  const end = profile.data?.date_fin_contrat ? String(profile.data.date_fin_contrat).slice(0, 10) : null;
  if (!start || !end || end <= start) return null;
  const created = await supabase
    .from("apprenticeship_booklets")
    .insert({ student_id: studentId, tutor_id: tutorId, contract_start: start, contract_end: end, period_length_months: 2 })
    .select("id, contract_start, contract_end, period_length_months")
    .single();
  if (!created.data) return null;
  const periods: Array<Record<string, unknown>> = [];
  let cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  let index = 1;
  while (cursor < last && index < 24) {
    const next = addMonths(cursor, 2);
    const endDate = next < last ? next : last;
    periods.push({
      booklet_id: created.data.id,
      index,
      start_date: cursor.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      status: "awaiting_student",
    });
    cursor = new Date(endDate);
    cursor.setDate(cursor.getDate() + 1);
    index += 1;
  }
  if (periods.length) await supabase.from("booklet_periods").insert(periods);
  return String(created.data.id);
}

export async function loadBookletBoard(supabase: SupabaseClient, tutorId: string, studentId: string | null) {
  const assignments = await assignedLearners(supabase, tutorId);
  const people = await names(supabase, assignments.map((row) => String(row.learner_id)));
  const students = assignments.map((row) => ({
    id: String(row.learner_id),
    assignmentId: String(row.id),
    name: people.get(String(row.learner_id))?.name ?? "Alternant",
    startedAt: row.started_at ? String(row.started_at).slice(0, 10) : null,
  }));
  const selected = studentId && students.some((item) => item.id === studentId) ? studentId : students[0]?.id ?? null;
  if (!selected) return { students, booklet: null, periods: [], signatures: [], prefill: null, profile: null };
  const bookletId = await ensureBooklet(supabase, tutorId, selected);
  if (!bookletId) return { students, booklet: null, periods: [], signatures: [], prefill: null, profile: people.get(selected) ?? null };
  const booklet = await supabase.from("apprenticeship_booklets").select("*").eq("id", bookletId).maybeSingle();
  const periods = await supabase.from("booklet_periods").select("*").eq("booklet_id", bookletId).order("index");
  if (relationMissing(booklet.error) || relationMissing(periods.error)) {
    return { students, booklet: null, periods: [], signatures: [], prefill: null, profile: people.get(selected) ?? null };
  }
  const periodIds = (periods.data ?? []).map((row) => String(row.id));
  const signatures = periodIds.length
    ? await supabase.from("booklet_signatures").select("*").in("period_id", periodIds)
    : { data: [] };
  const orgId = assignments.find((row) => String(row.learner_id) === selected)?.organization_id;
  const company = orgId
    ? await supabase.from("organizations").select("name").eq("id", String(orgId)).maybeSingle()
    : { data: null };
  const referent = booklet.data?.cfa_referent_id
    ? await names(supabase, [String(booklet.data.cfa_referent_id)])
    : new Map();
  const today = new Date().toISOString().slice(0, 10);
  const current = (periods.data ?? []).find((row) => String(row.start_date) <= today && String(row.end_date) >= today) ?? (periods.data ?? []).find((row) => row.status !== "signed") ?? null;
  const prefill = current ? await periodPrefill(supabase, selected, String(current.start_date), String(current.end_date)) : null;
  return {
    students,
    booklet: booklet.data,
    periods: periods.data ?? [],
    signatures: signatures.data ?? [],
    prefill,
    profile: people.get(selected) ?? null,
    identity: {
      company: company.data?.name ? String(company.data.name) : null,
      cfa: people.get(selected)?.school ?? null,
      referent: referent.get(String(booklet.data?.cfa_referent_id ?? ""))?.name ?? null,
    },
    currentPeriodId: current ? String(current.id) : null,
  };
}

export async function periodPrefill(supabase: SupabaseClient, studentId: string, start: string, end: string) {
  const assignments = await supabase.from("tutor_assignments").select("id").eq("learner_id", studentId);
  const assignmentIds = (assignments.data ?? []).map((row) => String(row.id));
  const missions = assignmentIds.length
    ? await supabase.from("tutor_missions").select("title, status, competency_code, validated_at, completed_at").in("assignment_id", assignmentIds)
    : { data: [] };
  const validated = (missions.data ?? []).filter((row) => {
    const when = row.validated_at || row.completed_at;
    const status = String(row.status);
    if (status !== "done" && status !== "validated") return false;
    if (!when) return true;
    const day = String(when).slice(0, 10);
    return day >= start && day <= end;
  });
  const blocks = [...new Set(validated.map((row) => row.competency_code).filter(Boolean).map(String))];
  const enrollments = await supabase.from("class_enrollments").select("class_id").eq("student_id", studentId);
  const classIds = (enrollments.data ?? []).map((row) => String(row.class_id));
  let modules: string[] = [];
  if (classIds.length) {
    const slots = await supabase
      .from("school_planning_slots")
      .select("module_id, starts_at, status")
      .in("class_id", classIds)
      .gte("starts_at", `${start}T00:00:00`)
      .lte("starts_at", `${end}T23:59:59`);
    const moduleIds = [...new Set((slots.data ?? []).filter((row) => row.status !== "cancelled").map((row) => String(row.module_id)))];
    if (moduleIds.length) {
      const mods = await supabase.from("school_planning_modules").select("name").in("id", moduleIds);
      modules = (mods.data ?? []).map((row) => String(row.name));
    }
  }
  const absences = await supabase
    .from("school_absences")
    .select("status, created_at")
    .eq("learner_id", studentId)
    .gte("created_at", `${start}T00:00:00`)
    .lte("created_at", `${end}T23:59:59`);
  const rows = absences.data ?? [];
  const justified = rows.filter((row) => row.status === "justified").length;
  const unjustified = rows.filter((row) => row.status === "to_justify" || row.status === "refused").length;
  return {
    missions: validated.map((row) => String(row.title)),
    blocks,
    modules,
    justified,
    unjustified,
  };
}

export function hashContent(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function listEvaluations(supabase: SupabaseClient, tutorId: string) {
  const { data, error } = await supabase
    .from("evaluations")
    .select("id, student_id, type, due_date, status, self_sent_at, sent_at, general_comment")
    .eq("tutor_id", tutorId)
    .order("due_date", { ascending: true });
  if (relationMissing(error)) return [];
  const people = await names(supabase, [...new Set((data ?? []).map((row) => String(row.student_id)))]);
  const rank = { to_fill: 0, awaiting_student: 1, sent: 2 };
  return (data ?? [])
    .map((row) => ({
      id: String(row.id),
      studentId: String(row.student_id),
      studentName: people.get(String(row.student_id))?.name ?? "Alternant",
      firstName: people.get(String(row.student_id))?.first ?? "Alternant",
      type: String(row.type),
      dueDate: row.due_date ? String(row.due_date) : null,
      status: String(row.status),
      selfSentAt: row.self_sent_at ? String(row.self_sent_at) : null,
      sentAt: row.sent_at ? String(row.sent_at) : null,
    }))
    .sort((a, b) => (rank[a.status as keyof typeof rank] ?? 3) - (rank[b.status as keyof typeof rank] ?? 3));
}

export async function loadEvaluation(supabase: SupabaseClient, tutorId: string, evaluationId: string) {
  const { data, error } = await supabase.from("evaluations").select("*").eq("id", evaluationId).eq("tutor_id", tutorId).maybeSingle();
  if (relationMissing(error) || !data) return null;
  const items = await supabase.from("evaluation_items").select("*").eq("evaluation_id", evaluationId);
  const people = await names(supabase, [String(data.student_id)]);
  const person = people.get(String(data.student_id));
  return {
    evaluation: data,
    items: items.data ?? [],
    studentName: person?.name ?? "Alternant",
    firstName: person?.first ?? "Alternant",
  };
}
