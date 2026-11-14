import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  EMPLOYMENT_STATUS_LABELS,
  listIntervenantsContractStatus,
  parseEmploymentStatus,
} from "@/lib/expert/subcontracting";

export const dynamic = "force-dynamic";

/** Liste intervenants + état contractuel SST (ind. 27). */
export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const format = new URL(req.url).searchParams.get("format");
  const rows = await listIntervenantsContractStatus(service);

  if (format === "csv") {
    const header = [
      "id",
      "nom",
      "email",
      "statut_emploi",
      "contrat_signe",
      "contrat_fin",
      "engagement_qualite",
      "doc_contrat_signe",
      "conforme",
      "code",
    ];
    const lines = [
      header.join(";"),
      ...rows.map((r) =>
        [
          r.id,
          csv(r.name),
          csv(r.email ?? ""),
          csv(r.employment_label),
          r.subcontract_signed_at ?? "",
          r.subcontract_ends_at ?? "",
          r.quality_commitment_at ? String(r.quality_commitment_at).slice(0, 10) : "",
          r.has_signed_contract_doc ? "oui" : "non",
          r.ready ? "oui" : "non",
          r.code,
        ].join(";"),
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="intervenants-sous-traitance-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    intervenants: rows,
    employment_labels: EMPLOYMENT_STATUS_LABELS,
  });
}

function csv(v: string): string {
  if (/[;"\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/**
 * PATCH body: {
 *   expert_id, employment_status?,
 *   subcontract_signed_at?, subcontract_ends_at?,
 *   quality_commitment?: boolean
 * }
 */
export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const expertId = String(body?.expert_id ?? "").trim();
  if (!expertId) return NextResponse.json({ error: "expert_id requis" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (body?.employment_status !== undefined) {
    if (body.employment_status === null || body.employment_status === "") {
      patch.employment_status = null;
    } else {
      const st = parseEmploymentStatus(body.employment_status);
      if (!st) return NextResponse.json({ error: "employment_status invalide" }, { status: 400 });
      patch.employment_status = st;
    }
  }
  if (body?.subcontract_signed_at !== undefined) {
    patch.subcontract_signed_at = body.subcontract_signed_at
      ? String(body.subcontract_signed_at).slice(0, 10)
      : null;
  }
  if (body?.subcontract_ends_at !== undefined) {
    patch.subcontract_ends_at = body.subcontract_ends_at
      ? String(body.subcontract_ends_at).slice(0, 10)
      : null;
  }
  if (body?.quality_commitment === true) {
    patch.quality_commitment_at = new Date().toISOString();
  } else if (body?.quality_commitment === false) {
    patch.quality_commitment_at = null;
  } else if (body?.quality_commitment_at !== undefined) {
    patch.quality_commitment_at = body.quality_commitment_at
      ? String(body.quality_commitment_at)
      : null;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  const { data, error } = await service
    .from("experts")
    .update(patch)
    .eq("id", expertId)
    .select(
      "id, employment_status, subcontract_signed_at, subcontract_ends_at, quality_commitment_at",
    )
    .maybeSingle();
  if (error) {
    if (/employment_status|subcontract_|quality_commitment|schema cache|column/i.test(error.message)) {
      return NextResponse.json(
        { error: "Migration Lot 5 non appliquée (colonnes sous-traitance absentes)" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, expert: data });
}
