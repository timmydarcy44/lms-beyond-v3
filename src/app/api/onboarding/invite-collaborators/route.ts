import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import {
  buildCollaboratorInviteMetadata,
  buildCollaboratorSetPasswordUrl,
} from "@/lib/entreprise/collaborator-invite";
import { syncCollaboratorProfileAfterInvite } from "@/lib/entreprise/sync-collaborator-profile";
import { sendCollaboratorInviteEmail } from "@/lib/onboarding/emails";
import { appOrigin } from "@/lib/onboarding/slug";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { organisation_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const organisationId = String(body.organisation_id ?? profile?.company_id ?? "").trim();
  if (!organisationId) {
    return NextResponse.json({ error: "organisation_id requis" }, { status: 400 });
  }

  if (profile?.company_id !== organisationId && !["admin", "entreprise"].includes(String(profile?.role ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: org } = await service
    .from("organizations")
    .select("id, name")
    .eq("id", organisationId)
    .maybeSingle();

  if (!org) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }

  const { data: employees } = await service
    .from("employees")
    .select("id, email, first_name")
    .eq("company_id", organisationId)
    .not("email", "is", null);

  const withEmail = (employees ?? []).filter((e) => e.email && String(e.email).includes("@"));
  const origin = appOrigin();
  let sent = 0;
  const failures: string[] = [];

  for (const emp of withEmail) {
    const email = String(emp.email).trim().toLowerCase();
    const firstName = String(emp.first_name ?? "").trim();
    try {
      const setPasswordUrl = buildCollaboratorSetPasswordUrl(origin);
      const inviteMetadata = buildCollaboratorInviteMetadata({
        firstName,
        organizationId: organisationId,
        employeeId: emp.id,
      });
      const { data: inviteData, error: inviteErr } = await service.auth.admin.inviteUserByEmail(email, {
        data: inviteMetadata,
        redirectTo: setPasswordUrl,
      });
      if (inviteErr) {
        failures.push(`${email}: ${inviteErr.message}`);
        continue;
      }
      const invitedUserId = inviteData?.user?.id;
      if (invitedUserId) {
        await syncCollaboratorProfileAfterInvite(service, {
          userId: invitedUserId,
          email,
          firstName,
          lastName: "",
          organizationId: organisationId,
          employeeId: emp.id,
        });
      }
      await sendCollaboratorInviteEmail({
        email,
        firstName,
        companyName: String(org.name),
        inviteLink: setPasswordUrl,
      });
      sent += 1;
    } catch (e) {
      failures.push(`${email}: ${e instanceof Error ? e.message : "erreur"}`);
    }
  }

  await service
    .from("organizations")
    .update({ onboarding_step: "employees_invited" })
    .eq("id", organisationId);

  return NextResponse.json({
    sent,
    total_with_email: withEmail.length,
    failures: failures.length > 0 ? failures.slice(0, 20) : undefined,
  });
}
