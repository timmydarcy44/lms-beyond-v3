import { NextRequest, NextResponse } from "next/server";
import type { EnterpriseTestKind } from "@/lib/entreprise/enterprise-share-consent";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_TESTS = new Set<EnterpriseTestKind>(["disc", "idmc", "soft_skills"]);

async function resolveOrganisationId(userId: string, email?: string | null) {
  const service = getServiceRoleClient();
  if (!service) return null;

  const { data: profile } = await service
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.company_id) return String(profile.company_id);

  const { data: byProfile } = await service
    .from("employees")
    .select("company_id")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (byProfile?.company_id) return String(byProfile.company_id);

  if (email) {
    const { data: byEmail } = await service
      .from("employees")
      .select("company_id")
      .eq("email", email.trim().toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byEmail?.company_id) return String(byEmail.company_id);
  }

  return null;
}

export async function GET() {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ has_organisation: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const organisationId = await resolveOrganisationId(user.id, user.email);
  if (!organisationId) {
    return NextResponse.json({ has_organisation: false });
  }

  const { data } = await supabase
    .from("collaborateur_entreprise_consentements")
    .select("consentement_donne, disc_shared, idmc_shared, soft_skills_shared, consentement_date")
    .eq("collaborateur_id", user.id)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  return NextResponse.json({
    has_organisation: true,
    organisation_id: organisationId,
    consentement: Boolean(data?.consentement_donne),
    disc_shared: Boolean(data?.disc_shared),
    idmc_shared: Boolean(data?.idmc_shared),
    soft_skills_shared: Boolean(data?.soft_skills_shared),
    consentement_date: data?.consentement_date ?? null,
    rgpd_mention:
      "Vos résultats ne sont jamais communiqués à votre employeur sans votre accord explicite. Vous pouvez retirer ce consentement à tout moment depuis votre espace apprenant.",
  });
}

export async function POST(request: NextRequest) {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { consent?: boolean; test?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const test = String(body.test ?? "").trim() as EnterpriseTestKind;
  if (!VALID_TESTS.has(test)) {
    return NextResponse.json({ error: "Type de test invalide" }, { status: 400 });
  }

  const consent = Boolean(body.consent);
  const organisationId = await resolveOrganisationId(user.id, user.email);
  if (!organisationId) {
    return NextResponse.json({ error: "Aucune organisation liée" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("collaborateur_entreprise_consentements")
    .select("disc_shared, idmc_shared, soft_skills_shared, consentement_date")
    .eq("collaborateur_id", user.id)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  const nextDisc = test === "disc" ? consent : Boolean(existing?.disc_shared);
  const nextIdmc = test === "idmc" ? consent : Boolean(existing?.idmc_shared);
  const nextSoft = test === "soft_skills" ? consent : Boolean(existing?.soft_skills_shared);
  const anyShared = nextDisc || nextIdmc || nextSoft;

  const patch = {
    collaborateur_id: user.id,
    organisation_id: organisationId,
    disc_shared: nextDisc,
    idmc_shared: nextIdmc,
    soft_skills_shared: nextSoft,
    consentement_donne: anyShared,
    consentement_date: anyShared ? (existing?.consentement_date ?? now) : null,
    revocation_date: anyShared ? null : now,
    updated_at: now,
  };

  const { error } = await supabase
    .from("collaborateur_entreprise_consentements")
    .upsert(patch, { onConflict: "collaborateur_id,organisation_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, consent, test });
}
