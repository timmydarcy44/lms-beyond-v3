import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  buildContratPrestationMarkdown,
  contratPrestationFilename,
} from "@/lib/expert/contrat-prestation-template";
import {
  EMPLOYMENT_STATUS_LABELS,
  parseEmploymentStatus,
} from "@/lib/expert/subcontracting";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const OF_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

/** Télécharge le contrat de prestation uniformisé (Markdown) pour un expert. */
export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const expertId = String(new URL(req.url).searchParams.get("expert_id") ?? "").trim();
  if (!expertId) {
    return NextResponse.json({ error: "expert_id requis" }, { status: 400 });
  }

  const [{ data: expert }, { data: ofRow }] = await Promise.all([
    service
      .from("experts")
      .select(
        "id, first_name, last_name, email, employment_status, subcontract_signed_at, subcontract_ends_at",
      )
      .eq("id", expertId)
      .maybeSingle(),
    service
      .from("of_settings")
      .select("legal_name, nda, siret, address_line, address_zip, address_city")
      .eq("id", OF_SETTINGS_ID)
      .maybeSingle(),
  ]);

  if (!expert) return NextResponse.json({ error: "Expert introuvable" }, { status: 404 });

  const expertName =
    [expert.first_name, expert.last_name].filter(Boolean).join(" ").trim() ||
    String(expert.email ?? expert.id);
  const status = parseEmploymentStatus(expert.employment_status);
  const address = [ofRow?.address_line, ofRow?.address_zip, ofRow?.address_city]
    .filter(Boolean)
    .join(", ");

  const markdown = buildContratPrestationMarkdown({
    ofLegalName: String(ofRow?.legal_name ?? "Byound"),
    ofNda: ofRow?.nda ? String(ofRow.nda) : null,
    ofSiret: ofRow?.siret ? String(ofRow.siret) : null,
    ofAddress: address || null,
    expertName,
    expertEmail: expert.email ? String(expert.email) : null,
    employmentStatusLabel: status
      ? EMPLOYMENT_STATUS_LABELS[status]
      : "Indépendant / portage (à préciser)",
    signedAt: expert.subcontract_signed_at
      ? String(expert.subcontract_signed_at).slice(0, 10)
      : null,
    endsAt: expert.subcontract_ends_at
      ? String(expert.subcontract_ends_at).slice(0, 10)
      : null,
  });

  const filename = contratPrestationFilename(expertName);
  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
