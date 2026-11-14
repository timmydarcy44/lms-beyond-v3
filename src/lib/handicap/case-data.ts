import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptDisabilityNotes } from "@/lib/handicap/notes-crypto";
import {
  type DisabilityCaseContext,
  type DisabilityCaseDetail,
  statusToStepIndex,
} from "@/lib/handicap/case-types";
import { handicapSourceHref } from "@/lib/handicap/labels";
import { isAccompanimentPlanLabel } from "@/lib/handicap/plan-storage";
import { isInternalAccommodationLabel } from "@/lib/handicap/share-trainer-guard";
import { STATUS_LABELS } from "@/lib/handicap/theme";

export type { DisabilityCaseDetail } from "@/lib/handicap/case-types";
export {
  PIPELINE_STEPS,
  accommodationCategoryLabel,
  statusToStepIndex,
  ACTION_STATUS_LABEL,
  PARTNER_STATUS_LABEL,
  PARTNER_STATUS_ORDER,
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

/** VERDIER → Verdier ; Jean-PIERRE → Jean-Pierre */
export function toDisplayName(raw: string): string {
  return String(raw ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      part
        .split("-")
        .map((seg) => {
          if (!seg) return seg;
          const lower = seg.toLocaleLowerCase("fr-FR");
          return lower.charAt(0).toLocaleUpperCase("fr-FR") + lower.slice(1);
        })
        .join("-"),
    )
    .join(" ");
}

function uniqueJoin(parts: Array<string | null | undefined>): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const v = String(p ?? "").trim();
    if (!v) continue;
    const key = v.toLocaleLowerCase("fr-FR");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.join(" · ");
}

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
        .limit(40),
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
  let controlHref: string | null = null;
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
      const first = toDisplayName(String(emp.first_name ?? ""));
      const last = toDisplayName(String(emp.last_name ?? ""));
      personName = [first, last].filter(Boolean).join(" ").trim() || personName;
      personFirstName = first || personFirstName;
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
        controlHref = handicapSourceHref("employee", String(c.employee_id), String(orgId));
      }
      roleLine = uniqueJoin([
        "Salarié",
        organizationName,
        context.jobTitle,
        context.department,
        "Business",
      ]);
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
      const first = toDisplayName(String(app.first_name ?? ""));
      const last = toDisplayName(String(app.last_name ?? ""));
      personName = [first, last].filter(Boolean).join(" ").trim() || personName;
      personFirstName = first || personFirstName;
      profileId = app.profile_id ? String(app.profile_id) : profileId;
      context.email = app.email ? String(app.email) : null;
      context.specialization = app.specialization ? String(app.specialization) : null;
      context.alternanceStatus = app.alternance_status
        ? String(app.alternance_status)
        : app.status
          ? String(app.status)
          : null;
      organizationName = "Byound School";
      controlHref = handicapSourceHref("cfa_application", String(c.cfa_application_id));
      roleLine = uniqueJoin([
        "Alternant",
        organizationName,
        context.specialization,
        "Byound School",
      ]);

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
      const fromParts = [p.first_name, p.last_name]
        .filter(Boolean)
        .map((x) => toDisplayName(String(x)))
        .join(" ")
        .trim();
      personName =
        fromParts || toDisplayName(String(p.full_name ?? "").trim()) || personName;
      personFirstName =
        toDisplayName(String(p.first_name ?? "").trim()) || personFirstName;
      context.email = p.email ? String(p.email) : null;
    }
    const { data: empByProfile } = await service
      .from("employees")
      .select("id, job_title, department, rqth, rqth_needs_summary, company_id")
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
      if (empByProfile.company_id) {
        controlHref = handicapSourceHref(
          "employee",
          String(empByProfile.id),
          String(empByProfile.company_id),
        );
      }
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

  const mappedAccAll = (accommodations ?? []).map((a) => ({
    id: String(a.id),
    category: String(a.category),
    label: String(a.label),
    details: a.details ? String(a.details) : null,
    sharedWithTrainerAt: a.shared_with_trainer_at
      ? String(a.shared_with_trainer_at)
      : null,
  }));

  const planFromAcc = mappedAccAll.find((a) => isAccompanimentPlanLabel(a.label));
  const accompanimentPlanHtml =
    (typeof c.accompaniment_plan_html === "string" && c.accompaniment_plan_html.trim()
      ? String(c.accompaniment_plan_html)
      : null) ||
    planFromAcc?.details ||
    null;

  // Notes internes (besoins, messages) : hors liste aménagements.
  const mappedAcc = mappedAccAll.filter(
    (a) => !isAccompanimentPlanLabel(a.label) && !isInternalAccommodationLabel(a.label),
  );

  if (!context.needsSummary) {
    const needsAcc = mappedAccAll.find(
      (a) =>
        (a.label === "Besoins spécifiques" || a.label === "Demande d'aménagement") &&
        a.details,
    );
    if (needsAcc?.details) context.needsSummary = needsAcc.details;
  }

  const mappedDocs = (documents ?? []).map((d) => ({
    id: String(d.id),
    kind: String(d.kind),
    title: String(d.title),
    uploadedAt: String(d.uploaded_at),
    validUntil: d.valid_until ? String(d.valid_until) : null,
  }));
  const hasRqthDocument = mappedDocs.some((d) => d.kind === "rqth");

  const actorIds = [
    ...new Set(
      (accessLog ?? [])
        .map((l) => (l.actor_id ? String(l.actor_id) : null))
        .filter((x): x is string => Boolean(x)),
    ),
  ];
  const actorNameById = new Map<string, string>();
  if (actorIds.length) {
    const { data: actors } = await service
      .from("profiles")
      .select("id, first_name, last_name, full_name")
      .in("id", actorIds);
    for (const a of actors ?? []) {
      const fromParts = [a.first_name, a.last_name]
        .filter(Boolean)
        .map((x) => toDisplayName(String(x)))
        .join(" ")
        .trim();
      const name =
        fromParts || toDisplayName(String(a.full_name ?? "").trim()) || "Équipe Byound";
      actorNameById.set(String(a.id), name);
    }
  }

  // profileId volontairement non utilisé pour charger des tests — confidentialité /handicap.
  void profileId;

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
    consentRequestedAt:
      c.consent_requested_at != null ? String(c.consent_requested_at) : null,
    accompanimentPlanHtml,
    rqthValidUntil: c.rqth_valid_until ? String(c.rqth_valid_until) : null,
    hasRqthDocument,
    companyInformed: Boolean(c.company_informed),
    nextFormation: context.specialization,
    stepIndex: statusToStepIndex(String(c.status)),
    controlHref,
    context,
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
        title: String(m.title ?? "Entretien"),
        scheduledAt: m.scheduled_at ? String(m.scheduled_at) : null,
        mode: m.mode ? String(m.mode) : null,
        notes,
        status: String(m.status ?? "open"),
        closedAt: m.closed_at ? String(m.closed_at) : null,
      };
    }),
    documents: mappedDocs,
    partners: (partners ?? []).map((p) => ({
      id: String(p.id),
      partner: String(p.partner),
      status: p.status ? String(p.status) : "a_contacter",
      note: p.note ? String(p.note) : null,
    })),
    accessLog: (accessLog ?? []).map((l) => ({
      id: String(l.id),
      action: String(l.action),
      actorName: l.actor_id ? actorNameById.get(String(l.actor_id)) ?? null : null,
      createdAt: String(l.created_at),
    })),
  };
}
