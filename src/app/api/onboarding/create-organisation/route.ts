import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendOnboardingEmails } from "@/lib/onboarding/emails";
import { generateOrgSlug, appOrigin } from "@/lib/onboarding/slug";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  company_name?: string;
  drh_email?: string;
  drh_name?: string;
  estimated_users?: number;
  deal_id?: string;
};

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Admin", last: "RH" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service Supabase indisponible" }, { status: 503 });
  }

  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const company_name = String(body.company_name ?? "").trim();
  const drh_email = String(body.drh_email ?? "").trim().toLowerCase();
  const drh_name = String(body.drh_name ?? "").trim();
  const deal_id = String(body.deal_id ?? "").trim();
  const estimated_users =
    body.estimated_users != null && Number.isFinite(Number(body.estimated_users))
      ? Number(body.estimated_users)
      : null;

  if (!company_name || !drh_email || !drh_name || !deal_id) {
    return NextResponse.json(
      { error: "company_name, drh_email, drh_name et deal_id sont requis" },
      { status: 400 },
    );
  }

  const { data: deal, error: dealErr } = await service
    .from("crm_pipeline_deals")
    .select("id, organization_id, company_name")
    .eq("id", deal_id)
    .maybeSingle();

  if (dealErr || !deal) {
    return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });
  }
  if (deal.organization_id) {
    return NextResponse.json(
      { error: "Organisation déjà créée pour ce deal", organization_id: deal.organization_id },
      { status: 409 },
    );
  }

  const slug = generateOrgSlug(company_name);
  const { data: organisation, error: orgErr } = await service
    .from("organizations")
    .insert({
      name: company_name,
      slug,
      estimated_users,
      onboarding_step: "invite_sent",
      created_from_deal: deal_id,
    })
    .select("id, name, slug")
    .single();

  if (orgErr || !organisation) {
    return NextResponse.json({ error: orgErr?.message ?? "Création organisation impossible" }, { status: 500 });
  }

  const orgId = organisation.id as string;
  const origin = appOrigin();
  const redirectTo = `${origin}/onboarding/${orgId}`;

  const { first, last } = splitName(drh_name);
  const { data: invite, error: inviteErr } = await service.auth.admin.inviteUserByEmail(drh_email, {
    data: {
      organization_id: orgId,
      role: "admin_hr",
      full_name: drh_name,
      onboarding_pending: true,
    },
    redirectTo,
  });

  if (inviteErr) {
    await service.from("organizations").delete().eq("id", orgId);
    return NextResponse.json({ error: inviteErr.message }, { status: 500 });
  }

  const userId = invite.user?.id;
  if (userId) {
    await service.from("profiles").upsert({
      id: userId,
      email: drh_email,
      full_name: drh_name,
      first_name: first,
      last_name: last,
      role: "admin",
      role_type: "entreprise",
      company_id: orgId,
    });
    await service.from("org_memberships").upsert({
      org_id: orgId,
      user_id: userId,
      role: "admin",
    });
  }

  const today = new Date().toLocaleDateString("fr-FR");
  const { error: dealUpErr } = await service
    .from("crm_pipeline_deals")
    .update({
      organization_id: orgId,
      stage_slug: "client_actif",
      notes: `Organisation créée le ${today}. DRH invité : ${drh_email}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deal_id);

  if (dealUpErr) {
    console.error("[onboarding] deal update:", dealUpErr);
  }

  try {
    await sendOnboardingEmails({
      companyName: company_name,
      drhEmail: drh_email,
      drhName: drh_name,
      estimatedUsers: estimated_users,
      dealId: deal_id,
      organisationId: orgId,
      activationLink: redirectTo,
    });
  } catch (e) {
    console.error("[onboarding] emails:", e);
  }

  return NextResponse.json({
    success: true,
    organisation: { id: orgId, name: organisation.name, slug: organisation.slug },
    organisation_id: orgId,
  });
}
