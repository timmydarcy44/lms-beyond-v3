import type { SupabaseClient } from "@supabase/supabase-js";

import {
  addDays,
  inferAlternanceRhythm,
  isAlternanceWeekType,
  parseIsoDate,
  startOfIsoWeek,
  toIsoDate,
  yearLabelFromDates,
  type AlternanceWeekType,
  type UpcomingKind,
} from "@/lib/apprenant/alternance-planning";

export type PlanningSession = {
  id: string;
  starts_at: string;
  ends_at: string;
  event_type: string | null;
  title: string | null;
  learner_instruction: string | null;
  location_text: string | null;
  module_name: string | null;
  room_name: string | null;
  instructor_name: string | null;
  instructor_expert_slug: string | null;
};

export type PlanningUpcoming = {
  date: string;
  title: string;
  subtitle: string | null;
  kind: UpcomingKind;
};

export type LearnerPlanningOverview = {
  classId: string | null;
  titleLabel: string | null;
  specialtyLabel: string | null;
  yearLabel: string | null;
  rhythm: string | null;
  formationStartsOn: string | null;
  formationEndsOn: string | null;
  companyName: string | null;
  companyCity: string | null;
  tutorName: string | null;
  campusLabel: string | null;
  weeks: Array<{ week_starts_on: string; week_type: AlternanceWeekType }>;
  sessions: PlanningSession[];
  upcoming: PlanningUpcoming[];
};

async function resolveClassId(db: SupabaseClient, learnerId: string): Promise<string | null> {
  const { data: enrollments } = await db
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", learnerId);
  const fromEnroll = [...new Set((enrollments ?? []).map((e) => String(e.class_id ?? "")).filter(Boolean))];
  if (fromEnroll[0]) return fromEnroll[0];

  const { data: profile } = await db
    .from("profiles")
    .select("school_id, school_class")
    .eq("id", learnerId)
    .maybeSingle();
  const schoolId = String(profile?.school_id ?? "").trim();
  const schoolClass = String(profile?.school_class ?? "").trim();
  if (!schoolId || !schoolClass) return null;
  const { data: classes } = await db
    .from("school_classes")
    .select("id")
    .eq("school_id", schoolId)
    .ilike("name", schoolClass)
    .limit(1);
  return classes?.[0]?.id ? String(classes[0].id) : null;
}

async function loadContractContext(db: SupabaseClient, learnerId: string) {
  const { data: profile } = await db
    .from("profiles")
    .select("entreprise, city, poste_actuel")
    .eq("id", learnerId)
    .maybeSingle();

  let companyName = profile?.entreprise ? String(profile.entreprise).trim() || null : null;
  let companyCity = profile?.city ? String(profile.city).trim() || null : null;
  let tutorName: string | null = null;

  const { data: assignment } = await db
    .from("tutor_assignments")
    .select("tutor_id")
    .eq("learner_id", learnerId)
    .limit(1)
    .maybeSingle();

  if (assignment?.tutor_id) {
    const { data: tutor } = await db
      .from("profiles")
      .select("first_name, last_name, full_name")
      .eq("id", assignment.tutor_id)
      .maybeSingle();
    if (tutor) {
      tutorName =
        String(tutor.full_name ?? "").trim() ||
        `${String(tutor.first_name ?? "").trim()} ${String(tutor.last_name ?? "").trim()}`.trim() ||
        null;
    }
  }

  // Entreprise via company_tutors si dispo
  const { data: companyTutor } = await db
    .from("company_tutors")
    .select("company_id, first_name, last_name, contact_name")
    .eq("user_id", assignment?.tutor_id ?? "__none__")
    .limit(1)
    .maybeSingle();

  if (companyTutor?.company_id) {
    const { data: company } = await db
      .from("cfa_companies")
      .select("company_name, city")
      .eq("id", companyTutor.company_id)
      .maybeSingle();
    if (company?.company_name) companyName = String(company.company_name).trim() || companyName;
    if (company?.city) companyCity = String(company.city).trim() || companyCity;
    if (!tutorName) {
      tutorName =
        `${String(companyTutor.first_name ?? "").trim()} ${String(companyTutor.last_name ?? "").trim()}`.trim() ||
        String(companyTutor.contact_name ?? "").trim() ||
        null;
    }
  }

  return { companyName, companyCity, tutorName };
}

export async function loadLearnerPlanningOverview(
  db: SupabaseClient,
  learnerId: string,
): Promise<LearnerPlanningOverview> {
  const empty: LearnerPlanningOverview = {
    classId: null,
    titleLabel: null,
    specialtyLabel: null,
    yearLabel: null,
    rhythm: null,
    formationStartsOn: null,
    formationEndsOn: null,
    companyName: null,
    companyCity: null,
    tutorName: null,
    campusLabel: null,
    weeks: [],
    sessions: [],
    upcoming: [],
  };

  const classId = await resolveClassId(db, learnerId);
  const contract = await loadContractContext(db, learnerId);

  if (!classId) {
    return { ...empty, ...contract };
  }

  let klass: Record<string, unknown> | null = null;
  {
    const full = await db
      .from("school_classes")
      .select("id, name, title_label, specialty_label, formation_starts_on, formation_ends_on, school_id")
      .eq("id", classId)
      .maybeSingle();
    if (full.error) {
      const basic = await db.from("school_classes").select("id, name, school_id").eq("id", classId).maybeSingle();
      klass = (basic.data as Record<string, unknown> | null) ?? null;
    } else {
      klass = (full.data as Record<string, unknown> | null) ?? null;
    }
  }

  const formationStartsOn = klass?.formation_starts_on ? String(klass.formation_starts_on) : null;
  const formationEndsOn = klass?.formation_ends_on ? String(klass.formation_ends_on) : null;
  const titleLabel = klass?.title_label ? String(klass.title_label).trim() || null : null;
  const specialtyLabel = klass?.specialty_label ? String(klass.specialty_label).trim() || null : null;

  let weeks: Array<{ week_starts_on: string; week_type: AlternanceWeekType }> = [];
  {
    const cal = await db
      .from("alternance_calendar")
      .select("week_starts_on, week_type")
      .eq("class_id", classId)
      .order("week_starts_on", { ascending: true });
    if (!cal.error) {
      weeks = (cal.data ?? [])
        .map((w) => ({
          week_starts_on: String(w.week_starts_on),
          week_type: w.week_type,
        }))
        .filter((w): w is { week_starts_on: string; week_type: AlternanceWeekType } =>
          isAlternanceWeekType(w.week_type),
        );
    }
  }

  let sessions: PlanningSession[] = [];
  const from = formationStartsOn
    ? parseIsoDate(formationStartsOn).toISOString()
    : addDays(startOfIsoWeek(new Date()), -14).toISOString();
  const to = formationEndsOn
    ? addDays(parseIsoDate(formationEndsOn), 1).toISOString()
    : addDays(startOfIsoWeek(new Date()), 120).toISOString();

  const mapSlots = (slots: Array<Record<string, unknown>>) =>
    slots.map((s) => {
      const instructorRaw = s.instructor;
      const moduleRaw = s.module;
      const roomRaw = s.room;
      const instructor = Array.isArray(instructorRaw) ? instructorRaw[0] : instructorRaw;
      const module = Array.isArray(moduleRaw) ? moduleRaw[0] : moduleRaw;
      const room = Array.isArray(roomRaw) ? roomRaw[0] : roomRaw;
      const instructorObj = (instructor ?? null) as {
        first_name?: string;
        last_name?: string;
      } | null;
      const moduleObj = (module ?? null) as { name?: string } | null;
      const roomObj = (room ?? null) as { name?: string } | null;
      const instructorName = instructorObj
        ? `${String(instructorObj.first_name ?? "").trim()} ${String(instructorObj.last_name ?? "").trim()}`.trim() ||
          null
        : null;
      return {
        id: String(s.id),
        starts_at: String(s.starts_at),
        ends_at: String(s.ends_at),
        event_type: s.event_type ? String(s.event_type) : null,
        title: s.title ? String(s.title).trim() || null : null,
        learner_instruction: s.learner_instruction
          ? String(s.learner_instruction).trim() || null
          : null,
        location_text: s.location_text ? String(s.location_text).trim() || null : null,
        module_name: moduleObj?.name ? String(moduleObj.name).trim() || null : null,
        room_name: roomObj?.name ? String(roomObj.name).trim() || null : null,
        instructor_name: instructorName,
        instructor_expert_slug: null,
      };
    });

  {
    const rich = await db
      .from("school_planning_slots")
      .select(
        `
      id, starts_at, ends_at, event_type, title, learner_instruction, location_text,
      module:school_planning_modules(name),
      room:school_rooms(name),
      instructor:school_instructors!school_planning_slots_instructor_id_fkey(first_name, last_name, expert_id)
    `,
      )
      .eq("class_id", classId)
      .neq("status", "cancelled")
      .gte("starts_at", from)
      .lte("starts_at", to)
      .order("starts_at", { ascending: true });

    if (!rich.error && rich.data) {
      sessions = mapSlots(rich.data as Array<Record<string, unknown>>);
    } else {
      const simple = await db
        .from("school_planning_slots")
        .select("id, starts_at, ends_at, event_type, title, location_text")
        .eq("class_id", classId)
        .neq("status", "cancelled")
        .gte("starts_at", from)
        .lte("starts_at", to)
        .order("starts_at", { ascending: true });
      if (simple.data) {
        sessions = mapSlots(
          simple.data.map((s) => ({ ...s, learner_instruction: null, module: null, room: null, instructor: null })),
        );
      }
    }
  }

  const upcoming: PlanningUpcoming[] = [];
  const today = toIsoDate(new Date());

  for (const s of sessions) {
    const day = toIsoDate(new Date(s.starts_at));
    if (day < today) continue;
    if (s.event_type === "evaluation" || s.event_type === "exam") {
      upcoming.push({
        date: day,
        title: s.title || s.module_name || "Évaluation",
        subtitle: null,
        kind: s.event_type === "exam" ? "exam" : "evaluation",
      });
    }
  }
  for (const w of weeks) {
    if (w.week_starts_on < today) continue;
    if (w.week_type === "holiday") {
      upcoming.push({
        date: w.week_starts_on,
        title: "Vacances",
        subtitle: null,
        kind: "holiday",
      });
    } else if (w.week_type === "exam") {
      upcoming.push({
        date: w.week_starts_on,
        title: "Semaine d'examens",
        subtitle: null,
        kind: "exam",
      });
    }
  }

  // Livret d'apprentissage (échéances tuteur) — best effort
  const { data: booklets } = await db
    .from("apprenticeship_booklets")
    .select("id")
    .eq("student_id", learnerId)
    .limit(1);
  const bookletId = booklets?.[0]?.id;
  if (bookletId) {
    const { data: periods } = await db
      .from("apprenticeship_booklet_periods")
      .select("ends_on, label")
      .eq("booklet_id", bookletId)
      .gte("ends_on", today)
      .order("ends_on", { ascending: true })
      .limit(3);
    for (const p of periods ?? []) {
      if (!p.ends_on) continue;
      upcoming.push({
        date: String(p.ends_on),
        title: "Livret d'apprentissage",
        subtitle: p.label ? String(p.label) : null,
        kind: "booklet",
      });
    }
  }

  upcoming.sort((a, b) => a.date.localeCompare(b.date));

  return {
    classId,
    titleLabel: titleLabel || (klass?.name ? String(klass.name) : null),
    specialtyLabel,
    yearLabel: yearLabelFromDates(formationStartsOn, formationEndsOn),
    rhythm: inferAlternanceRhythm(weeks),
    formationStartsOn,
    formationEndsOn,
    companyName: contract.companyName,
    companyCity: contract.companyCity,
    tutorName: contract.tutorName,
    campusLabel: null,
    weeks,
    sessions,
    upcoming: upcoming.slice(0, 12),
  };
}
