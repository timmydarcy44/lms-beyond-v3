import type { SupabaseClient } from "@supabase/supabase-js";
import { sendOnboardingEmails } from "@/lib/onboarding/emails";
import {
  isEmailAlreadyRegisteredError,
  isMissingColumnError,
  OnboardingStepError,
} from "@/lib/onboarding/onboarding-errors";
import { generateOrgSlug, appOrigin } from "@/lib/onboarding/slug";

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Admin", last: "RH" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function stepError(
  step: string,
  error: string,
  detail: string,
  extra?: { status?: number; organization_id?: string },
): OnboardingStepError {
  return new OnboardingStepError({ step, error, detail, ...extra });
}

async function fetchDeal(
  service: SupabaseClient,
  dealId: string,
): Promise<{ id: string; company_name: string; organization_id: string | null } | null> {
  const withOrg = await service
    .from("crm_pipeline_deals")
    .select("id, company_name, organization_id")
    .eq("id", dealId)
    .maybeSingle();

  if (!withOrg.error && withOrg.data) {
    return withOrg.data as { id: string; company_name: string; organization_id: string | null };
  }

  if (isMissingColumnError(withOrg.error?.message)) {
    console.warn("[onboarding/fetch_deal] organization_id column missing:", withOrg.error.message);
    const basic = await service
      .from("crm_pipeline_deals")
      .select("id, company_name")
      .eq("id", dealId)
      .maybeSingle();
    if (basic.error || !basic.data) return null;
    return { ...(basic.data as { id: string; company_name: string }), organization_id: null };
  }

  if (withOrg.error) {
    console.error("[onboarding/fetch_deal]", withOrg.error);
  }

  return null;
}

async function insertOrganization(
  service: SupabaseClient,
  params: { name: string; slug: string; dealId: string; estimatedUsers: number | null },
): Promise<{ id: string; name: string; slug: string }> {
  const fullPayload = {
    name: params.name,
    slug: params.slug,
    estimated_users: params.estimatedUsers,
    onboarding_step: "invite_sent",
    created_from_deal: params.dealId,
  };

  let result = await service.from("organizations").insert(fullPayload).select("id, name, slug").single();

  if (result.error && isMissingColumnError(result.error.message)) {
    console.warn("[onboarding/insert_organization] colonnes onboarding absentes, fallback minimal");
    result = await service
      .from("organizations")
      .insert({ name: params.name, slug: params.slug })
      .select("id, name, slug")
      .single();
  }

  if (result.error || !result.data) {
    const detail = result.error?.message ?? "Impossible de créer l'organisation";
    throw stepError(
      "insert_organization",
      isMissingColumnError(detail)
        ? "Migration onboarding non appliquée (organizations.onboarding_step)"
        : "Échec création organisation",
      detail,
    );
  }

  return result.data as { id: string; name: string; slug: string };
}

async function resolveAuthUserId(
  service: SupabaseClient,
  email: string,
): Promise<string | null> {
  const { data: existingProfile } = await service
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingProfile?.id) return existingProfile.id as string;

  try {
    const { data: authUser, error } = await service.auth.admin.getUserByEmail(email);
    if (!error && authUser?.user?.id) return authUser.user.id;
    if (error) {
      console.warn("[onboarding] getUserByEmail:", error.message);
    }
  } catch (e) {
    console.warn("[onboarding] getUserByEmail exception:", e);
  }

  try {
    for (let page = 1; page <= 5; page++) {
      const { data: listData, error: listErr } = await service.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (listErr || !listData?.users?.length) break;
      const match = listData.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      if (match?.id) return match.id;
      if (listData.users.length < 200) break;
    }
  } catch (e) {
    console.warn("[onboarding] listUsers fallback:", e);
  }

  return null;
}

async function inviteDrhUser(
  service: SupabaseClient,
  params: { email: string; drhName: string; orgId: string },
): Promise<string | null> {
  const existingId = await resolveAuthUserId(service, params.email);
  if (existingId) return existingId;

  const origin = appOrigin();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(`/onboarding/${params.orgId}`)}`;

  const { data: invite, error: inviteErr } = await service.auth.admin.inviteUserByEmail(params.email, {
    data: {
      organization_id: params.orgId,
      role: "admin_hr",
      full_name: params.drhName,
      onboarding_pending: true,
    },
    redirectTo,
  });

  if (!inviteErr && invite?.user?.id) {
    return invite.user.id;
  }

  if (inviteErr) {
    console.error("[onboarding/invite_drh] inviteUserByEmail:", {
      message: inviteErr.message,
      status: inviteErr.status,
      code: inviteErr.code,
      email: params.email,
    });

    if (isEmailAlreadyRegisteredError(inviteErr.message)) {
      const existing = await resolveAuthUserId(service, params.email);
      if (existing) {
        console.log("[onboarding/invite_drh] email déjà en Auth, réutilisation user_id:", existing);
        return existing;
      }
      throw stepError(
        "invite_drh",
        "Cet email est déjà enregistré dans Supabase Auth sans profil lié",
        inviteErr.message,
      );
    }
  }

  const afterInvite = await resolveAuthUserId(service, params.email);
  if (afterInvite) return afterInvite;

  throw stepError(
    "invite_drh",
    "Invitation DRH impossible",
    inviteErr?.message ??
      "Vérifiez SUPABASE_SERVICE_ROLE_KEY et les paramètres Auth (inviteUserByEmail)",
  );
}

async function upsertDrhProfile(
  service: SupabaseClient,
  params: {
    userId: string;
    email: string;
    drhName: string;
    orgId: string;
  },
) {
  const { first, last } = splitName(params.drhName);
  const base: Record<string, unknown> = {
    id: params.userId,
    email: params.email,
    full_name: params.drhName,
    first_name: first,
    last_name: last,
    role: "admin",
    role_type: "admin_hr",
    company_id: params.orgId,
  };

  let err = (await service.from("profiles").upsert(base, { onConflict: "id" })).error;
  if (err?.code === "42703" || isMissingColumnError(err.message)) {
    const reduced = {
      id: params.userId,
      email: params.email,
      full_name: params.drhName,
      role: "admin",
    };
    err = (await service.from("profiles").upsert(reduced, { onConflict: "id" })).error;
  }
  if (err) {
    console.warn("[onboarding] profile upsert:", err.message);
  }

  const membership = await service.from("org_memberships").upsert(
    { org_id: params.orgId, user_id: params.userId, role: "admin" },
    { onConflict: "org_id,user_id" },
  );
  if (membership.error) {
    console.warn("[onboarding] org_memberships:", membership.error.message);
  }
}

async function linkDealToOrganization(
  service: SupabaseClient,
  dealId: string,
  orgId: string,
  drhEmail: string,
) {
  const today = new Date().toLocaleDateString("fr-FR");
  const notes = `Organisation créée le ${today}. DRH invité : ${drhEmail}`;

  const fullPatch = {
    organization_id: orgId,
    stage_slug: "client_actif",
    notes,
    updated_at: new Date().toISOString(),
  };

  let { error } = await service.from("crm_pipeline_deals").update(fullPatch).eq("id", dealId);

  if (error && (isMissingColumnError(error.message) || error.message.includes("stage_slug"))) {
    ({ error } = await service.from("crm_pipeline_deals").update({
      organization_id: orgId,
      notes,
      updated_at: new Date().toISOString(),
    }).eq("id", dealId));
  }

  if (error && isMissingColumnError(error.message)) {
    ({ error } = await service.from("crm_pipeline_deals").update({
      notes,
      updated_at: new Date().toISOString(),
    }).eq("id", dealId));
  }

  if (error) {
    console.warn("[onboarding] deal update:", error.message);
  }
}

export async function createOrganizationFromDeal(
  service: SupabaseClient,
  body: {
    company_name: string;
    drh_email: string;
    drh_name: string;
    estimated_users: number | null;
    deal_id: string;
  },
) {
  let step = "fetch_deal";
  try {
    const deal = await fetchDeal(service, body.deal_id);
    if (!deal) {
      throw stepError("fetch_deal", "Deal introuvable", `Aucun deal pour id=${body.deal_id}`);
    }
    if (deal.organization_id) {
      throw stepError(
        "fetch_deal",
        "Organisation déjà créée pour ce deal",
        `organization_id=${deal.organization_id}`,
        { status: 409, organization_id: deal.organization_id },
      );
    }

    step = "insert_organization";
    const slug = generateOrgSlug(body.company_name);
    const organisation = await insertOrganization(service, {
      name: body.company_name,
      slug,
      dealId: body.deal_id,
      estimatedUsers: body.estimated_users,
    });

    const orgId = organisation.id;
    const origin = appOrigin();
    const activationLink = `${origin}/onboarding/${orgId}`;

    step = "invite_drh";
    const userId = await inviteDrhUser(service, {
      email: body.drh_email,
      drhName: body.drh_name,
      orgId,
    });

    if (userId) {
      step = "upsert_profile";
      await upsertDrhProfile(service, {
        userId,
        email: body.drh_email,
        drhName: body.drh_name,
        orgId,
      });
    }

    step = "link_deal";
    await linkDealToOrganization(service, body.deal_id, orgId, body.drh_email);

    step = "send_emails";
    try {
      await sendOnboardingEmails({
        companyName: body.company_name,
        drhEmail: body.drh_email,
        drhName: body.drh_name,
        estimatedUsers: body.estimated_users,
        dealId: body.deal_id,
        organisationId: orgId,
        activationLink,
      });
    } catch (e) {
      console.error("[onboarding] emails:", e);
    }

    return { organisation, organisation_id: orgId };
  } catch (e) {
    if (e instanceof OnboardingStepError) throw e;

    const detail = e instanceof Error ? e.message : String(e);
    console.error(`[onboarding/createOrganizationFromDeal] step=${step}`, {
      detail,
      stack: e instanceof Error ? e.stack : undefined,
    });
    throw stepError(step, `Échec à l'étape ${step}`, detail);
  }
}
