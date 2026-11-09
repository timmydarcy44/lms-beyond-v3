import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { grantUserRole, revokeUserRole } from "@/lib/auth/user-roles";
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
    enabled?: boolean;
  };

  if (body.action === "toggle_tutor") {
    if (!body.userId || body.userId.startsWith("employee:")) {
      return NextResponse.json(
        { error: "Ce membre n'a pas encore de compte pour le rôle tuteur." },
        { status: 400 },
      );
    }
    const enabled = Boolean(body.enabled);
    if (enabled) {
      // Cumulable : garde collaborateur/admin, ajoute user_roles.tuteur
      const { data: mem } = await service
        .from("org_memberships")
        .select("role")
        .eq("org_id", id)
        .eq("user_id", body.userId)
        .maybeSingle();
      if (String(mem?.role || "") === "tutor") {
        await service
          .from("org_memberships")
          .update({ role: "learner" })
          .eq("org_id", id)
          .eq("user_id", body.userId);
      }
      await grantUserRole(service, body.userId, "tuteur");
    } else {
      await revokeUserRole(service, body.userId, "tuteur");
      // Ancien modèle exclusif : membership tutor → learner
      await service
        .from("org_memberships")
        .update({ role: "learner" })
        .eq("org_id", id)
        .eq("user_id", body.userId)
        .eq("role", "tutor");
    }
    await service.from("org_activity").insert(
      buildActivityRow({
        orgId: id,
        actorUserId: data.user.id,
        actorType: "byound_on_behalf",
        action: enabled ? "grant_tutor" : "revoke_tutor",
        payload: { userId: body.userId },
      }),
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === "role") {
    if (!body.userId || body.userId.startsWith("employee:") || !ROLES.has(String(body.role))) {
      return NextResponse.json(
        { error: "Ce membre n'a pas encore de compte pour changer de rôle." },
        { status: 400 },
      );
    }

    // « tutor » via menu rôle = activer le cumul (legacy)
    if (body.role === "tutor") {
      const { data: mem } = await service
        .from("org_memberships")
        .select("role")
        .eq("org_id", id)
        .eq("user_id", body.userId)
        .maybeSingle();
      const current = String(mem?.role || "learner");
      if (current === "tutor" || !mem) {
        await service.from("org_memberships").upsert(
          { org_id: id, user_id: body.userId, role: "learner" },
          { onConflict: "org_id,user_id" },
        );
      }
      await grantUserRole(service, body.userId, "tuteur");
      await service.from("org_activity").insert(
        buildActivityRow({
          orgId: id,
          actorUserId: data.user.id,
          actorType: "byound_on_behalf",
          action: "grant_tutor",
          payload: { userId: body.userId },
        }),
      );
      return NextResponse.json({ ok: true });
    }

    const updated = await service
      .from("org_memberships")
      .update({ role: body.role })
      .eq("org_id", id)
      .eq("user_id", body.userId);
    if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 400 });

    if (body.role === "admin") {
      await service
        .from("profiles")
        .update({ role: "entreprise", role_type: "entreprise" })
        .eq("id", body.userId);
    } else if (body.role === "learner") {
      await service
        .from("profiles")
        .update({ role: "learner", role_type: "salarie" })
        .eq("id", body.userId)
        .neq("role", "super_admin");
    }

    await service.from("org_activity").insert(
      buildActivityRow({
        orgId: id,
        actorUserId: data.user.id,
        actorType: "byound_on_behalf",
        action: "change_role",
        payload: { userId: body.userId, role: body.role },
      }),
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === "deactivate") {
    if (!body.employeeId) {
      return NextResponse.json(
        { error: "Ce membre n'a pas de fiche collaborateur à désactiver." },
        { status: 400 },
      );
    }
    const updated = await service
      .from("employees")
      .update({ status: "inactive" })
      .eq("id", body.employeeId)
      .eq("company_id", id);
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
