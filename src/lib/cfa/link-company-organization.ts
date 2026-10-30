import type { SupabaseClient } from "@supabase/supabase-js";
import { logCompanyEvent } from "@/lib/cfa/company-events";

/** Relie l'entreprise CFA uniquement lorsqu'un seul compte Byound a le même SIRET. */
export async function linkCompanyByExactSiret(
  db: SupabaseClient,
  company: { id: string; siret?: string | null; organization_id?: string | null },
  actorId: string | null,
) {
  if (company.organization_id) return company.organization_id;
  const siret = String(company.siret ?? "").replace(/\s/g, "");
  if (!/^\d{14}$/.test(siret)) return null;
  const found = await db.from("organizations").select("id").eq("siret", siret).limit(2);
  if (found.error || (found.data ?? []).length !== 1) return null;
  const organizationId = String((found.data?.[0] as { id: string }).id);
  const updated = await db.from("cfa_companies").update({ organization_id: organizationId }).eq("id", company.id);
  if (updated.error) return null;
  await logCompanyEvent(db, {
    companyId: company.id,
    actorId,
    action: "organization_link",
    body: "Rattachement automatique : le SIRET correspond à un compte Byound Business.",
    newValue: organizationId,
    activityType: "note",
  });
  return organizationId;
}
