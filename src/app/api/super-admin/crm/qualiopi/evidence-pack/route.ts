import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { buildQualiopiEvidencePack } from "@/lib/qualiopi/evidence-pack";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Pack preuves Qualiopi (ZIP) : grille RNQ + registre réclamations + manifeste.
 * Réutilise le snapshot compliance via le même builder que /compliance.
 */
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { buildSnapshotForEvidencePack } = await import(
    "@/app/api/super-admin/crm/qualiopi/compliance/route"
  );
  const snapshot = await buildSnapshotForEvidencePack();
  if (!snapshot) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  let { data: reclamations, error } = await supabase
    .from("crm_qualiopi_reclamations")
    .select("*")
    .or("is_test.is.null,is_test.eq.false")
    .order("received_at", { ascending: false })
    .limit(500);
  if (error && /is_test/i.test(error.message)) {
    ({ data: reclamations, error } = await supabase
      .from("crm_qualiopi_reclamations")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(500));
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const zip = await buildQualiopiEvidencePack({
    snapshot,
    reclamations: (reclamations ?? []) as Record<string, unknown>[],
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="preuve-qualiopi-${stamp}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
