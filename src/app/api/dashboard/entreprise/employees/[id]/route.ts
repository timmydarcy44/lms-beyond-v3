import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DiagnosticPayload = {
  id: string;
  employee_id: string;
  created_at: string;
  idmc_score: number | null;
  results: Partial<
    Record<"stress" | "organisation" | "communication" | "decision" | "leadership", number>
  > | null;
};

function mapCollaborateurDiagnostic(row: Record<string, unknown>): DiagnosticPayload {
  const stress = row.stress_score != null ? Number(row.stress_score) : null;
  return {
    id: String(row.id),
    employee_id: String(row.employee_id ?? ""),
    created_at: String(row.completed_at ?? row.created_at ?? new Date().toISOString()),
    idmc_score: row.idmc_score != null ? Number(row.idmc_score) : null,
    results: stress != null ? { stress } : null,
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

  const diagnostics = (diagRows ?? []).map((row) =>
    mapCollaborateurDiagnostic(row as Record<string, unknown>),
  );

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

  return NextResponse.json({
    employee,
    diagnostics,
    recommended_action: recommendedAction,
  });
}
