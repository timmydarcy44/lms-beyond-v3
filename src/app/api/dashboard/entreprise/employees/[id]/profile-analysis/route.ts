import { NextRequest, NextResponse } from "next/server";
import { hasAnyTestResults, loadEmployeeTestResults } from "@/lib/entreprise/employee-profile-diagnostics";
import { resolveEmployeeTestStatus } from "@/lib/entreprise/employee-test-status";
import { hasAnyEnterpriseShareConsent } from "@/lib/entreprise/enterprise-share-consent";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { resolveProfileAnalysisForProfile } from "@/lib/learner/profile-analysis";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Analyse croisée DISC+IDMC+Soft Skills pour la fiche RH — réutilise le cache profiles.ai_analysis du salarié. */
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

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: employeeRow, error: empLookupErr } = await service
    .from("employees")
    .select("id, first_name, last_name, job_title, profile_id, company_id")
    .eq("id", employeeId)
    .maybeSingle();

  if (empLookupErr) return NextResponse.json({ error: empLookupErr.message }, { status: 400 });
  if (!employeeRow) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });

  const employeeCompanyId = String(employeeRow.company_id ?? "").trim();
  let orgId: string | null = null;

  if ("organizationId" in access && access.organizationId) {
    orgId = access.organizationId;
  } else if (
    ("superAdminPreview" in access && access.superAdminPreview) ||
    ("configurationRequired" in access && access.configurationRequired)
  ) {
    orgId = employeeCompanyId || null;
  }

  if (!orgId) {
    return NextResponse.json({ error: "Organisation non configurée" }, { status: 400 });
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

  if (!testStatus.profile_id) {
    return NextResponse.json({ error: "Profil collaborateur introuvable" }, { status: 404 });
  }

  if (!testStatus.share_consent) {
    return NextResponse.json(
      { error: "Consentement de partage entreprise requis", code: "consent_required" },
      { status: 403 },
    );
  }

  const consent = await service
    .from("collaborateur_entreprise_consentements")
    .select("consentement_donne, disc_shared, idmc_shared, soft_skills_shared")
    .eq("collaborateur_id", testStatus.profile_id)
    .eq("organisation_id", orgId)
    .maybeSingle();

  if (!hasAnyEnterpriseShareConsent(consent.data)) {
    return NextResponse.json(
      { error: "Consentement de partage entreprise requis", code: "consent_required" },
      { status: 403 },
    );
  }

  const results = await loadEmployeeTestResults(service, testStatus.profile_id);
  if (!hasAnyTestResults(results)) {
    return NextResponse.json({ error: "Aucun test partagé disponible" }, { status: 404 });
  }

  const firstName =
    String(employee.first_name ?? "").trim() ||
    String(employee.last_name ?? "").trim() ||
    "le collaborateur";

  try {
    const resolved = await resolveProfileAnalysisForProfile(service, testStatus.profile_id, {
      firstName,
      jobTitle: employee.job_title,
      discScores: (results.disc ?? {}) as Record<string, number>,
      idmcScores: results.idmc_axes ?? {},
      softSkillsTop: results.soft_skills.slice(0, 5),
    });

    return NextResponse.json({
      analysis: resolved.analysis,
      sections: resolved.sections,
      updatedAt: resolved.updatedAt,
      cached: resolved.cached,
    });
  } catch (error) {
    console.error("[enterprise/profile-analysis]", error);
    const message = error instanceof Error ? error.message : "Erreur inattendue";
    const status = message.includes("OpenAI") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
