import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ userId: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "NO_DB" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { userId } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { enabled?: boolean };
  const enabled = Boolean(body.enabled);

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const { error } = await db
    .from("profiles")
    .update({ lms_auto_relance_enabled: enabled })
    .eq("id", userId);

  if (error && /lms_auto_relance|column|schema cache/i.test(error.message)) {
    return NextResponse.json(
      {
        error:
          "Colonne lms_auto_relance_enabled absente — appliquer supabase/migrations/20261124200000_learner_suivi_auto_relance.sql",
      },
      { status: 422 },
    );
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, enabled });
}
