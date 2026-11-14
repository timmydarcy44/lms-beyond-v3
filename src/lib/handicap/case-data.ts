import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptDisabilityNotes } from "@/lib/handicap/notes-crypto";
import {
  type DisabilityCaseDetail,
  statusToStepIndex,
} from "@/lib/handicap/case-types";
import { STATUS_LABELS } from "@/lib/handicap/theme";

export type { DisabilityCaseDetail } from "@/lib/handicap/case-types";
export {
  PIPELINE_STEPS,
  accommodationCategoryLabel,
  statusToStepIndex,
  ACTION_STATUS_LABEL,
} from "@/lib/handicap/case-types";

export async function loadDisabilityCaseDetail(
  service: SupabaseClient,
  caseId: string,
): Promise<DisabilityCaseDetail | null> {
  const { data: c, error } = await service
    .from("disability_cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle();
  if (error || !c) return null;

  const [
    { data: accommodations },
    { data: actions },
    { data: meetings },
    { data: documents },
    { data: partners },
    { data: accessLog },
  ] = await Promise.all([
    service
      .from("disability_accommodations")
      .select("id, category, label, details, shared_with_trainer_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true }),
    service
      .from("disability_actions")
      .select("id, label, owner, due_date, status, done_at")
      .eq("case_id", caseId)
      .order("due_date", { ascending: true, nullsFirst: false }),
    service
      .from("disability_meetings")
      .select("id, title, scheduled_at, mode, notes_enc, status, closed_at")
      .eq("case_id", caseId)
      .order("scheduled_at", { ascending: false, nullsFirst: false }),
    service
      .from("disability_documents")
      .select("id, kind, title, uploaded_at, valid_until")
      .eq("case_id", caseId)
      .order("uploaded_at", { ascending: false }),
    service
      .from("disability_partners")
      .select("id, partner, status, note")
      .eq("case_id", caseId),
    service
      .from("disability_access_log")
      .select("id, action, actor_id, created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  let personName = "Personne";
  let personFirstName = "la personne";
  let organizationName: string | null = null;
  let roleLine =
    c.scope === "school" ? "Alternant · Byound School" : "Salarié · Entreprise · Business";

  if (c.employee_id) {
    const { data: emp } = await service
      .from("employees")
      .select("first_name, last_name, company_id")
      .eq("id", c.employee_id)
      .maybeSingle();
    if (emp) {
      personName =
        [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim() || personName;
      personFirstName = String(emp.first_name ?? "").trim() || personFirstName;
      const orgId = c.organization_id || emp.company_id;
      if (orgId) {
        const { data: org } = await service
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .maybeSingle();
        organizationName = org?.name ? String(org.name) : null;
      }
      roleLine = ["Salarié", organizationName, "Business"].filter(Boolean).join(" · ");
    }
  } else if (c.cfa_application_id) {
    const { data: app } = await service
      .from("cfa_applications")
      .select("first_name, last_name")
      .eq("id", c.cfa_application_id)
      .maybeSingle();
    if (app) {
      personName =
        [app.first_name, app.last_name].filter(Boolean).join(" ").trim() || personName;
      personFirstName = String(app.first_name ?? "").trim() || personFirstName;
    }
    roleLine = "Alternant · Byound School";
    organizationName = "Byound School";
  } else if (c.person_profile_id) {
    const { data: p } = await service
      .from("profiles")
      .select("first_name, last_name, full_name")
      .eq("id", c.person_profile_id)
      .maybeSingle();
    if (p) {
      personName =
        String(p.full_name ?? "").trim() ||
        [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
        personName;
      personFirstName = String(p.first_name ?? "").trim() || personFirstName;
    }
  }

  if (c.organization_id && !organizationName) {
    const { data: org } = await service
      .from("organizations")
      .select("name")
      .eq("id", c.organization_id)
      .maybeSingle();
    organizationName = org?.name ? String(org.name) : null;
  }

  return {
    id: String(c.id),
    status: String(c.status),
    statusLabel: STATUS_LABELS[String(c.status)] ?? String(c.status),
    scope: String(c.scope ?? "business"),
    personName,
    personFirstName,
    roleLine,
    organizationName,
    consentGivenAt: c.consent_given_at ? String(c.consent_given_at) : null,
    consentMethod: c.consent_method ? String(c.consent_method) : null,
    rqthValidUntil: c.rqth_valid_until ? String(c.rqth_valid_until) : null,
    companyInformed: Boolean(c.company_informed),
    nextFormation: null,
    stepIndex: statusToStepIndex(String(c.status)),
    accommodations: (accommodations ?? []).map((a) => ({
      id: String(a.id),
      category: String(a.category),
      label: String(a.label),
      details: a.details ? String(a.details) : null,
      sharedWithTrainerAt: a.shared_with_trainer_at
        ? String(a.shared_with_trainer_at)
        : null,
    })),
    actions: (actions ?? []).map((a) => ({
      id: String(a.id),
      label: String(a.label),
      owner: String(a.owner),
      dueDate: a.due_date ? String(a.due_date) : null,
      status: String(a.status),
      doneAt: a.done_at ? String(a.done_at) : null,
    })),
    meetings: (meetings ?? []).map((m) => ({
      id: String(m.id),
      title: String(m.title ?? "Rendez-vous"),
      scheduledAt: m.scheduled_at ? String(m.scheduled_at) : null,
      mode: m.mode ? String(m.mode) : null,
      notes: decryptDisabilityNotes(m.notes_enc ? String(m.notes_enc) : ""),
      status: String(m.status ?? "open"),
      closedAt: m.closed_at ? String(m.closed_at) : null,
    })),
    documents: (documents ?? []).map((d) => ({
      id: String(d.id),
      kind: String(d.kind),
      title: String(d.title),
      uploadedAt: String(d.uploaded_at),
      validUntil: d.valid_until ? String(d.valid_until) : null,
    })),
    partners: (partners ?? []).map((p) => ({
      id: String(p.id),
      partner: String(p.partner),
      status: p.status ? String(p.status) : null,
      note: p.note ? String(p.note) : null,
    })),
    accessLog: (accessLog ?? []).map((l) => ({
      id: String(l.id),
      action: String(l.action),
      actorId: l.actor_id ? String(l.actor_id) : null,
      createdAt: String(l.created_at),
    })),
  };
}
