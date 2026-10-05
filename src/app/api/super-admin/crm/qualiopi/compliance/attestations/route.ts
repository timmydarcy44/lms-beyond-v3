import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { QUALIOPI_INDICATOR_COUNT } from "@/lib/qualiopi/qualiopi-rnq-reference";

export const dynamic = "force-dynamic";

function parseIndicatorId(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > QUALIOPI_INDICATOR_COUNT) return null;
  return n;
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const indicatorId = parseIndicatorId(body.indicatorId);
  if (indicatorId == null) {
    return NextResponse.json({ error: "Indicateur invalide (1–32)" }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : null;

  const sessionClient = await getServerClient();
  const userId = sessionClient ? (await sessionClient.auth.getUser()).data.user?.id : null;

  const { error } = await supabase.from("crm_qualiopi_indicator_attestations").upsert(
    {
      indicator_id: indicatorId,
      note: note || null,
      attested_by: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "indicator_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, indicatorId });
}

export async function DELETE(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const indicatorId = parseIndicatorId(req.nextUrl.searchParams.get("indicatorId"));
  if (indicatorId == null) {
    return NextResponse.json({ error: "Indicateur invalide" }, { status: 400 });
  }

  const { error } = await supabase
    .from("crm_qualiopi_indicator_attestations")
    .delete()
    .eq("indicator_id", indicatorId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, indicatorId });
}
