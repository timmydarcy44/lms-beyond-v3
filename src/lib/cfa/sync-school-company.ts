import type { SupabaseClient } from "@supabase/supabase-js";

/** Relie une entreprise du pipeline Business à une fiche CFA quand School est coché. */
export async function syncSchoolCompany(
  db: SupabaseClient,
  deal: { company_name?: string | null; siret?: string | null; city?: string | null; organization_id?: string | null },
) {
  const name = String(deal.company_name ?? "").trim();
  if (!name) return;
  const organizationId = String(deal.organization_id ?? "").trim();
  const siret = String(deal.siret ?? "").replace(/\s/g, "");

  const byOrg = organizationId
    ? await db.from("cfa_companies").select("id, organization_id").eq("organization_id", organizationId).limit(1).maybeSingle()
    : { data: null };
  const bySiret = !byOrg.data && siret
    ? await db.from("cfa_companies").select("id, organization_id").eq("siret", siret).limit(1).maybeSingle()
    : { data: byOrg.data };
  const found = bySiret.data
    ? bySiret
    : await db.from("cfa_companies").select("id, organization_id").ilike("company_name", name).limit(1).maybeSingle();
  const row = found.data as { id: string; organization_id?: string | null } | null;
  if (row?.id) {
    if (organizationId && !row.organization_id) {
      await db.from("cfa_companies").update({ organization_id: organizationId }).eq("id", row.id);
    }
    return;
  }
  await db.from("cfa_companies").insert({
    company_name: name,
    siret: siret || null,
    city: String(deal.city ?? "").trim() || null,
    organization_id: organizationId || null,
    status: "to_contact",
  });
}
