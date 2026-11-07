import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { computeBpfDraft } from "@/lib/formation-bpf/compute";
import { buildBpfCsv, buildBpfDraftPdf } from "@/lib/formation-bpf/export-pdf";

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const start = req.nextUrl.searchParams.get("start") || undefined;
  const end = req.nextUrl.searchParams.get("end") || undefined;
  const format = req.nextUrl.searchParams.get("format");

  const draft = await computeBpfDraft(service, { start, end });

  if (format === "pdf") {
    const pdf = buildBpfDraftPdf(draft);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bpf-${draft.period.start}-${draft.period.end}.pdf"`,
      },
    });
  }
  if (format === "csv") {
    const csv = buildBpfCsv(draft);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bpf-${draft.period.start}-${draft.period.end}.csv"`,
      },
    });
  }

  const { data: ofRow } = await service
    .from("of_settings")
    .select("bpf_campaign_deadline, bpf_last_reminder_at, fiscal_year_start, fiscal_year_end")
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    draft,
    campaign: {
      deadline: ofRow?.bpf_campaign_deadline ?? null,
      last_reminder_at: ofRow?.bpf_last_reminder_at ?? null,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "").trim();

  let actorUserId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    actorUserId = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }

  if (action === "save_charges") {
    const start = String(body?.fiscal_year_start ?? "").slice(0, 10);
    const end = String(body?.fiscal_year_end ?? "").slice(0, 10);
    const entries = Array.isArray(body?.entries) ? body.entries : [];
    if (!start || !end) {
      return NextResponse.json({ error: "Période requise" }, { status: 400 });
    }
    await service
      .from("bpf_charge_entries")
      .delete()
      .eq("fiscal_year_start", start)
      .eq("fiscal_year_end", end)
      .eq("source", "manual");

    const rows = entries
      .map((e) => {
        const row = e as Record<string, unknown>;
        const kind = String(row.kind ?? "");
        if (!["total_charges", "salaires_formateurs", "achats_prestations_formation"].includes(kind)) {
          return null;
        }
        return {
          fiscal_year_start: start,
          fiscal_year_end: end,
          kind,
          amount_ht_cents: Math.round(Number(row.amount_ht_cents ?? 0)),
          label: row.label ? String(row.label) : null,
          source: "manual",
        };
      })
      .filter(Boolean);

    if (rows.length) {
      const { error } = await service.from("bpf_charge_entries").insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, saved: rows.length });
  }

  if (action === "snapshot") {
    const draft = await computeBpfDraft(service, {
      start: body?.start ? String(body.start) : undefined,
      end: body?.end ? String(body.end) : undefined,
    });
    const { data, error } = await service
      .from("bpf_snapshots")
      .insert({
        fiscal_year_start: draft.period.start,
        fiscal_year_end: draft.period.end,
        payload: draft,
        anomaly_count: draft.anomalies.length,
        created_by: actorUserId,
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, snapshot_id: data.id });
  }

  if (action === "set_deadline") {
    const deadline = body?.deadline ? String(body.deadline).slice(0, 10) : null;
    const { data: ofRow } = await service.from("of_settings").select("id").limit(1).maybeSingle();
    if (!ofRow?.id) return NextResponse.json({ error: "of_settings manquant" }, { status: 400 });
    await service
      .from("of_settings")
      .update({ bpf_campaign_deadline: deadline, updated_at: new Date().toISOString() })
      .eq("id", ofRow.id);
    return NextResponse.json({ ok: true, deadline });
  }

  return NextResponse.json({ error: "action invalide" }, { status: 400 });
}
