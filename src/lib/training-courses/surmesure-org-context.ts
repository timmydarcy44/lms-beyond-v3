import type { SupabaseClient } from "@supabase/supabase-js";

export type SurMesureOrgContext = {
  name: string;
  siret: string | null;
  sector: string | null;
  naf: string | null;
  city: string | null;
};

function digits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function text(value: unknown) {
  const v = String(value ?? "").trim();
  return v || null;
}

/** Contexte entreprise pour contextualiser les prompts Sur-mesure. */
export async function loadSurMesureOrgContext(
  service: SupabaseClient,
  orgId: string,
): Promise<SurMesureOrgContext> {
  const { data: org } = await service
    .from("organizations")
    .select("id, name, siret")
    .eq("id", orgId)
    .maybeSingle();

  const siret = digits(org?.siret) || null;
  let sector: string | null = null;
  let naf: string | null = null;
  let city: string | null = null;

  // Pipeline CRM : secteur / NAF / ville liés à l'orga ou au SIRET.
  let dealsQuery = service
    .from("crm_pipeline_deals")
    .select("sector, naf_code, city, organization_id, siret, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);

  dealsQuery = siret
    ? dealsQuery.or(`organization_id.eq.${orgId},siret.eq.${siret}`)
    : dealsQuery.eq("organization_id", orgId);

  const { data: deals } = await dealsQuery;
  const deal = (deals ?? [])[0];
  if (deal) {
    sector = text(deal.sector);
    naf = text(deal.naf_code);
    city = text(deal.city);
  }

  // Fallback CFA si pas de deal.
  if ((!sector || !naf) && siret) {
    const { data: cfa } = await service
      .from("cfa_companies")
      .select("naf_code, naf_label, city, siret")
      .eq("siret", siret)
      .maybeSingle();
    if (cfa) {
      sector = sector || text(cfa.naf_label);
      naf = naf || text(cfa.naf_code);
      city = city || text(cfa.city);
    }
  }

  return {
    name: text(org?.name) || "Entreprise",
    siret: siret || null,
    sector,
    naf,
    city,
  };
}

export function formatOrgContextForPrompt(ctx: SurMesureOrgContext) {
  return [
    `Entreprise : ${ctx.name}`,
    ctx.siret ? `SIRET : ${ctx.siret}` : null,
    ctx.sector ? `Secteur d'activité : ${ctx.sector}` : null,
    ctx.naf ? `Code NAF : ${ctx.naf}` : null,
    ctx.city ? `Ville : ${ctx.city}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
