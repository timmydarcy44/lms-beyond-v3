import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
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

  if (profile?.company_id !== organisationId && profile?.role !== "admin") {
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
    try {
      const { error: inviteErr } = await service.auth.admin.inviteUserByEmail(email, {
        data: {
          organization_id: organisationId,
          role: "employee",
          employee_id: emp.id,
        },
        redirectTo: `${origin}/dashboard/salarie`,
      });
      if (inviteErr) {
        failures.push(`${email}: ${inviteErr.message}`);
        continue;
      }
      await sendCollaboratorInviteEmail({
        email,
        firstName: String(emp.first_name ?? ""),
        companyName: String(org.name),
        inviteLink: `${origin}/dashboard/salarie`,
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
