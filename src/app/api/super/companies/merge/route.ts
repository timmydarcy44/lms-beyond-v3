import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { keepId?: string; dropId?: string; confirm?: boolean } | null;
  const keepId = String(body?.keepId ?? "");
  const dropId = String(body?.dropId ?? "");
  if (!body?.confirm) return NextResponse.json({ error: "Confirme la fusion." }, { status: 400 });
  if (!keepId || !dropId || keepId === dropId) return NextResponse.json({ error: "Choisis deux fiches différentes." }, { status: 400 });

  const rows = await db.from("companies").select("*").in("id", [keepId, dropId]);
  if (rows.error) {
    return NextResponse.json({ error: "Colle d'abord le script SQL des fiches entreprise." }, { status: 400 });
  }
  const keep = (rows.data ?? []).find((row) => row.id === keepId);
  const drop = (rows.data ?? []).find((row) => row.id === dropId);
  if (!keep || !drop || keep.merged_into || drop.merged_into) {
    return NextResponse.json({ error: "Ces fiches ne peuvent plus être fusionnées." }, { status: 400 });
  }

  const merged = await db
    .from("companies")
    .update({
      role_business: keep.role_business === true || drop.role_business === true,
      role_cfa: keep.role_cfa === true || drop.role_cfa === true,
      city: keep.city || drop.city || null,
      sector: keep.sector || drop.sector || null,
      naf_code: keep.naf_code || drop.naf_code || null,
      opco: keep.opco || drop.opco || null,
      siret: keep.siret || drop.siret || null,
      organization_id: keep.organization_id || drop.organization_id || null,
      cfa_company_id: keep.cfa_company_id || drop.cfa_company_id || null,
      owner_email: keep.owner_email || drop.owner_email || null,
      is_demo: keep.is_demo === true && drop.is_demo === true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", keepId);
  if (merged.error) return NextResponse.json({ error: merged.error.message }, { status: 400 });

  const moved = await db.from("company_sources").update({ company_id: keepId }).eq("company_id", dropId);
  if (moved.error) return NextResponse.json({ error: moved.error.message }, { status: 400 });

  await db.from("crm_pipeline_deals").update({ company_id: keepId }).eq("company_id", dropId);
  const hidden = await db.from("companies").update({ merged_into: keepId, updated_at: new Date().toISOString() }).eq("id", dropId);
  if (hidden.error) return NextResponse.json({ error: hidden.error.message }, { status: 400 });

  return NextResponse.json({ id: keepId });
}
