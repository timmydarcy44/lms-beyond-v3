import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { QUALIOPI_OF_NA_IDS, qualiopiOfNaNote } from "@/lib/qualiopi/qualiopi-of-b2b";
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
    return NextResponse.json({ error: "Indicateur invalide (1–33)" }, { status: 400 });
  }

  const kindRaw = body.kind === "na" ? "na" : "evidence";
  const kind = QUALIOPI_OF_NA_IDS.has(indicatorId) && body.kind !== "evidence" ? "na" : kindRaw;

  let note: string | null =
    typeof body.note === "string" ? body.note.trim().slice(0, 2000) : null;
  if (kind === "na" && !note) {
    note = qualiopiOfNaNote(indicatorId);
  }

  const sessionClient = await getServerClient();
  const userId = sessionClient ? (await sessionClient.auth.getUser()).data.user?.id : null;

  const payload = {
    indicator_id: indicatorId,
    note: note || null,
    kind,
    attested_by: userId,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from("crm_qualiopi_indicator_attestations")
    .upsert(payload, { onConflict: "indicator_id" });

  if (error && /kind|column|check/i.test(error.message)) {
    const { kind: _k, ...legacy } = payload;
    ({ error } = await supabase
      .from("crm_qualiopi_indicator_attestations")
      .upsert(legacy, { onConflict: "indicator_id" }));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, indicatorId, kind, note });
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
