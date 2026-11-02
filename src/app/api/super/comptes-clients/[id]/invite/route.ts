import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildActivityRow } from "@/lib/control/policy";
import { readImpersonationContext } from "@/lib/control/session";
import { deliverCollaboratorInvite } from "@/lib/entreprise/deliver-collaborator-invite";
import { buildEmployeeInsertRow } from "@/lib/entreprise/employees-insert";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { firstName?: string; lastName?: string; email?: string; jobTitle?: string };
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!firstName || !lastName || !email.includes("@")) {
    return NextResponse.json({ error: "Prénom, nom et e-mail requis" }, { status: 400 });
  }
  const org = await service.from("organizations").select("name").eq("id", id).maybeSingle();
  if (!org.data) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  const inserted = await service.from("employees").insert(buildEmployeeInsertRow({
    company_id: id,
    first_name: firstName,
    last_name: lastName,
    email,
    job_title: body.jobTitle ?? null,
  })).select("id").single();
  if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 400 });
  const invite = await deliverCollaboratorInvite(service, {
    email,
    firstName,
    lastName,
    companyName: String(org.data.name ?? "votre entreprise"),
    organizationId: id,
    employeeId: inserted.data.id as string,
  });
  const session = await readImpersonationContext();
  await service.from("org_activity").insert(buildActivityRow({
    orgId: id,
    actorUserId: data.user.id,
    actorType: "byound_on_behalf",
    action: "invite_collaborator",
    payload: { email, sent: invite.sent },
    impersonationSessionId: session && !session.expired && session.orgId === id ? session.sid : null,
  }));
  return NextResponse.json({ ok: true, sent: invite.sent });
}
