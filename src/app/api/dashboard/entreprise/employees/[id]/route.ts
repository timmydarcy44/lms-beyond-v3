import { NextRequest, NextResponse } from "next/server";
import {
  diagnosticsHaveData,
  hasAnyTestResults,
  loadEmployeeTestResults,
  testResultsToDiagnostic,
} from "@/lib/entreprise/employee-profile-diagnostics";
import {
  resolveEmployeeTestStatus,
  syncCollaborateurDiagnosticFromTests,
} from "@/lib/entreprise/employee-test-status";
import {
  computeSoftSkillGaps,
  parseMetierSoftSkillTargets,
} from "@/lib/entreprise/metier-skill-gaps";
import {
  buildEdgebsDemoEmployeeDetailPayload,
  isEdgebsDemoEmployeeId,
} from "@/lib/entreprise/edgebs-demo-enrich";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { foldSkillKey } from "@/lib/hard-skills/skill-catalog-policy";
import {
  getSkillDeclarationStatus,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import { getLearnerEarnedOpenBadges } from "@/lib/openbadges/learner-visible-badges";
import { listSalarieAssignedFormations } from "@/lib/salarie/assigned-formations";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { buildJadeEmployeeDetailPayload } from "@/lib/demo/jade-dashboard-mocks";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMPLOYEE_SELECTS = [
  "id, first_name, last_name, email, job_title, department, phone, hire_date, metier, profile_id, company_id, created_at",
  "id, first_name, last_name, email, job_title, department, phone, hire_date, profile_id, company_id, created_at",
  "id, first_name, last_name, email, job_title, department, profile_id, company_id, created_at",
];

async function loadEmployeeRow(
  service: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  employeeId: string,
) {
  let lastError: { message: string } | null = null;
  for (const columns of EMPLOYEE_SELECTS) {
    const result = await service.from("employees").select(columns).eq("id", employeeId).maybeSingle();
    if (!result.error) return result;
    lastError = result.error;
    if (!/phone|hire_date|metier|schema cache|column/i.test(result.error.message)) return result;
  }
  return { data: null, error: lastError };
}

function mapCollaborateurDiagnostic(row: Record<string, unknown>) {
  const stress = row.stress_score != null ? Number(row.stress_score) : null;
  return {
    id: String(row.id),
    employee_id: String(row.employee_id ?? ""),
    created_at: String(row.completed_at ?? row.created_at ?? new Date().toISOString()),
    idmc_score: row.idmc_score != null ? Number(row.idmc_score) : null,
    results: stress != null ? { stress } : null,
    source: "collaborateur_diagnostics" as const,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  if (!employeeId?.trim()) {
    return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });
  }

  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  // Collaborateurs mock EDGEBS (ids non-UUID) — ne jamais les passer à Postgres
  if (isEdgebsDemoEmployeeId(employeeId) || !UUID_RE.test(employeeId)) {
    if (isJadeDemoEmail(access.viewer.email)) {
      const jadePayload = buildJadeEmployeeDetailPayload(employeeId);
      if (jadePayload) return NextResponse.json(jadePayload);
    }
    if (isEdgebsDemoEmployeeId(employeeId)) {
      const demoPayload = buildEdgebsDemoEmployeeDetailPayload(employeeId);
      if (demoPayload) return NextResponse.json(demoPayload);
    }
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: employeeRow, error: empLookupErr } = await loadEmployeeRow(service, employeeId);

  if (empLookupErr) {
    return NextResponse.json({ error: empLookupErr.message }, { status: 400 });
  }
  if (!employeeRow) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  const employeeCompanyId = String(employeeRow.company_id ?? "").trim();
  let orgId: string | null = null;

  if ("organizationId" in access && access.organizationId) {
    orgId = access.organizationId;
  } else if ("superAdminPreview" in access && access.superAdminPreview) {
    orgId = employeeCompanyId || null;
  } else if ("configurationRequired" in access && access.configurationRequired) {
    orgId = employeeCompanyId || null;
  }

  if (!orgId) {
    return NextResponse.json(
      { error: "Organisation non configurée pour consulter cette fiche" },
      { status: 400 },
    );
  }

  if (
    "organizationId" in access &&
    access.organizationId &&
    employeeCompanyId &&
    employeeCompanyId !== access.organizationId
  ) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  const employee = employeeRow;

  const testStatus = await resolveEmployeeTestStatus(service, employee);
  const rawForConsent =
    testStatus.profile_id != null
      ? await loadEmployeeTestResults(service, testStatus.profile_id)
      : null;
  const pendingShareConsent =
    Boolean(testStatus.profile_id) &&
    !testStatus.share_consent &&
    hasAnyTestResults(rawForConsent ?? { disc: null, idmc_score: null, idmc_axes: null, soft_skills: [], updated_at: null });

  if (testStatus.share_consent) {
    await syncCollaborateurDiagnosticFromTests(service, employee, orgId, testStatus);
  }

  const { data: diagRows } = await service
    .from("collaborateur_diagnostics")
    .select("id, employee_id, completed_at, created_at, idmc_score, stress_score")
    .eq("employee_id", employeeId)
    .eq("organisation_id", orgId)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(12);

  let diagnostics = (diagRows ?? []).map((row) => mapCollaborateurDiagnostic(row as Record<string, unknown>));

  const fromProfile =
    testStatus.share_consent && hasAnyTestResults(testStatus.test_results)
      ? testResultsToDiagnostic(testStatus.test_results, employeeId)
      : null;

  if (fromProfile) {
    diagnostics = [fromProfile, ...diagnostics.filter((d) => d.source !== "profile_tests")];
  } else if (!diagnosticsHaveData(diagnostics) && testStatus.profile_id && testStatus.share_consent) {
    const fallback = testResultsToDiagnostic(testStatus.test_results, employeeId);
    if (fallback) diagnostics = [fallback, ...diagnostics];
  }

  if (!testStatus.share_consent) {
    diagnostics = [];
  } else if (!testStatus.has_idmc) {
    diagnostics = diagnostics.map((row) => ({ ...row, idmc_score: null, results: null }));
  }

  const hasDiagnostics =
    testStatus.share_consent && (testStatus.diagnostic_done || diagnosticsHaveData(diagnostics));

  let recommendedAction = null;
  const { data: linkRows } = await service
    .from("recommended_action_employees")
    .select("created_at, action:recommended_actions(id,title,dimension_key,description)")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(1);

  const linked = (linkRows?.[0] as { action?: unknown } | undefined)?.action;
  if (linked && typeof linked === "object" && linked !== null && !Array.isArray(linked)) {
    const a = linked as Record<string, unknown>;
    recommendedAction = {
      id: String(a.id ?? ""),
      title: String(a.title ?? ""),
      dimension_key: String(a.dimension_key ?? ""),
      description: a.description != null ? String(a.description) : null,
    };
  }

  const { data: missions } = await service
    .from("employee_missions")
    .select("id, title, description, due_date, status, created_at, updated_at")
    .eq("employee_id", employeeId)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  const { data: hrDocumentsRows, error: hrDocumentsErr } = await service
    .from("employee_hr_documents")
    .select("id, document_type, title, document_date, notes, file_url, file_name, created_at")
    .eq("employee_id", employeeId)
    .eq("organization_id", orgId)
    .order("document_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const hrDocuments =
    hrDocumentsErr && /employee_hr_documents|schema cache/i.test(hrDocumentsErr.message)
      ? []
      : (hrDocumentsRows ?? []);

  let metierMatch = null;
    const jobTitle = String(employee.job_title ?? "").trim();
    const metierName = String((employee as { metier?: string | null }).metier ?? "").trim() || jobTitle;
    if (metierName && orgId) {
    const { data: roleRows } = await service
      .from("enterprise_job_roles")
      .select("id, title, hard_skills, soft_skills")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(40);

    const matched =
      (roleRows ?? []).find((role) => String(role.title).toLowerCase() === metierName.toLowerCase()) ??
      (roleRows ?? []).find((role) =>
        String(role.title).toLowerCase().includes(metierName.toLowerCase()) ||
        metierName.toLowerCase().includes(String(role.title).toLowerCase()),
      ) ??
      null;

    if (matched) {
      const targets = parseMetierSoftSkillTargets(
        Array.isArray(matched.soft_skills) ? (matched.soft_skills as string[]) : [],
      );
      const softSkills = Array.isArray(testStatus.test_results?.soft_skills)
        ? testStatus.test_results.soft_skills
        : [];
      metierMatch = {
        id: String(matched.id),
        title: String(matched.title),
        hard_skills: Array.isArray(matched.hard_skills) ? matched.hard_skills : [],
        soft_skill_targets: targets,
        soft_skill_gaps: computeSoftSkillGaps(targets, softSkills),
      };
    }
  }

  let formationsInProgress = 0;
  let assignedFormations: Array<{ id: string; title: string; progress: number }> = [];
  let declaredSkills = 0;
  let badgesEarned = 0;
  let byoundSkills: Array<{ name: string; status: "declared" | "proof" | "badge" }> = [];
  const activity: Array<{ id: string; label: string; at: string }> = [];
  let shareConsentAt: string | null = null;
  const learnerId = String(testStatus.profile_id ?? employee.profile_id ?? "");
  const employeeCreatedAt = String((employee as { created_at?: string | null }).created_at ?? "");
  if (employeeCreatedAt) {
    activity.push({ id: "employee-added", label: "Collaborateur ajouté", at: employeeCreatedAt });
  }
  for (const diagnostic of diagnostics.slice(0, 3)) {
    if (diagnostic.source === "profile_tests" && !testStatus.test_results.updated_at) continue;
    if (!diagnostic.created_at) continue;
    activity.push({ id: `diagnostic-${diagnostic.id}`, label: "Diagnostic complété", at: diagnostic.created_at });
  }
  for (const doc of (hrDocuments as Array<Record<string, unknown>>).slice(0, 4)) {
    const at = String(doc.document_date || doc.created_at || "");
    if (!at) continue;
    const documentType = String(doc.document_type ?? "");
    const label =
      documentType === "bilan_annuel"
        ? "Bilan annuel"
        : documentType === "entretien_individuel"
          ? "Entretien"
          : String(doc.title ?? "") || "Document";
    activity.push({ id: `doc-${String(doc.id)}`, label, at });
  }

  if (learnerId) {
    try {
      const formations = await listSalarieAssignedFormations(
        learnerId,
        employee.email != null ? String(employee.email) : null,
      );
      assignedFormations = formations.map((item) => ({
        id: item.id,
        title: item.title,
        progress: item.progress,
      }));
      formationsInProgress = assignedFormations.filter((item) => item.progress < 100).length;
    } catch {
      formationsInProgress = 0;
    }

    const profileFull = await service
      .from("profiles")
      .select("hard_skills, skills_metadata")
      .eq("id", learnerId)
      .maybeSingle();
    const profileFallback =
      profileFull.error && /skills_metadata|schema cache|column/i.test(profileFull.error.message)
        ? await service.from("profiles").select("hard_skills").eq("id", learnerId).maybeSingle()
        : null;
    const profileRow = (profileFallback?.data ?? (profileFull.error ? null : profileFull.data)) as
      | { hard_skills?: unknown; skills_metadata?: unknown }
      | null;
    if (profileRow) {
      const names = Array.isArray(profileRow.hard_skills)
        ? profileRow.hard_skills.map((value) => String(value).trim()).filter(Boolean)
        : [];
      declaredSkills = names.length;
      const metadata =
        profileRow.skills_metadata && typeof profileRow.skills_metadata === "object"
          ? (profileRow.skills_metadata as Record<string, StoredHardSkillMeta>)
          : {};
      const metaByFold = new Map(Object.entries(metadata).map(([key, value]) => [foldSkillKey(key), value]));
      let earnedFolds = new Set<string>();
      try {
        const earned = await getLearnerEarnedOpenBadges(learnerId);
        badgesEarned = earned.length;
        earnedFolds = new Set(earned.map((badge) => foldSkillKey(badge.name)));
      } catch {
        badgesEarned = 0;
      }
      byoundSkills = names.map((name) => ({
        name,
        status: getSkillDeclarationStatus(metadata[name] ?? metaByFold.get(foldSkillKey(name)), {
          badgeEarned: earnedFolds.has(foldSkillKey(name)),
        }).key,
      }));
    }

    if (testStatus.share_consent) {
      const consent = await service
        .from("collaborateur_entreprise_consentements")
        .select("consentement_donne, consentement_date")
        .eq("collaborateur_id", learnerId)
        .eq("organisation_id", orgId)
        .maybeSingle();
      if (!consent.error && consent.data?.consentement_donne && consent.data.consentement_date) {
        shareConsentAt = String(consent.data.consentement_date);
        activity.push({ id: "results-shared", label: "Résultats partagés", at: shareConsentAt });
      }
    }

    const enrollments = await service
      .from("enrollments")
      .select("id, created_at")
      .eq("user_id", learnerId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (!enrollments.error) {
      for (const row of enrollments.data ?? []) {
        if (!row.created_at) continue;
        activity.push({
          id: `enrollment-${String(row.id)}`,
          label: "Formation assignée",
          at: String(row.created_at),
        });
      }
    }
  }

  activity.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return NextResponse.json({
    employee: { ...employee, profile_id: testStatus.profile_id ?? employee.profile_id },
    formations_in_progress: formationsInProgress,
    assigned_formations: assignedFormations,
    declared_skills: declaredSkills,
    badges_earned: badgesEarned,
    byound_skills: byoundSkills,
    activity: activity.slice(0, 5),
    diagnostics,
    test_results: testStatus.test_results,
    test_status: {
      has_disc: testStatus.has_disc,
      has_idmc: testStatus.has_idmc,
      has_soft_skills: testStatus.has_soft_skills,
      all_tests_done: testStatus.all_tests_done,
      share_consent: testStatus.share_consent,
      ...(testStatus.share_consent ? { share_consent_at: shareConsentAt } : {}),
    },
    pending_share_consent: pendingShareConsent,
    has_diagnostics: hasDiagnostics,
    recommended_action: recommendedAction,
    missions: missions ?? [],
    hr_documents: hrDocuments,
    metier_match: metierMatch,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  if (isEdgebsDemoEmployeeId(employeeId) || !UUID_RE.test(employeeId)) {
    return NextResponse.json({ error: "Action non disponible sur un profil démo" }, { status: 400 });
  }
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 400 });
  }

  let body: { phone?: string | null; hire_date?: string | null; job_title?: string | null; metier?: string | null } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const patch: Record<string, unknown> = {};
  if ("phone" in body) patch.phone = body.phone?.trim() || null;
  if ("hire_date" in body) patch.hire_date = body.hire_date?.trim() || null;
  if ("job_title" in body) patch.job_title = body.job_title?.trim() || null;
  if ("metier" in body) patch.metier = body.metier?.trim() || null;

  const { data: existing, error: existingError } = await service
    .from("employees")
    .select("id, company_id")
    .eq("id", employeeId)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });
  if (!existing) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  const companyId = String((existing as { company_id?: string | null }).company_id ?? "");
  if (companyId && companyId !== access.organizationId) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  const write = (fields: Record<string, unknown>) =>
    service.from("employees").update(fields).eq("id", employeeId).select("id").maybeSingle();

  let fields = { ...patch };
  let { data, error } = await write(fields);

  const optional = ["metier", "phone", "hire_date"] as const;
  for (const key of optional) {
    if (!error) break;
    if (!new RegExp(key, "i").test(error.message) || !(key in fields)) continue;
    const next = { ...fields };
    delete next[key];
    fields = next;
    if (Object.keys(fields).length === 0) break;
    ({ data, error } = await write(fields));
  }

  if (error && "job_title" in body) {
    ({ data, error } = await write({ job_title: body.job_title?.trim() || null }));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

  let readBack = await service
    .from("employees")
    .select("id, phone, job_title, hire_date, metier")
    .eq("id", employeeId)
    .maybeSingle();
  if (readBack.error && /metier|schema cache|column/i.test(readBack.error.message)) {
    readBack = await service
      .from("employees")
      .select("id, phone, job_title, hire_date")
      .eq("id", employeeId)
      .maybeSingle();
  }
  const stored = readBack.data as {
    phone?: string | null;
    job_title?: string | null;
    hire_date?: string | null;
    metier?: string | null;
  } | null;
  const phoneDigits = (value: string | null | undefined) => String(value ?? "").replace(/[^\d+]/g, "");
  const phoneUnsaved =
    "phone" in body &&
    (Boolean(readBack.error && /phone|column|schema cache/i.test(readBack.error.message)) ||
      (stored != null && phoneDigits(stored.phone) !== phoneDigits(body.phone?.trim() || null)));
  if ("job_title" in body && stored && (stored.job_title ?? null) !== (body.job_title?.trim() || null)) {
    return NextResponse.json({ error: "Impossible d'enregistrer le poste." }, { status: 400 });
  }

  return NextResponse.json({
    ...(phoneUnsaved
      ? { warning: "Le téléphone n'a pas été enregistré. Le poste et le métier le sont." }
      : {}),
    employee: {
      id: data.id,
      phone: stored?.phone ?? (body.phone?.trim() || null),
      hire_date: stored?.hire_date ?? (body.hire_date?.trim() || null),
      job_title: stored?.job_title ?? (body.job_title?.trim() || null),
      metier: stored && "metier" in stored ? stored.metier ?? null : body.metier?.trim() || null,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  if (isEdgebsDemoEmployeeId(employeeId) || !UUID_RE.test(employeeId)) {
    return NextResponse.json({ error: "Action non disponible sur un profil démo" }, { status: 400 });
  }
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { error } = await service
    .from("employees")
    .delete()
    .eq("id", employeeId)
    .eq("company_id", access.organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
