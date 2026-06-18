import { NextRequest, NextResponse } from "next/server";
import { buildEmployeeInsertRow } from "@/lib/entreprise/employees-insert";
import {
  buildCollaboratorInviteMetadata,
  buildCollaboratorSetPasswordUrl,
} from "@/lib/entreprise/collaborator-invite";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import {
  resolveAuthUserIdByEmail,
  syncCollaboratorProfileAfterInvite,
} from "@/lib/entreprise/sync-collaborator-profile";
import { sendCollaboratorInviteEmail } from "@/lib/onboarding/emails";
import { appOrigin } from "@/lib/onboarding/slug";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json(
      { error: "Mode aperçu super admin — aucune organisation liée pour créer un collaborateur" },
      { status: 400 },
    );
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée", needsOnboarding: true }, { status: 400 });
  }

  const orgId = access.organizationId;
  let body: {
    first_name?: string;
    last_name?: string;
    email?: string;
    department?: string;
    job_title?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const first_name = String(body.first_name ?? "").trim();
  const last_name = String(body.last_name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const department = String(body.department ?? "").trim() || null;
  const job_title = String(body.job_title ?? "").trim() || null;

  if (!first_name || !last_name || !email || !email.includes("@")) {
    return NextResponse.json({ error: "Prénom, nom et email valides requis" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: org } = await service.from("organizations").select("name").eq("id", orgId).maybeSingle();

  const insertRow = buildEmployeeInsertRow({
    company_id: orgId,
    first_name,
    last_name,
    email,
    department,
    job_title,
  });

  const { data: employee, error: insertErr } = await service
    .from("employees")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  let inviteSent = false;
  try {
    const origin = appOrigin();
    const redirectTo =
      process.env.NEXT_PUBLIC_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      origin;
    const siteBase = redirectTo.replace(/\/$/, "");
    const setPasswordUrl = buildCollaboratorSetPasswordUrl(siteBase);
    const inviteMetadata = buildCollaboratorInviteMetadata({
      firstName: first_name,
      lastName: last_name,
      organizationId: orgId,
      employeeId: employee.id,
    });
    const { data: inviteData, error: inviteErr } = await service.auth.admin.inviteUserByEmail(email, {
      data: inviteMetadata,
      redirectTo: setPasswordUrl,
    });
    const invitedUserId = inviteData?.user?.id ?? (await resolveAuthUserIdByEmail(service, email));
    if (invitedUserId) {
      await service.auth.admin.updateUserById(invitedUserId, {
        user_metadata: inviteMetadata,
      });
      await syncCollaboratorProfileAfterInvite(service, {
        userId: invitedUserId,
        email,
        firstName: first_name,
        lastName: last_name,
        organizationId: orgId,
        employeeId: employee.id,
      });
    }
    if (!inviteErr) {
      await sendCollaboratorInviteEmail({
        email,
        firstName: first_name,
        companyName: String((org as { name?: string })?.name ?? "votre entreprise"),
        inviteLink: setPasswordUrl,
      });
      inviteSent = true;
    }
  } catch {
    /* invitation optionnelle */
  }

  return NextResponse.json({ id: employee.id, invite_sent: inviteSent });
}
