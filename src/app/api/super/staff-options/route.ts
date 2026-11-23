import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type StaffOption = {
  id: string;
  label: string;
  email: string | null;
  is_pedagogical_manager: boolean;
};

/** Liste du staff Byound (super_admins actifs + profils) pour les sélecteurs « menée par » / « validée par ». */
export async function GET() {
  const supabase = await getServerClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!authData.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: admins, error } = await service
    .from("super_admins")
    .select("user_id")
    .eq("is_active", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = [...new Set((admins ?? []).map((row) => String(row.user_id)).filter(Boolean))];
  if (!ids.length) {
    return NextResponse.json({
      users: [],
      current_user_id: authData.user.id,
      current_is_pedagogical_manager: false,
    });
  }

  let profileRows: Array<Record<string, unknown>> = [];
  let hasManagerColumn = true;
  const withFlag = await service
    .from("profiles")
    .select("id, full_name, first_name, last_name, email, is_pedagogical_manager")
    .in("id", ids);
  if (withFlag.error) {
    hasManagerColumn = false;
    const fallback = await service
      .from("profiles")
      .select("id, full_name, first_name, last_name, email")
      .in("id", ids);
    profileRows = (fallback.data ?? []) as Array<Record<string, unknown>>;
  } else {
    profileRows = (withFlag.data ?? []) as Array<Record<string, unknown>>;
  }

  const byId = new Map(profileRows.map((row) => [String(row.id), row]));
  const users: StaffOption[] = ids
    .map((id) => {
      const p = byId.get(id);
      const email = p?.email ? String(p.email) : null;
      const label =
        String(p?.full_name ?? "").trim() ||
        [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim() ||
        email ||
        id;
      return {
        id,
        label,
        email,
        // Pas de repli « tout le staff » : sans colonne / sans flag → false.
        is_pedagogical_manager: hasManagerColumn
          ? Boolean(p?.is_pedagogical_manager)
          : false,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  const me = users.find((u) => u.id === authData.user.id);

  return NextResponse.json({
    users,
    current_user_id: authData.user.id,
    current_is_pedagogical_manager: Boolean(me?.is_pedagogical_manager),
  });
}
