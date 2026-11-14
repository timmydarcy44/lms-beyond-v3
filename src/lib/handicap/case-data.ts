import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasAnyTestResults,
  loadEmployeeTestResults,
} from "@/lib/entreprise/employee-profile-diagnostics";
import { decryptDisabilityNotes } from "@/lib/handicap/notes-crypto";
import {
  type DisabilityCaseContext,
  type DisabilityCaseDetail,
  type DisabilityCaseTests,
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

const EMPTY_CONTEXT: DisabilityCaseContext = {
  email: null,
  jobTitle: null,
  department: null,
  specialization: null,
  alternanceStatus: null,
  hostCompanyName: null,
  rqthDeclared: false,
  needsSummary: null,
  contactMessage: null,
};

const EMPTY_TESTS: DisabilityCaseTests = {
  disc: null,
  idmcScore: null,
  idmcAxes: null,
  softSkills: [],
};

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

  let accommodations: Array<Record<string, unknown>> | null = null;
  let actions: Array<Record<string, unknown>> | null = null;
  let meetings: Array<Record<string, unknown>> | null = null;
  let documents: Array<Record<string, unknown>> | null = null;
  let partners: Array<Record<string, unknown>> | null = null;
  let accessLog: Array<Record<string, unknown>> | null = null;

  try {
    const results = await Promise.all([
      service
        .from("disability_accommodations")
        .select("id, category, label, details, shared_with_trainer_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true }),
      service
        .from("disability_actions")
        .select("id, label, owner, due_date, status, done_at")
        .eq("case_id", caseId)
        .order("due_date", { ascending: true }),
      service
        .from("disability_meetings")
        .select("id, title, scheduled_at, mode, notes_enc, status, closed_at")
        .eq("case_id", caseId)
        .order("scheduled_at", { ascending: false }),
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
    accommodations = (results[0].data as Array<Record<string, unknown>> | null) ?? null;
    actions = (results[1].data as Array<Record<string, unknown>> | null) ?? null;
    meetings = (results[2].data as Array<Record<string, unknown>> | null) ?? null;
    documents = (results[3].data as Array<Record<string, unknown>> | null) ?? null;
    partners = (results[4].data as Array<Record<string, unknown>> | null) ?? null;
    accessLog = (results[5].data as Array<Record<string, unknown>> | null) ?? null;
  } catch (err) {
    console.error("[disability] load related", caseId, err instanceof Error ? err.message : err);
  }

  let personName = "Personne";
  let personFirstName = "la personne";
  let organizationName: string | null = null;
  let roleLine =
    c.scope === "school" ? "Alternant · Byound School" : "Salarié · Entreprise · Business";
  let profileId: string | null = c.person_profile_id ? String(c.person_profile_id) : null;
  const context: DisabilityCaseContext = { ...EMPTY_CONTEXT };

  const contactFromAcc = (accommodations ?? []).find(
    (a) => String(a.label ?? "") === "Message à la référente",
  );
  if (contactFromAcc?.details) {
    context.contactMessage = String(contactFromAcc.details);
  }

  if (c.employee_id) {
    const { data: emp } = await service
      .from("employees")
      .select(
        "first_name, last_name, company_id, job_title, department, email, profile_id, rqth, rqth_needs_summary",
      )
      .eq("id", c.employee_id)
      .maybeSingle();
    if (emp) {
      personName =
        [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim() || personName;
      personFirstName = String(emp.first_name ?? "").trim() || personFirstName;
      profileId = emp.profile_id ? String(emp.profile_id) : profileId;
      context.email = emp.email ? String(emp.email) : null;
      context.jobTitle = emp.job_title ? String(emp.job_title) : null;
      context.department = emp.department ? String(emp.department) : null;
      context.rqthDeclared = Boolean(emp.rqth);
      context.needsSummary = emp.rqth_needs_summary
        ? String(emp.rqth_needs_summary)
        : context.needsSummary;
      const orgId = c.organization_id || emp.company_id;
      if (orgId) {
        const { data: org } = await service
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .maybeSingle();
        organizationName = org?.name ? String(org.name) : null;
      }
      roleLine = [
        "Salarié",
        context.jobTitle,
        organizationName,
        "Business",
      ]
        .filter(Boolean)
        .join(" · ");
    }
  } else if (c.cfa_application_id) {
    let app: Record<string, unknown> | null = null;
    {
      const full = await service
        .from("cfa_applications")
        .select(
          "first_name, last_name, email, profile_id, specialization, status, alternance_status",
        )
        .eq("id", c.cfa_application_id)
        .maybeSingle();
      if (full.error) {
        const basic = await service
          .from("cfa_applications")
          .select("first_name, last_name, email, profile_id, specialization, status")
          .eq("id", c.cfa_application_id)
          .maybeSingle();
        app = (basic.data as Record<string, unknown> | null) ?? null;
      } else {
        app = (full.data as Record<string, unknown> | null) ?? null;
      }
    }
    if (app) {
      personName =
        [app.first_name, app.last_name].filter(Boolean).join(" ").trim() || personName;
      personFirstName = String(app.first_name ?? "").trim() || personFirstName;
      profileId = app.profile_id ? String(app.profile_id) : profileId;
      context.email = app.email ? String(app.email) : null;
      context.specialization = app.specialization ? String(app.specialization) : null;
      context.alternanceStatus = app.alternance_status
        ? String(app.alternance_status)
        : app.status
          ? String(app.status)
          : null;
      roleLine = [
        "Alternant",
        context.specialization,
        "Byound School",
      ]
        .filter(Boolean)
        .join(" · ");
      organizationName = "Byound School";

      try {
        const { data: placement } = await service
          .from("apprentice_placements")
          .select("company_id, status")
          .eq("apprentice_id", c.cfa_application_id)
          .in("status", ["pending", "active"])
          .limit(1)
          .maybeSingle();
        if (placement?.company_id) {
          const { data: host } = await service
            .from("cfa_companies")
            .select("company_name")
            .eq("id", placement.company_id)
            .maybeSingle();
          context.hostCompanyName = host?.company_name ? String(host.company_name) : null;
        }
      } catch {
        /* table optionnelle */
      }
    }
  } else if (c.person_profile_id) {
    const { data: p } = await service
      .from("profiles")
      .select("first_name, last_name, full_name, email")
      .eq("id", c.person_profile_id)
      .maybeSingle();
    if (p) {
      personName =
        String(p.full_name ?? "").trim() ||
        [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
        personName;
      personFirstName = String(p.first_name ?? "").trim() || personFirstName;
      context.email = p.email ? String(p.email) : null;
    }
    const { data: empByProfile } = await service
      .from("employees")
      .select("job_title, department, rqth, rqth_needs_summary, company_id")
      .eq("profile_id", c.person_profile_id)
      .limit(1)
      .maybeSingle();
    if (empByProfile) {
      context.jobTitle = empByProfile.job_title ? String(empByProfile.job_title) : null;
      context.department = empByProfile.department
        ? String(empByProfile.department)
        : null;
      context.rqthDeclared = Boolean(empByProfile.rqth);
      context.needsSummary = empByProfile.rqth_needs_summary
        ? String(empByProfile.rqth_needs_summary)
        : null;
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

  let tests: DisabilityCaseTests = { ...EMPTY_TESTS };
  if (profileId) {
    try {
      const raw = await loadEmployeeTestResults(service, profileId);
      if (hasAnyTestResults(raw)) {
        tests = {
          disc: raw.disc,
          idmcScore: raw.idmc_score,
          idmcAxes: raw.idmc_axes,
          softSkills: raw.soft_skills,
        };
      }
    } catch (err) {
      console.error(
        "[disability] load tests",
        caseId,
        err instanceof Error ? err.message : err,
      );
    }
  }

  const mappedAcc = (accommodations ?? []).map((a) => ({
    id: String(a.id),
    category: String(a.category),
    label: String(a.label),
    details: a.details ? String(a.details) : null,
    sharedWithTrainerAt: a.shared_with_trainer_at
      ? String(a.shared_with_trainer_at)
      : null,
  }));

  if (!context.needsSummary) {
    const demande = mappedAcc.find((a) => a.label === "Demande d'aménagement" && a.details);
    if (demande?.details) context.needsSummary = demande.details;
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
    nextFormation: context.specialization,
    stepIndex: statusToStepIndex(String(c.status)),
    context,
    tests,
    accommodations: mappedAcc,
    actions: (actions ?? []).map((a) => ({
      id: String(a.id),
      label: String(a.label),
      owner: String(a.owner),
      dueDate: a.due_date ? String(a.due_date) : null,
      status: String(a.status),
      doneAt: a.done_at ? String(a.done_at) : null,
    })),
    meetings: (meetings ?? []).map((m) => {
      let notes = "";
      try {
        notes = decryptDisabilityNotes(m.notes_enc ? String(m.notes_enc) : "");
      } catch (err) {
        console.error(
          "[disability] decrypt notes",
          m.id,
          err instanceof Error ? err.message : err,
        );
      }
      return {
        id: String(m.id),
        title: String(m.title ?? "Rendez-vous"),
        scheduledAt: m.scheduled_at ? String(m.scheduled_at) : null,
        mode: m.mode ? String(m.mode) : null,
        notes,
        status: String(m.status ?? "open"),
        closedAt: m.closed_at ? String(m.closed_at) : null,
      };
    }),
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
