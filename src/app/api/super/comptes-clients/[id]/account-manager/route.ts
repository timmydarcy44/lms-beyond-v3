import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildActivityRow } from "@/lib/control/policy";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { accountManagerId?: string | null };
  const raw = body.accountManagerId;
  const accountManagerId =
    raw === null || raw === undefined || String(raw).trim() === ""
      ? null
      : String(raw).trim();

  if (accountManagerId) {
    const admin = await service
      .from("super_admins")
      .select("user_id")
      .eq("user_id", accountManagerId)
      .eq("is_active", true)
      .maybeSingle();
    if (admin.error) {
      return NextResponse.json({ error: admin.error.message }, { status: 500 });
    }
    if (!admin.data) {
      return NextResponse.json(
        { error: "Le chargé de compte doit être un membre du staff Byound." },
        { status: 400 },
      );
    }
  }

  const updated = await service
    .from("organizations")
    .update({ account_manager_id: accountManagerId })
    .eq("id", id)
    .select("id, account_manager_id")
    .maybeSingle();

  if (updated.error) {
    return NextResponse.json({ error: updated.error.message }, { status: 400 });
  }
  if (!updated.data) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }

  let accountManagerName: string | null = null;
  if (accountManagerId) {
    const profile = await service
      .from("profiles")
      .select("full_name, display_name, email")
      .eq("id", accountManagerId)
      .maybeSingle();
    accountManagerName =
      (profile.data?.full_name as string | null) ||
      (profile.data?.display_name as string | null) ||
      (profile.data?.email as string | null) ||
      "Chargé de compte";
  }

  await service.from("org_activity").insert(
    buildActivityRow({
      orgId: id,
      actorUserId: data.user.id,
      actorType: "byound_on_behalf",
      action: "assign_account_manager",
      payload: {
        account_manager_id: accountManagerId,
        account_manager_name: accountManagerName,
      },
    }),
  );

  return NextResponse.json({
    ok: true,
    accountManagerId,
    accountManagerName,
  });
}
