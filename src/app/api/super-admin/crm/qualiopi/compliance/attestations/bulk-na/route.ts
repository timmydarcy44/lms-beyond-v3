import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { QUALIOPI_OF_NA_INDICATORS } from "@/lib/qualiopi/qualiopi-of-b2b";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Atteste en masse les indicateurs hors périmètre OF B2B (justifications N/A). */
export async function POST() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const sessionClient = await getServerClient();
  const userId = sessionClient ? (await sessionClient.auth.getUser()).data.user?.id : null;
  const now = new Date().toISOString();

  const rows = QUALIOPI_OF_NA_INDICATORS.map((item) => ({
    indicator_id: item.id,
    note: item.note,
    kind: "na" as const,
    attested_by: userId,
    updated_at: now,
  }));

  let { error } = await supabase.from("crm_qualiopi_indicator_attestations").upsert(rows, {
    onConflict: "indicator_id",
  });

  if (error && /kind|column|check/i.test(error.message)) {
    const legacy = rows.map(({ kind: _k, ...rest }) => rest);
    ({ error } = await supabase.from("crm_qualiopi_indicator_attestations").upsert(legacy, {
      onConflict: "indicator_id",
    }));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    attested: QUALIOPI_OF_NA_INDICATORS.map((i) => i.id),
  });
}
