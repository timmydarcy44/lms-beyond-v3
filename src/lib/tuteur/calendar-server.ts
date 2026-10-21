import type { SupabaseClient } from "@supabase/supabase-js";

import { relationMissing } from "@/lib/tuteur/followup-server";

function mondayOf(anchor: Date) {
  const date = new Date(anchor);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function key(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export async function loadTutorCalendar(supabase: SupabaseClient, tutorId: string, anchorIso: string | null) {
  const anchor = anchorIso ? new Date(`${anchorIso}T12:00:00`) : new Date();
  const start = mondayOf(Number.isNaN(anchor.getTime()) ? new Date() : anchor);
  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const from = key(days[0]);
  const to = key(days[4]);

  const assignments = await supabase
    .from("tutor_assignments")
    .select("id, learner_id")
    .eq("tutor_id", tutorId)
    .in("status", ["active", "paused"]);
  const learnerIds = (assignments.data ?? []).map((row) => String(row.learner_id));
  const profiles = learnerIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, full_name, rythme_alternance").in("id", learnerIds)
    : { data: [] };
  const people = new Map((profiles.data ?? []).map((row) => {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || String(row.full_name ?? "Alternant");
    return [String(row.id), { name, rythme: row.rythme_alternance ? String(row.rythme_alternance) : null }];
  }));

  const enrollments = learnerIds.length
    ? await supabase.from("class_enrollments").select("class_id, student_id").in("student_id", learnerIds)
    : { data: [] };
  const classIds = [...new Set((enrollments.data ?? []).map((row) => String(row.class_id)))];
  const slots = classIds.length
    ? await supabase
        .from("school_planning_slots")
        .select("id, class_id, starts_at, status")
        .in("class_id", classIds)
        .gte("starts_at", `${from}T00:00:00`)
        .lte("starts_at", `${to}T23:59:59`)
    : { data: [] };
  const absences = learnerIds.length
    ? await supabase.from("school_absences").select("learner_id, slot_id, status").in("learner_id", learnerIds)
    : { data: [] };
  const appointments = await supabase
    .from("tutor_appointments")
    .select("id, apprentice_id, type, starts_at, ends_at, location, is_remote, notes")
    .eq("tutor_id", tutorId)
    .gte("starts_at", `${from}T00:00:00`)
    .lte("starts_at", `${to}T23:59:59`);

  const classesOf = new Map<string, string[]>();
  for (const row of enrollments.data ?? []) {
    const list = classesOf.get(String(row.student_id)) ?? [];
    list.push(String(row.class_id));
    classesOf.set(String(row.student_id), list);
  }
  const slotDay = new Map((slots.data ?? []).map((row) => [String(row.id), String(row.starts_at).slice(0, 10)]));

  const students = learnerIds.map((id) => {
    const person = people.get(id);
    const mine = new Set(classesOf.get(id) ?? []);
    const school = new Set(
      (slots.data ?? [])
        .filter((row) => mine.has(String(row.class_id)) && row.status !== "cancelled")
        .map((row) => String(row.starts_at).slice(0, 10)),
    );
    const absent = new Set(
      (absences.data ?? [])
        .filter((row) => String(row.learner_id) === id && row.status !== "refused")
        .map((row) => slotDay.get(String(row.slot_id)))
        .filter((day): day is string => Boolean(day) && day >= from && day <= to),
    );
    const rhythmMissing = !person?.rythme && school.size === 0;
    return {
      id,
      name: person?.name ?? "Alternant",
      initials: initials(person?.name ?? "A"),
      rhythmMissing,
      cells: days.map((date) => {
        const day = key(date);
        const place = absent.has(day) ? "absent" : school.has(day) ? "ecole" : person?.rythme || school.size > 0 ? "entreprise" : "unknown";
        const notes = (relationMissing(appointments.error) ? [] : appointments.data ?? [])
          .filter((row) => String(row.apprentice_id) === id && String(row.starts_at).slice(0, 10) === day)
          .map((row) => {
            const hour = new Date(String(row.starts_at)).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
            const label = row.type === "tripartite" ? "Visite" : row.type === "monthly" ? "Point" : row.type === "onboarding" ? "Intégration" : "Rendez-vous";
            return `${label} ${hour}`;
          });
        return {
          date: day,
          label: date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
          place,
          notes,
        };
      }),
    };
  });

  const upcomingQuery = await supabase
    .from("tutor_appointments")
    .select("id, apprentice_id, type, starts_at")
    .eq("tutor_id", tutorId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(5);
  const upcoming = relationMissing(upcomingQuery.error)
    ? []
    : (upcomingQuery.data ?? []).map((row) => {
        const date = new Date(String(row.starts_at));
        const name = people.get(String(row.apprentice_id))?.name ?? "Alternant";
        const title = row.type === "tripartite" ? "Visite tripartite" : row.type === "monthly" ? "Point mensuel" : row.type === "onboarding" ? "Entretien d'intégration" : "Rendez-vous";
        return {
          id: String(row.id),
          day: String(date.getDate()),
          month: date.toLocaleDateString("fr-FR", { month: "short" }),
          title: `${title} · ${name}`,
          detail: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          href: "/dashboard/tuteur/calendrier",
          action: "Préparer",
        };
      });

  return {
    anchor: key(start),
    weekLabel: `Semaine du ${start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
    apprentices: learnerIds.map((id) => ({ id, name: people.get(id)?.name ?? "Alternant" })),
    students,
    upcoming,
  };
}
