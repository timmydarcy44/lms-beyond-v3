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

  const { data: org } = await db
    .from("organizations")
    .select("id, name, logo_url, company_size_band, edge_profile_completed")
    .eq("id", orgId)
    .maybeSingle();

  const edgeProfileCompleted = Boolean((org as { edge_profile_completed?: boolean } | null)?.edge_profile_completed);
  const needsProfileCompletion = isEdgeEntreprise && !edgeProfileCompleted;

  return NextResponse.json({
    needs_profile_completion: needsProfileCompletion,
    is_edge_entreprise_signup: isEdgeEntreprise,
    organization_id: orgId,
    onboarding_href: `/onboarding/${orgId}`,
    prefill: {
      company_name: String((org as { name?: string } | null)?.name ?? meta.company_name ?? "").trim(),
      first_name: String(profile?.first_name ?? meta.first_name ?? "").trim(),
      last_name: String(profile?.last_name ?? meta.last_name ?? "").trim(),
      email: String(profile?.email ?? user.email ?? "").trim(),
      job_title: String(profile?.poste_actuel ?? "").trim(),
      company_size_band: String((org as { company_size_band?: string } | null)?.company_size_band ?? "").trim(),
      logo_url: String((org as { logo_url?: string } | null)?.logo_url ?? "").trim() || null,
    },
  });
}
