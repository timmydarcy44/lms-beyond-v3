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
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ error: "Mode aperçu super admin" }, { status: 400 });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const orgId = access.organizationId;

  const { data: employee, error: empErr } = await service
    .from("employees")
    .select(
      "id, first_name, last_name, email, job_title, department, profile_id, company_id, created_at",
    )
    .eq("id", employeeId)
    .eq("company_id", orgId)
    .maybeSingle();

  if (empErr) {
    return NextResponse.json({ error: empErr.message }, { status: 400 });
  }
  if (!employee) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

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

  if (!diagnosticsHaveData(diagnostics) && testStatus.profile_id) {
    const fromProfile = testResultsToDiagnostic(testStatus.test_results, employeeId);
    if (fromProfile) diagnostics = [fromProfile, ...diagnostics];
  }

  const hasDiagnostics = testStatus.diagnostic_done || diagnosticsHaveData(diagnostics);

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

  const { data: hrDocuments } = await service
    .from("employee_hr_documents")
    .select("id, document_type, title, document_date, notes, file_url, file_name, created_at")
    .eq("employee_id", employeeId)
    .eq("organization_id", orgId)
    .order("document_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return NextResponse.json({
    employee: { ...employee, profile_id: testStatus.profile_id ?? employee.profile_id },
    diagnostics,
    test_results: testStatus.test_results,
    test_status: {
      has_disc: testStatus.has_disc,
      has_idmc: testStatus.has_idmc,
      has_soft_skills: testStatus.has_soft_skills,
      all_tests_done: testStatus.all_tests_done,
      share_consent: testStatus.share_consent,
    },
    pending_share_consent: pendingShareConsent,
    has_diagnostics: hasDiagnostics,
    recommended_action: recommendedAction,
    missions: missions ?? [],
    hr_documents: hrDocuments ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 400 });
  }

  let body: { phone?: string | null; hire_date?: string | null } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("phone" in body) patch.phone = body.phone?.trim() || null;
  if ("hire_date" in body) patch.hire_date = body.hire_date?.trim() || null;

  let updateQuery = service
    .from("employees")
    .update(patch)
    .eq("id", employeeId)
    .eq("company_id", access.organizationId);

  let { data, error } = await updateQuery.select("id").maybeSingle();

  if (error?.message?.includes("hire_date") || error?.message?.includes("phone")) {
    const safePatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    ({ data, error } = await service
      .from("employees")
      .update(safePatch)
      .eq("id", employeeId)
      .eq("company_id", access.organizationId)
      .select("id")
      .maybeSingle());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  return NextResponse.json({ employee: data });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
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
