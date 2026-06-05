import { NextRequest, NextResponse } from "next/server";
import {
  diagnosticsHaveData,
  hasAnyTestResults,
  loadEmployeeTestResults,
  testResultsToDiagnostic,
  type EmployeeDiagnosticPayload,
  type EmployeeTestResults,
} from "@/lib/entreprise/employee-profile-diagnostics";
import { resolveAndLinkEmployeeProfile, resolveEmployeeProfileWithTests } from "@/lib/entreprise/resolve-employee-profile";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function mapCollaborateurDiagnostic(row: Record<string, unknown>): EmployeeDiagnosticPayload {
  const stress = row.stress_score != null ? Number(row.stress_score) : null;
  return {
    id: String(row.id),
    employee_id: String(row.employee_id ?? ""),
    created_at: String(row.completed_at ?? row.created_at ?? new Date().toISOString()),
    idmc_score: row.idmc_score != null ? Number(row.idmc_score) : null,
    results: stress != null ? { stress } : null,
    source: "collaborateur_diagnostics",
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
    .select("id, first_name, last_name, email, job_title, department, profile_id, company_id")
    .eq("id", employeeId)
    .eq("company_id", orgId)
    .maybeSingle();

  if (empErr) {
    console.error("[employees/[id]] employee", empErr);
    return NextResponse.json({ error: empErr.message }, { status: 400 });
  }
  if (!employee) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }

  const profileId = await resolveEmployeeProfileWithTests(service, employee, async (pid) => {
    const tr = await loadEmployeeTestResults(service, pid);
    return { hasTests: hasAnyTestResults(tr) };
  });

  const { data: diagRows, error: diagErr } = await service
    .from("collaborateur_diagnostics")
    .select("id, employee_id, completed_at, created_at, idmc_score, stress_score")
    .eq("employee_id", employeeId)
    .eq("organisation_id", orgId)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(12);

  if (diagErr) {
    console.warn("[employees/[id]] collaborateur_diagnostics", diagErr.message);
  }

  let diagnostics = (diagRows ?? []).map((row) =>
    mapCollaborateurDiagnostic(row as Record<string, unknown>),
  );

  let testResults: EmployeeTestResults = {
    disc: null,
    idmc_score: null,
    idmc_axes: null,
    soft_skills: [],
    updated_at: null,
  };

  if (profileId) {
    testResults = await loadEmployeeTestResults(service, profileId);
    if (!diagnosticsHaveData(diagnostics)) {
      const fromProfile = testResultsToDiagnostic(testResults, employeeId);
      if (fromProfile) diagnostics = [fromProfile, ...diagnostics];
    }
  }

  const hasDiagnostics = diagnosticsHaveData(diagnostics) || hasAnyTestResults(testResults);

  let recommendedAction: {
    id: string;
    title: string;
    dimension_key: string;
    description: string | null;
  } | null = null;

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

  return NextResponse.json({
    employee: { ...employee, profile_id: profileId ?? employee.profile_id },
    diagnostics,
    test_results: testResults,
    has_diagnostics: hasDiagnostics,
    recommended_action: recommendedAction,
    missions: missions ?? [],
  });
}
