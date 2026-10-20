import type { SupabaseClient } from "@supabase/supabase-js";

import { buildTutorHome, type TutorHomeStudent } from "@/lib/tuteur/tutor-home-server";

function missing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return error.code === "42P01" || error.code === "42703" || error.code === "PGRST205" || msg.includes("does not exist") || msg.includes("schema cache");
}

export type TutorFicheMission = {
  id: string;
  title: string;
  status: "done" | "in_progress" | "todo" | "invalid";
  dueDate: string | null;
  completedAt: string | null;
  instructions: string | null;
  competency: string;
  competencyCode: string | null;
};

export type TutorFiche = {
  student: TutorHomeStudent;
  diploma: string | null;
  promotion: string | null;
  missions: TutorFicheMission[];
  interviews: Array<{ id: string; title: string; kind: string; startsAt: string; place: string | null; status: string; report: unknown }>;
  milestones: Array<{ id: string; title: string; kind: string; dueOn: string; doneAt: string | null }>;
  agendaDays: Array<{ date: string; lieu: "ecole" | "entreprise" | "weekend" | null; absence: boolean }>;
  shares: Array<{ scope: "disc" | "idmc" | "soft_skills"; grantedAt: string }>;
};

export async function loadTutorFiche(
  supabase: SupabaseClient,
  tutorId: string,
  tutorName: string,
  learnerId: string,
): Promise<TutorFiche | null> {
  const home = await buildTutorHome(supabase, tutorId, tutorName);
  const student = home.students.find((item) => item.learnerId === learnerId);
  if (!student) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisme_formation, ecole, type_contrat")
    .eq("id", learnerId)
    .maybeSingle();

  let missions: TutorFicheMission[] = [];
  const rich = await supabase
    .from("tutor_missions")
    .select("id, title, status, due_date, completed_at, instructions, competency_label, competency_code")
    .eq("assignment_id", student.assignmentId)
    .order("created_at", { ascending: true });
  const rows = missing(rich.error)
    ? (
        await supabase
          .from("tutor_missions")
          .select("id, title, status, due_date, completed_at, instructions")
          .eq("assignment_id", student.assignmentId)
          .order("created_at", { ascending: true })
      ).data
    : rich.data;
  missions = (rows ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title ?? "Mission"),
    status: (["done", "in_progress", "todo", "invalid"].includes(String(row.status)) ? row.status : "todo") as TutorFicheMission["status"],
    dueDate: row.due_date ? String(row.due_date) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    instructions: row.instructions ? String(row.instructions) : null,
    competency: "competency_label" in row && row.competency_label ? String(row.competency_label) : "Missions",
    competencyCode: "competency_code" in row && row.competency_code ? String(row.competency_code) : null,
  }));

  const interviewsQuery = await supabase
    .from("tutor_interviews")
    .select("id, title, kind, starts_at, place, status, report")
    .eq("learner_id", learnerId)
    .eq("tutor_id", tutorId)
    .order("starts_at", { ascending: true });
  const interviews = missing(interviewsQuery.error)
    ? []
    : (interviewsQuery.data ?? []).map((row) => ({
        id: String(row.id),
        title: String(row.title),
        kind: String(row.kind),
        startsAt: String(row.starts_at),
        place: row.place ? String(row.place) : null,
        status: String(row.status),
        report: row.report,
      }));

  const milestonesQuery = await supabase
    .from("contract_milestones")
    .select("id, title, kind, due_on, done_at")
    .eq("learner_id", learnerId)
    .order("due_on", { ascending: true });
  const milestones = missing(milestonesQuery.error)
    ? []
    : (milestonesQuery.data ?? []).map((row) => ({
        id: String(row.id),
        title: String(row.title),
        kind: String(row.kind),
        dueOn: String(row.due_on),
        doneAt: row.done_at ? String(row.done_at) : null,
      }));

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const { data: enrollments } = await supabase.from("class_enrollments").select("class_id").eq("student_id", learnerId);
  const classIds = (enrollments ?? []).map((row) => String(row.class_id));
  const schoolDays = new Set<string>();
  if (classIds.length) {
    const { data: slots } = await supabase
      .from("school_planning_slots")
      .select("starts_at, status")
      .in("class_id", classIds)
      .gte("starts_at", monthStart.toISOString())
      .lt("starts_at", monthEnd.toISOString());
    for (const slot of slots ?? []) {
      if (slot.status === "cancelled") continue;
      schoolDays.add(String(slot.starts_at).slice(0, 10));
    }
  }
  const agendaDays: TutorFiche["agendaDays"] = [];
  const cursor = new Date(monthStart);
  while (cursor < monthEnd) {
    const key = cursor.toISOString().slice(0, 10);
    const weekend = cursor.getDay() === 0 || cursor.getDay() === 6;
    agendaDays.push({
      date: key,
      lieu: weekend ? "weekend" : schoolDays.has(key) ? "ecole" : schoolDays.size > 0 && student.rythme ? "entreprise" : null,
      absence: false,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const shareQuery = await supabase
    .from("test_results_sharing")
    .select("scope, granted_at, revoked_at")
    .eq("student_id", learnerId)
    .eq("shared_with", "tutor")
    .is("revoked_at", null);
  const shares = missing(shareQuery.error)
    ? []
    : (shareQuery.data ?? [])
        .filter((row) => row.scope === "disc" || row.scope === "idmc" || row.scope === "soft_skills")
        .map((row) => ({ scope: row.scope as TutorFiche["shares"][number]["scope"], grantedAt: String(row.granted_at) }));

  return {
    student,
    diploma: profile?.organisme_formation || profile?.ecole || null,
    promotion: null,
    missions,
    interviews,
    milestones,
    agendaDays,
    shares,
  };
}
