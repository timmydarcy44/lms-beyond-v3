import { NextRequest, NextResponse } from "next/server";
import { isValidCompanySizeBand } from "@/lib/entreprise/company-size-bands";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

  const body = await request.json().catch(() => ({}));
  const companyName = String(body?.company_name ?? "").trim();
  const firstName = String(body?.first_name ?? "").trim();
  const lastName = String(body?.last_name ?? "").trim();
  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase();
  const jobTitle = String(body?.job_title ?? body?.poste ?? "").trim();
  const companySizeBand = String(body?.company_size_band ?? "").trim();
  const logoUrl = String(body?.logo_url ?? "").trim() || null;

  if (!companyName || !firstName || !lastName || !email || !jobTitle || !companySizeBand) {
    return NextResponse.json(
      { error: "Nom d'entreprise, identité, poste, email et taille sont requis." },
      { status: 400 },
    );
  }

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Email professionnel invalide." }, { status: 400 });
  }

  if (!isValidCompanySizeBand(companySizeBand)) {
    return NextResponse.json({ error: "Tranche d'effectif invalide." }, { status: 400 });
  }

  const service = await getServiceRoleClientOrFallback();
  const db = service ?? supabase;

  const { data: profile } = await db
    .from("profiles")
    .select("company_id, role, role_type")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = String(profile?.company_id ?? "").trim();
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable pour ce compte." }, { status: 404 });
  }

  const role = String(profile?.role ?? "").toLowerCase();
  const roleType = String(profile?.role_type ?? "").toLowerCase();
  if (role !== "entreprise" && roleType !== "entreprise" && role !== "admin" && roleType !== "admin_hr") {
    return NextResponse.json({ error: "Accès réservé aux comptes entreprise." }, { status: 403 });
  }

  const fullName = `${firstName} ${lastName}`.trim();

  const orgUpdate: Record<string, unknown> = {
    name: companyName,
    company_size_band: companySizeBand,
    edge_profile_completed: true,
    onboarding_step: "account_activated",
  };
  if (logoUrl) orgUpdate.logo_url = logoUrl;

  const { error: orgError } = await db.from("organizations").update(orgUpdate).eq("id", orgId);
  if (orgError) {
    if (orgError.message?.includes("edge_profile_completed") || orgError.message?.includes("company_size_band")) {
      const { error: fallbackOrgError } = await db
        .from("organizations")
        .update({ name: companyName, ...(logoUrl ? { logo_url: logoUrl } : {}) })
        .eq("id", orgId);
      if (fallbackOrgError) {
        return NextResponse.json({ error: fallbackOrgError.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }
  }

  const { error: profileError } = await db
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email,
      poste_actuel: jobTitle,
      role: "entreprise",
      role_type: "entreprise",
      entreprise: companyName,
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      company_name: companyName,
      role_type: "entreprise",
      account_type: "entreprise",
    },
  });

  return NextResponse.json({
    success: true,
    organization_id: orgId,
    redirect_to: `/onboarding/${orgId}`,
  });
}
