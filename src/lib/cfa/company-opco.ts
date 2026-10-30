import type { SupabaseClient } from "@supabase/supabase-js";
import { getOpcoFromIdcc } from "@/lib/ecole/siret-company-helpers";
import { cleanSiret, isValidSiret } from "@/lib/cfa/siret";
import { lookupOpcoForSiret, type OpcoSource } from "@/lib/cfa/lookup-opco";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type OpcoCompany = {
  siret?: string | null;
  opco?: string | null;
  opco_source?: string | null;
  opco_checked_at?: string | null;
};

export function isOpcoContractReady(company: OpcoCompany) {
  const name = String(company.opco ?? "").trim();
  return Boolean(name) && ["cfadock", "idcc", "manual"].includes(String(company.opco_source ?? ""));
}

export function shouldAutoLookupOpco(company: OpcoCompany) {
  if (!isValidSiret(cleanSiret(company.siret))) return false;
  if (company.opco_source === "manual") return false;
  const checkedAt = company.opco_checked_at ? new Date(company.opco_checked_at).getTime() : Number.NaN;
  return !company.opco_checked_at || Number.isNaN(checkedAt) || Date.now() - checkedAt > WEEK_MS;
}

function lookupBody(opco: string | null, source: OpcoSource | null) {
  if (!opco || !source) return "Recherche OPCO : aucun résultat.";
  if (source === "cfadock") return `OPCO ${opco}, source CFADock.`;
  if (source === "idcc") return `OPCO ${opco}, d'après la convention collective.`;
  if (source === "naf") return `OPCO ${opco}, estimé d'après le code NAF.`;
  return `OPCO ${opco}, saisie manuelle.`;
}

/** IDCC saisi à la main : le référentiel IDCC, puis CFADock si un SIRET est connu. */
export async function resolveOpcoForEnteredIdcc(input: { siret?: string | null; idcc: string }) {
  const fromIdcc = getOpcoFromIdcc(input.idcc);
  if (fromIdcc) return { searched: true, opco: fromIdcc, source: "idcc" as const };
  const siret = cleanSiret(input.siret);
  if (!isValidSiret(siret)) return { searched: true, opco: null, source: null };
  try {
    const found = await lookupOpcoForSiret(siret);
    if (found.source === "cfadock" && found.opco) return { searched: true, opco: found.opco, source: "cfadock" as const };
    if (found.source === "naf" && found.opco) return { searched: true, opco: found.opco, source: "naf" as const };
    return { searched: true, opco: null, source: null };
  } catch {
    return { searched: false, opco: null, source: null };
  }
}

export async function refreshCompanyOpco(
  db: SupabaseClient,
  companyId: string,
  input: { force: boolean; actorId: string | null },
) {
  const current = await db
    .from("cfa_companies")
    .select("siret, opco, opco_source, opco_checked_at")
    .eq("id", companyId)
    .maybeSingle();
  if (current.error) return { ok: false as const, error: current.error.message };
  if (!current.data) return { ok: false as const, error: "Entreprise introuvable" };
  const company = current.data as OpcoCompany;
  if (company.opco_source === "manual") return { ok: true as const, skipped: true as const };
  if (!input.force && !shouldAutoLookupOpco(company)) return { ok: true as const, skipped: true as const };
  const siret = cleanSiret(company.siret);
  if (!isValidSiret(siret)) return { ok: true as const, skipped: true as const };

  let found: Awaited<ReturnType<typeof lookupOpcoForSiret>>;
  try {
    found = await lookupOpcoForSiret(siret);
  } catch {
    return { ok: true as const, skipped: true as const };
  }

  const now = new Date().toISOString();
  const saved = await db
    .from("cfa_companies")
    .update({
      opco: found.opco,
      opco_source: found.source,
      opco_checked_at: now,
      updated_at: now,
    })
    .eq("id", companyId)
    .select("opco, opco_source, opco_checked_at")
    .single();
  if (saved.error) {
    if (/opco_source|opco_checked_at|schema cache/i.test(saved.error.message)) {
      return { ok: false as const, error: "Collez le script 20261026160000_cfa_company_fiche.sql." };
    }
    return { ok: false as const, error: saved.error.message };
  }

  await db.from("cfa_company_activities").insert({
    company_id: companyId,
    type: "opco_lookup",
    body: lookupBody(found.opco, found.source),
    actor_id: input.actorId,
  });
  return { ok: true as const, skipped: false as const, company: saved.data };
}
