import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { notifyAccountManagerAssigned } from "@/lib/email/account-manager-assigned";
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

  const current = await service
    .from("organizations")
    .select("id, account_manager_id")
    .eq("id", id)
    .maybeSingle();
  if (current.error) return NextResponse.json({ error: current.error.message }, { status: 500 });
  if (!current.data) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  const previousManagerId = current.data.account_manager_id
    ? String(current.data.account_manager_id)
    : null;

  let accountManagerName: string | null = null;
  let managerEmail: string | null = null;
  if (accountManagerId) {
    const manager = await service
      .from("account_managers")
      .select("id, first_name, last_name, email, is_active")
      .eq("id", accountManagerId)
      .maybeSingle();
    if (manager.error) {
      if (/account_managers|42P01/i.test(manager.error.message)) {
        return NextResponse.json(
          { error: "Appliquez la migration account_managers sur Supabase." },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: manager.error.message }, { status: 500 });
    }
    if (!manager.data || manager.data.is_active === false) {
      return NextResponse.json(
        { error: "Choisissez un gestionnaire de compte actif." },
        { status: 400 },
      );
    }
    accountManagerName =
      [manager.data.first_name, manager.data.last_name].filter(Boolean).join(" ").trim() ||
      String(manager.data.email || "") ||
      "Chargé de compte";
    managerEmail = String(manager.data.email || "")
      .trim()
      .toLowerCase();
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

  await service.from("org_activity").insert(
    buildActivityRow({
      orgId: id,
      actorUserId: data.user.id,
      actorType: "byound_on_behalf",
      action: "assign_account_manager",
      payload: {
        account_manager_id: accountManagerId,
        account_manager_name: accountManagerName,
        previous_account_manager_id: previousManagerId,
      },
    }),
  );

  let emailSent = false;
  if (accountManagerId && accountManagerId !== previousManagerId) {
    const notify = await notifyAccountManagerAssigned(service, {
      orgId: id,
      managerId: accountManagerId,
      assignedByUserId: data.user.id,
    });
    emailSent = notify.sent;
  }

  return NextResponse.json({
    ok: true,
    accountManagerId,
    accountManagerName,
    managerEmail,
    emailSent,
  });
}
