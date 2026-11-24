import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendCrmUserPasswordInvite } from "@/lib/crm/send-crm-user-password-invite";
import { buildActivityRow } from "@/lib/control/policy";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Envoie le mail de création de mot de passe à l’admin du compte B2B
 * (sans le déclencher à la création de l’organisation).
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: membership } = await service
    .from("org_memberships")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const userId = membership?.user_id ? String(membership.user_id) : null;
  if (!userId) {
    return NextResponse.json({ error: "Aucun administrateur sur ce compte" }, { status: 404 });
  }

  const { data: profile } = await service
    .from("profiles")
    .select("id, email, first_name, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  const email = String(profile?.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "L’administrateur n’a pas d’e-mail" }, { status: 400 });
  }

  const firstName =
    String(profile?.first_name ?? "").trim() ||
    String(profile?.full_name ?? "").trim().split(/\s+/)[0] ||
    email.split("@")[0] ||
    "Bonjour";

  const invite = await sendCrmUserPasswordInvite(service, {
    email,
    firstName,
    role: String(profile?.role ?? "admin"),
  });

  if (!invite.ok) {
    return NextResponse.json({ error: invite.error }, { status: 502 });
  }

  await service.from("org_activity").insert(
    buildActivityRow({
      orgId,
      actorUserId: data.user.id,
      actorType: "byound_on_behalf",
      action: "send_password_invite",
      payload: { email },
    }),
  );

  return NextResponse.json({ ok: true, email });
}
