import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { sendCollaboratorInviteEmail } from "@/lib/onboarding/emails";
import { appOrigin } from "@/lib/onboarding/slug";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée", needsOnboarding: true }, { status: 400 });
  }

  const orgId = access.organizationId;
  let body: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    department?: string;
    job_title?: string;
    hire_date?: string;
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
  const phone = String(body.phone ?? "").trim() || null;
  const hire_date = String(body.hire_date ?? "").trim() || null;

  if (!first_name || !last_name || !email || !email.includes("@")) {
    return NextResponse.json({ error: "Prénom, nom et email valides requis" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: org } = await service.from("organizations").select("name").eq("id", orgId).maybeSingle();

  const insertRow: Record<string, unknown> = {
    company_id: orgId,
    first_name,
    last_name,
    email,
    department,
    job_title,
    role: job_title,
  };
  if (phone) insertRow.phone = phone;
  if (hire_date) insertRow.hire_date = hire_date;

  let employee: { id: string };
  const { data: inserted, error: insertErr } = await service
    .from("employees")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertErr) {
    const fallback = { ...insertRow };
    delete fallback.phone;
    delete fallback.hire_date;
    const { data: retry, error: retryErr } = await service
      .from("employees")
      .insert(fallback)
      .select("id")
      .single();
    if (retryErr) {
      return NextResponse.json({ error: retryErr.message }, { status: 400 });
    }
    employee = retry as { id: string };
  } else {
    employee = inserted as { id: string };
  }

  let inviteSent = false;
  try {
    const origin = appOrigin();
    const redirectTo =
      process.env.NEXT_PUBLIC_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      origin;
    const { error: inviteErr } = await service.auth.admin.inviteUserByEmail(email, {
      data: {
        role: "apprenant",
        prenom: first_name,
        nom: last_name,
        company_id: orgId,
        organization_id: orgId,
        employee_id: employee.id,
      },
      redirectTo: `${redirectTo.replace(/\/$/, "")}/dashboard/apprenant`,
    });
    if (!inviteErr) {
      await sendCollaboratorInviteEmail({
        email,
        firstName: first_name,
        companyName: String((org as { name?: string })?.name ?? "votre entreprise"),
        inviteLink: `${origin}/dashboard/apprenant`,
      });
      inviteSent = true;
    }
  } catch {
    /* invitation optionnelle */
  }

  return NextResponse.json({ id: employee.id, invite_sent: inviteSent });
}
