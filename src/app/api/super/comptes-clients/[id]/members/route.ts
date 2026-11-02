import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildActivityRow } from "@/lib/control/policy";
import { deliverCollaboratorInvite } from "@/lib/entreprise/deliver-collaborator-invite";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ROLES = new Set(["admin", "learner", "tutor", "instructor"]);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    userId?: string;
    employeeId?: string;
    role?: string;
    email?: string;
  };

  if (body.action === "role") {
    if (!body.userId || body.userId.startsWith("employee:") || !ROLES.has(String(body.role))) {
      return NextResponse.json({ error: "Ce membre n'a pas encore de compte pour changer de rôle." }, { status: 400 });
    }
    const updated = await service.from("org_memberships").update({ role: body.role }).eq("org_id", id).eq("user_id", body.userId);
    if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 400 });
    await service.from("org_activity").insert(buildActivityRow({
      orgId: id,
      actorUserId: data.user.id,
      actorType: "byound_on_behalf",
      action: "change_role",
      payload: { userId: body.userId, role: body.role },
    }));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "deactivate") {
    if (!body.employeeId) return NextResponse.json({ error: "Ce membre n'a pas de fiche collaborateur à désactiver." }, { status: 400 });
    const updated = await service.from("employees").update({ status: "inactive" }).eq("id", body.employeeId).eq("company_id", id);
    if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "remind") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email.includes("@") || !body.employeeId) {
      return NextResponse.json({ error: "Invitation introuvable." }, { status: 400 });
    }
    const org = await service.from("organizations").select("name").eq("id", id).maybeSingle();
    const sent = await deliverCollaboratorInvite(service, {
      email,
      firstName: email.split("@")[0] ?? "Bonjour",
      companyName: String(org.data?.name ?? "votre entreprise"),
      organizationId: id,
      employeeId: body.employeeId,
    });
    return NextResponse.json({ ok: sent.sent, error: sent.error });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
