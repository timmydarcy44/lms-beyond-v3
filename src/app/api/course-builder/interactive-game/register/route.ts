import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { registerGamePackage } from "@/lib/serious-games/register";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const AUTHOR_ROLES = ["instructor", "formateur", "admin", "tutor", "super_admin"];

export async function POST(request: Request) {
  const supabase = await getServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const userId = auth?.user?.id;
  if (!userId || !supabase) {
    return NextResponse.json({ ok: false, reason: "Non connecté" }, { status: 401 });
  }

  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    const { data } = await supabase
      .from("org_memberships")
      .select("role")
      .eq("user_id", userId)
      .in("role", AUTHOR_ROLES)
      .limit(1);
    if (!data?.length) {
      return NextResponse.json({ ok: false, reason: "Accès refusé" }, { status: 403 });
    }
  }

  const body = await request.json().catch(() => null);
  const db = getServiceRoleClient() ?? supabase;
  const result = await registerGamePackage(
    db,
    typeof body?.manifest === "string" ? body.manifest : null,
    String(body?.entryUrl ?? ""),
    userId,
  );
  return NextResponse.json(result);
}
