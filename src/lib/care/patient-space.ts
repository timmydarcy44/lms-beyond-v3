import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import { formatPersonName } from "@/lib/care/person-name";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type PatientJourneyStep = {
  id: string;
  title: string;
  position: number;
  status: "done" | "current" | "todo";
  date: string | null;
};

export type PatientTask = {
  id: string;
  label: string;
  hint: string | null;
  doneAt: string | null;
};

export type PatientJourney = {
  id: string;
  title: string;
  subjectRelativeId: string | null;
  practitionerName: string;
  steps: PatientJourneyStep[];
  tasks: PatientTask[];
  note: { message: string; createdAt: string } | null;
  resource: { title: string; kind: string; durationMin: number | null; url: string } | null;
};

export type PatientInvoice = {
  id: string;
  number: string | null;
  amountCents: number;
  paidAt: string | null;
  method: string | null;
  issuedAt: string;
  subjectRelativeId: string | null;
  practitionerName: string;
};

const STATUSES = new Set(["done", "current", "todo"]);

export const loadPatientJourneys = cache(async function loadPatientJourneys(): Promise<PatientJourney[]> {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return [];
  const { data: journeys, error } = await db
    .from("care_journeys")
    .select("id, title, subject_relative_id, practitioner_id, created_at")
    .eq("patient_account_id", session.id)
    .order("created_at", { ascending: false });
  if (error || !journeys?.length) return [];
  const ids = journeys.map((row) => String(row.id));
  const practitionerIds = [...new Set(journeys.map((row) => String(row.practitioner_id)))];
  const [{ data: steps }, { data: tasks }, { data: notes }, { data: resources }, { data: profiles }] = await Promise.all([
    db.from("care_journey_steps").select("id, journey_id, title, position, status, step_date").in("journey_id", ids).order("position"),
    db.from("care_tasks").select("id, journey_id, label, hint, done_at, position").in("journey_id", ids).order("position"),
    db.from("care_notes_to_patient").select("journey_id, message, created_at").in("journey_id", ids).order("created_at", { ascending: false }),
    db.from("care_recommended_resources").select("journey_id, title, kind, duration_min, url, created_at").in("journey_id", ids).order("created_at", { ascending: false }),
    db.from("care_profiles").select("expert_id, display_name").in("expert_id", practitionerIds),
  ]);
  const names = new Map((profiles ?? []).map((row) => [String(row.expert_id), formatPersonName(String(row.display_name ?? ""))]));
  return journeys.map((journey) => {
    const id = String(journey.id);
    const note = (notes ?? []).find((row) => String(row.journey_id) === id);
    const resource = (resources ?? []).find((row) => String(row.journey_id) === id);
    return {
      id,
      title: String(journey.title),
      subjectRelativeId: journey.subject_relative_id ? String(journey.subject_relative_id) : null,
      practitionerName: names.get(String(journey.practitioner_id)) || "Votre praticien",
      steps: (steps ?? []).flatMap((row) => {
        if (String(row.journey_id) !== id) return [];
        const status = String(row.status);
        return [{
          id: String(row.id),
          title: String(row.title),
          position: Number(row.position) || 0,
          status: STATUSES.has(status) ? (status as PatientJourneyStep["status"]) : "todo",
          date: row.step_date ? String(row.step_date) : null,
        }];
      }),
      tasks: (tasks ?? []).flatMap((row) => {
        if (String(row.journey_id) !== id) return [];
        return [{
          id: String(row.id),
          label: String(row.label),
          hint: row.hint ? String(row.hint) : null,
          doneAt: row.done_at ? String(row.done_at) : null,
        }];
      }),
      note: note?.message ? { message: String(note.message), createdAt: String(note.created_at) } : null,
      resource: resource?.url
        ? {
            title: String(resource.title),
            kind: String(resource.kind || "Lecture"),
            durationMin: resource.duration_min == null ? null : Number(resource.duration_min),
            url: String(resource.url),
          }
        : null,
    };
  });
});

export const loadPatientInvoices = cache(async function loadPatientInvoices(): Promise<PatientInvoice[]> {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return [];
  const { data, error } = await db
    .from("expert_care_invoices")
    .select("id, number, amount_cents, paid_at, method, sent_at, created_at, subject_relative_id, expert_id")
    .eq("patient_account_id", session.id)
    .order("created_at", { ascending: false });
  if (error || !data?.length) return [];
  const expertIds = [...new Set(data.map((row) => String(row.expert_id)))];
  const { data: profiles } = await db.from("care_profiles").select("expert_id, display_name").in("expert_id", expertIds);
  const names = new Map((profiles ?? []).map((row) => [String(row.expert_id), formatPersonName(String(row.display_name ?? ""))]));
  return data.flatMap((row) => {
    const amount = Number(row.amount_cents);
    if (!Number.isFinite(amount)) return [];
    return [{
      id: String(row.id),
      number: row.number ? String(row.number) : null,
      amountCents: amount,
      paidAt: row.paid_at ? String(row.paid_at) : null,
      method: row.method ? String(row.method) : null,
      issuedAt: String(row.sent_at || row.created_at),
      subjectRelativeId: row.subject_relative_id ? String(row.subject_relative_id) : null,
      practitionerName: names.get(String(row.expert_id)) || "Votre praticien",
    }];
  });
});

export async function setPatientTaskDone(accountId: string, taskId: string, done: boolean) {
  const db = getServiceRoleClient();
  if (!db) return false;
  const { data: task } = await db.from("care_tasks").select("id, journey_id").eq("id", taskId).maybeSingle();
  if (!task) return false;
  const { data: journey } = await db
    .from("care_journeys")
    .select("id")
    .eq("id", task.journey_id)
    .eq("patient_account_id", accountId)
    .maybeSingle();
  if (!journey) return false;
  const { error } = await db
    .from("care_tasks")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", taskId);
  return !error;
}
