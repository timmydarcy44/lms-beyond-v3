import { getServiceRoleClient } from "@/lib/supabase/server";

export type EntrepriseAssistantContext = {
  organization: { id: string; name: string; onboarding_step: string | null; edge_enterprise_tier: number };
  employeeCount: number;
  employeesSample: Array<{ id: string; first_name: string | null; last_name: string | null; equipe_id: string | null }>;
  diagnosticsActiveCount: number;
  equipes: Array<{ id: string; name: string }>;
  equipeAggregats: Array<{
    equipe_id: string;
    nb_diagnostics_completes: number;
    idmc_moyen: number | null;
    stress_moyen: number | null;
    insight_principal: string | null;
    insuffisant: boolean;
  }>;
  sessionsBctCount: number;
};

/**
 * Charge le contexte assistant — toutes les requêtes sont filtrées par organizationId.
 * employees.company_id et diagnostics/aggregats/sessions.organization_id (ou organisation_id).
 */
export async function fetchEntrepriseAssistantContext(
  organizationId: string,
): Promise<EntrepriseAssistantContext | null> {
  const service = getServiceRoleClient();
  if (!service) return null;

  const orgId = organizationId;

  const [
    { data: org, error: orgErr },
    { count: employeeCount },
    { data: employeesSample },
    { count: diagnosticsActiveCount },
    { data: equipes },
    { data: equipeAggregats },
    { count: sessionsBctCount },
  ] = await Promise.all([
    service
      .from("organizations")
      .select("id, name, onboarding_step, edge_enterprise_tier")
      .eq("id", orgId)
      .maybeSingle(),
    service.from("employees").select("id", { count: "exact", head: true }).eq("company_id", orgId),
    service
      .from("employees")
      .select("id, first_name, last_name, equipe_id")
      .eq("company_id", orgId)
      .limit(30),
    service
      .from("collaborateur_diagnostics")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .eq("actif", true),
    service.from("equipes").select("id, name").eq("organisation_id", orgId),
    service
      .from("equipe_aggregats")
      .select(
        "equipe_id, nb_diagnostics_completes, idmc_moyen, stress_moyen, insight_principal, insuffisant",
      )
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
    service.from("sessions_bct").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
  ]);

  if (orgErr || !org) return null;

  return {
    organization: {
      id: org.id as string,
      name: String(org.name ?? "Organisation"),
      onboarding_step: (org.onboarding_step as string | null) ?? null,
      edge_enterprise_tier: Number(org.edge_enterprise_tier ?? 1),
    },
    employeeCount: employeeCount ?? 0,
    employeesSample: (employeesSample ?? []).map((e) => ({
      id: e.id as string,
      first_name: (e.first_name as string | null) ?? null,
      last_name: (e.last_name as string | null) ?? null,
      equipe_id: (e.equipe_id as string | null) ?? null,
    })),
    diagnosticsActiveCount: diagnosticsActiveCount ?? 0,
    equipes: (equipes ?? []).map((e) => ({ id: e.id as string, name: String(e.name) })),
    equipeAggregats: (equipeAggregats ?? []).map((a) => ({
      equipe_id: a.equipe_id as string,
      nb_diagnostics_completes: Number(a.nb_diagnostics_completes ?? 0),
      idmc_moyen: a.idmc_moyen != null ? Number(a.idmc_moyen) : null,
      stress_moyen: a.stress_moyen != null ? Number(a.stress_moyen) : null,
      insight_principal: (a.insight_principal as string | null) ?? null,
      insuffisant: Boolean(a.insuffisant),
    })),
    sessionsBctCount: sessionsBctCount ?? 0,
  };
}

export function buildEntrepriseAssistantSystemPrompt(
  organizationId: string,
  ctx: EntrepriseAssistantContext,
): string {
  const payload = {
    organization_id: organizationId,
    organization: ctx.organization,
    stats: {
      employees: ctx.employeeCount,
      diagnostics_actifs: ctx.diagnosticsActiveCount,
      sessions_bct: ctx.sessionsBctCount,
      equipes: ctx.equipes.length,
    },
    equipes: ctx.equipes,
    radar_aggregats: ctx.equipeAggregats,
    collaborateurs: ctx.employeesSample.map((e) => ({
      prenom: e.first_name,
      nom: e.last_name,
      equipe_id: e.equipe_id,
    })),
  };

  return `Tu es l'assistant RH Beyond pour l'organisation « ${ctx.organization.name} » (ID: ${organizationId}).

RÈGLES RGPD STRICTES :
- Tu ne disposes QUE des données JSON ci-dessous, toutes rattachées à cette organisation.
- Refuse toute demande concernant une autre entreprise ou organisation.
- Ne divulgue jamais de données nominatives hors périmètre (collaborateurs listés = échantillon autorisé uniquement).
- Si on te demande des collaborateurs d'une autre org, réponds : « Je n'ai accès qu'aux données de votre organisation. »

DONNÉES AUTORISÉES (organisation ${organizationId}) :
${JSON.stringify(payload)}

Réponds en français, de façon concise et actionnable (3 à 6 phrases max).`;
}
