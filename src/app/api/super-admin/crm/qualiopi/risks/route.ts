import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  RISK_STATUS_LABELS,
  createQualiopiRisk,
  importRisksFromCsvRows,
  listQualiopiRisks,
  parseRiskStatus,
  clampScore,
} from "@/lib/qualiopi/risks";
import { buildQualiopiRisksPdf } from "@/lib/qualiopi/risks-pdf";

export const dynamic = "force-dynamic";

async function actorId(): Promise<string | null> {
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    return auth.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Liste risques, ou export PDF (?format=pdf). */
export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const format = new URL(req.url).searchParams.get("format");
  const risks = await listQualiopiRisks(service);

  if (format === "pdf") {
    const buffer = buildQualiopiRisksPdf(risks);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="registre-risques-qualiopi-${new Date().toISOString().slice(0, 10)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    risks,
    status_labels: RISK_STATUS_LABELS,
  });
}

/**
 * Body JSON : création d’un risque
 * Body multipart/CSV : { csv: string } ou text/csv brut via ?import=1
 */
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const contentType = req.headers.get("content-type") || "";
  const importMode = new URL(req.url).searchParams.get("import") === "1";
  const actorUserId = await actorId();

  if (importMode || contentType.includes("text/csv")) {
    const text = await req.text();
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length) {
      return NextResponse.json(
        { error: parsed.errors[0]?.message || "CSV invalide" },
        { status: 400 },
      );
    }
    const result = await importRisksFromCsvRows(service, parsed.data, actorUserId);
    return NextResponse.json({ ok: true, ...result });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  if (body.csv != null) {
    const text = String(body.csv);
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length) {
      return NextResponse.json(
        { error: parsed.errors[0]?.message || "CSV invalide" },
        { status: 400 },
      );
    }
    const result = await importRisksFromCsvRows(service, parsed.data, actorUserId);
    return NextResponse.json({ ok: true, ...result });
  }

  const status = parseRiskStatus(body.status) ?? "open";
  const result = await createQualiopiRisk(service, {
    label: String(body.label ?? ""),
    cause: body.cause != null ? String(body.cause) : null,
    probability: clampScore(body.probability ?? 1),
    severity: clampScore(body.severity ?? 1),
    preventive_action:
      body.preventive_action != null ? String(body.preventive_action) : null,
    owner_name: body.owner_name != null ? String(body.owner_name) : null,
    due_at: body.due_at ? String(body.due_at) : null,
    reviewed_at: body.reviewed_at ? String(body.reviewed_at) : null,
    status,
    action_id: body.action_id ? String(body.action_id) : null,
    reclamation_id: body.reclamation_id ? String(body.reclamation_id) : null,
    highlight_id: body.highlight_id ? String(body.highlight_id) : null,
    notes: body.notes != null ? String(body.notes) : null,
    created_by: actorUserId,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, risk: result.risk });
}
