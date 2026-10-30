import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureCfaSignupCompany(
  db: SupabaseClient,
  input: {
    organizationId: string;
    companyName: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  },
) {
  const companyName = input.companyName.trim();
  const organizationId = input.organizationId.trim();
  if (!organizationId || !companyName || companyName.startsWith("context:")) return;

  const linked = await db.from("cfa_companies").select("id").eq("organization_id", organizationId).limit(1);
  if (linked.error) {
    console.warn("[cfa-signup] lecture entreprise:", linked.error.message);
    return;
  }
  if ((linked.data ?? []).length) return;

  const named = await db.from("cfa_companies").select("id, organization_id").ilike("company_name", companyName).limit(1);
  const existing = (named.data ?? [])[0] as { id?: string; organization_id?: string | null } | undefined;
  if (existing?.id) {
    if (!existing.organization_id) {
      await db.from("cfa_companies").update({ organization_id: organizationId }).eq("id", existing.id);
    }
    return;
  }

  const firstName = String(input.firstName ?? "").trim();
  const lastName = String(input.lastName ?? "").trim();
  const created = await db.from("cfa_companies").insert({
    company_name: companyName,
    organization_id: organizationId,
    email: String(input.email ?? "").trim() || null,
    contact_first_name: firstName || null,
    contact_last_name: lastName || null,
    contact_name: `${firstName} ${lastName}`.trim() || null,
    status: "creating_offer",
  });
  if (created.error) {
    console.warn(
      created.error.code === "23514"
        ? "[cfa-signup] collez 20261026210000 pour la colonne Création offre d'emploi."
        : `[cfa-signup] création entreprise: ${created.error.message}`,
    );
  }
}
