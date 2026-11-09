import { NextResponse } from "next/server";
import { isEdgeEntrepriseSignupMetadata } from "@/lib/auth/edge-signup-flow";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const isEdgeEntreprise =
    isEdgeEntrepriseSignupMetadata(meta) || String(meta.signup_source ?? "") === "edge_entreprises";

  const service = await getServiceRoleClientOrFallback();
  const db = service ?? supabase;

  const { data: profile } = await db
    .from("profiles")
    .select("id, email, first_name, last_name, full_name, poste_actuel, company_id, role, role_type")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = String(profile?.company_id ?? "").trim();
  if (!orgId) {
    return NextResponse.json({
      needs_profile_completion: false,
      is_edge_entreprise_signup: isEdgeEntreprise,
    });
  }

  const fullOrg = await db
    .from("organizations")
    .select(
      "id, name, logo_url, company_size_band, edge_profile_completed, siret, address_line, address_zip, address_city, formation_only",
    )
    .eq("id", orgId)
    .maybeSingle();
  let org = fullOrg.data as Record<string, unknown> | null;
  if (fullOrg.error) {
    const retry = await db
      .from("organizations")
      .select("id, name, logo_url, company_size_band, edge_profile_completed, siret")
      .eq("id", orgId)
      .maybeSingle();
    org = (retry.data as Record<string, unknown> | null) ?? null;
  }

  const edgeProfileCompleted = Boolean(org?.edge_profile_completed);
  const needsProfileCompletion = isEdgeEntreprise && !edgeProfileCompleted;
  const formationOnly = Boolean(org?.formation_only);

  return NextResponse.json({
    needs_profile_completion: needsProfileCompletion,
    is_edge_entreprise_signup: isEdgeEntreprise,
    formation_only: formationOnly,
    organization_id: orgId,
    onboarding_href: formationOnly
      ? "/dashboard/entreprise/formations/demander?from=signup"
      : `/onboarding/${orgId}`,
    prefill: {
      company_name: String(org?.name ?? meta.company_name ?? "").trim(),
      siret: String(org?.siret ?? meta.siret ?? "").trim(),
      address_line: String(org?.address_line ?? "").trim(),
      address_zip: String(org?.address_zip ?? "").trim(),
      address_city: String(org?.address_city ?? "").trim(),
      first_name: String(profile?.first_name ?? meta.first_name ?? "").trim(),
      last_name: String(profile?.last_name ?? meta.last_name ?? "").trim(),
      email: String(profile?.email ?? user.email ?? "").trim(),
      job_title: String(profile?.poste_actuel ?? "").trim(),
      company_size_band: String(org?.company_size_band ?? "").trim(),
      logo_url: String(org?.logo_url ?? "").trim() || null,
    },
  });
}
