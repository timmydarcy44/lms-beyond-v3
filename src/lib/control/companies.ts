import { getServiceRoleClient } from "@/lib/supabase/server";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/crm/pipeline-shared";
import { pipelineOwnerLabel } from "@/lib/crm/pipeline-btob-owners";
import { classifyOrganization, normalizeOrgName } from "@/lib/control/policy";
import { looksLikeTestAccount, looksLikeTestDeal } from "@/lib/control/test-account";

export type CompanyListItem = {
  id: string;
  name: string;
  city: string;
  sector: string;
  siret: string;
  naf: string;
  opco: string;
  roleBusiness: boolean;
  roleCfa: boolean;
  businessLabel: string;
  apprentices: number;
  offers: number;
  candidates: number;
  owner: string;
  isDemo: boolean;
  logoUrl: string | null;
  organizationId: string | null;
  cfaCompanyId: string | null;
};

export type CompanyDirectory = {
  items: CompanyListItem[];
  schemaReady: boolean;
};

export type DuplicatePair = {
  id: string;
  reason: "siret" | "nom-ville";
  left: CompanyListItem;
  right: CompanyListItem;
};

const STAGE_LABELS = new Map(DEFAULT_PIPELINE_STAGES.map((stage) => [stage.slug, stage.label]));

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function digits(value: unknown) {
  return text(value).replace(/\s/g, "");
}

function businessLabel(status: string, stage: string) {
  if (status === "active" || stage === "client_actif" || stage === "reussi" || stage === "proposition_signee") return "Client";
  if (stage && STAGE_LABELS.has(stage)) return STAGE_LABELS.get(stage) ?? "Prospect";
  if (status === "onboarding") return "En démarrage";
  if (status === "trial") return "Essai";
  if (status === "archived") return "Archivé";
  return "Prospect";
}

async function rows(db: NonNullable<ReturnType<typeof getServiceRoleClient>>, table: string, attempts: string[]) {
  for (const columns of attempts) {
    const query = await db.from(table).select(columns);
    if (!query.error) return (query.data ?? []) as AnyRow[];
  }
  return [] as AnyRow[];
}

function countBy(list: AnyRow[], key: string) {
  const map = new Map<string, number>();
  for (const row of list) {
    const id = text(row[key]);
    if (!id) continue;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

export async function loadCompanyDirectory(): Promise<CompanyDirectory> {
  const db = getServiceRoleClient();
  if (!db) return { items: [], schemaReady: false };

  const companies = await db.from("companies").select("*").is("merged_into", null).order("name");
  const schemaReady = !companies.error;
  const [orgs, cfas, deals, sources, placements, needs, sends, managers] = await Promise.all([
    rows(db, "organizations", ["id, name, slug, logo_url, status, kind, account_manager_id, siret", "id, name, slug, logo_url, siret", "id, name, slug"]),
    rows(db, "cfa_companies", ["id, company_name, city, siret, naf_code, naf_label, opco", "id, company_name, siret", "id, company_name"]),
    rows(db, "crm_pipeline_deals", [
      "id, company_name, city, siret, stage_slug, organization_id, contact_owner_email, offers_business, offers_school, pipeline_type, updated_at, sector, naf_code, opco_name, company_id",
      "id, company_name, stage_slug, updated_at",
    ]),
    schemaReady ? rows(db, "company_sources", ["company_id, source_type, source_id"]) : Promise.resolve([]),
    rows(db, "apprentice_placements", ["company_id, status"]),
    rows(db, "cfa_company_needs", ["company_id"]),
    rows(db, "cfa_profile_sends", ["company_id"]),
    rows(db, "account_managers", ["id, first_name, last_name, email", "id, email"]),
  ]);

  const managerName = new Map(
    managers.map((manager) => [
      text(manager.id),
      [text(manager.first_name), text(manager.last_name)].filter(Boolean).join(" ").trim() || text(manager.email),
    ]),
  );
  const orgById = new Map(orgs.map((org) => [text(org.id), org]));
  const cfaById = new Map(cfas.map((company) => [text(company.id), company]));
  const btobDeals = deals.filter((deal) => text(deal.pipeline_type) !== "btoc");
  const apprentices = countBy(
    placements.filter((row) => ["pending", "active"].includes(text(row.status)) || !text(row.status)),
    "company_id",
  );
  const offerCounts = countBy(needs, "company_id");
  const candidateCounts = countBy(sends, "company_id");

  const latestDeal = (matches: AnyRow[]) =>
    matches.sort((a, b) => text(b.updated_at).localeCompare(text(a.updated_at)))[0] ?? null;

  if (!schemaReady) {
    return { schemaReady: false, items: virtualItems(orgs, cfas, btobDeals, apprentices, offerCounts, candidateCounts, managerName) };
  }

  const sourcesByCompany = new Map<string, AnyRow[]>();
  for (const source of sources) {
    const companyId = text(source.company_id);
    sourcesByCompany.set(companyId, [...(sourcesByCompany.get(companyId) ?? []), source]);
  }

  const items = ((companies.data ?? []) as AnyRow[]).map((company) => {
    const id = text(company.id);
    const linked = sourcesByCompany.get(id) ?? [];
    const organizationId = text(company.organization_id) || text(linked.find((source) => source.source_type === "organization")?.source_id);
    const cfaCompanyId = text(company.cfa_company_id) || text(linked.find((source) => source.source_type === "cfa_company")?.source_id);
    const org = organizationId ? orgById.get(organizationId) : undefined;
    const cfa = cfaCompanyId ? cfaById.get(cfaCompanyId) : undefined;
    const siret = digits(company.siret) || digits(org?.siret) || digits(cfa?.siret);
    const relatedDeals = btobDeals.filter((deal) => {
      if (text(deal.company_id) === id) return true;
      if (organizationId && text(deal.organization_id) === organizationId) return true;
      const dealSiret = digits(deal.siret);
      return Boolean(siret) && dealSiret === siret;
    });
    const deal = latestDeal(relatedDeals);
    const kind = text(org?.kind);
    const slug = text(org?.slug);
    const isDemo =
      company.is_demo === true ||
      org?.is_test === true ||
      kind === "demo" ||
      classifyOrganization(slug).kind === "demo" ||
      looksLikeTestAccount({ name: text(company.name), email: text(deal?.email) }) ||
      relatedDeals.some((row) => looksLikeTestDeal({ company_name: text(row.company_name), email: text(row.email), is_test: row.is_test === true }));
    const ownerId = text(org?.account_manager_id);
    return {
      id,
      name: text(company.name) || text(org?.name) || text(cfa?.company_name) || "Sans nom",
      city: text(company.city) || text(cfa?.city) || text(deal?.city),
      sector: text(company.sector) || text(cfa?.naf_label) || text(deal?.sector),
      siret,
      naf: text(company.naf_code) || text(cfa?.naf_code) || text(deal?.naf_code),
      opco: text(company.opco) || text(cfa?.opco) || text(deal?.opco_name),
      roleBusiness: company.role_business === true,
      roleCfa: company.role_cfa === true,
      businessLabel: businessLabel(text(org?.status), text(deal?.stage_slug)),
      apprentices: cfaCompanyId ? apprentices.get(cfaCompanyId) ?? 0 : 0,
      offers: cfaCompanyId ? offerCounts.get(cfaCompanyId) ?? 0 : 0,
      candidates: cfaCompanyId ? candidateCounts.get(cfaCompanyId) ?? 0 : 0,
      owner: (ownerId && managerName.get(ownerId)) || pipelineOwnerLabel(text(company.owner_email) || text(deal?.contact_owner_email)) || "—",
      isDemo,
      logoUrl: text(org?.logo_url) || null,
      organizationId: organizationId || null,
      cfaCompanyId: cfaCompanyId || null,
    } satisfies CompanyListItem;
  });

  return { schemaReady: true, items };
}

function virtualItems(
  orgs: AnyRow[],
  cfas: AnyRow[],
  deals: AnyRow[],
  apprentices: Map<string, number>,
  offers: Map<string, number>,
  candidates: Map<string, number>,
  managerName: Map<string, string>,
): CompanyListItem[] {
  const items: CompanyListItem[] = [];
  const orgIds = new Set(orgs.map((org) => text(org.id)));
  for (const org of orgs) {
    const id = text(org.id);
    const siret = digits(org.siret);
    const deal = deals.find((row) => text(row.organization_id) === id || (siret && digits(row.siret) === siret));
    const kind = text(org.kind);
    items.push({
      id: `org_${id}`,
      name: text(org.name) || "Sans nom",
      city: text(deal?.city),
      sector: text(deal?.sector),
      siret,
      naf: text(deal?.naf_code),
      opco: text(deal?.opco_name),
      roleBusiness: true,
      roleCfa: deal?.offers_school === true,
      businessLabel: businessLabel(text(org.status), text(deal?.stage_slug)),
      apprentices: 0,
      offers: 0,
      candidates: 0,
      owner: managerName.get(text(org.account_manager_id)) || pipelineOwnerLabel(text(deal?.contact_owner_email)),
      isDemo: org.is_test === true || kind === "demo" || classifyOrganization(text(org.slug)).kind === "demo" || looksLikeTestAccount({ name: text(org.name) }),
      logoUrl: text(org.logo_url) || null,
      organizationId: id,
      cfaCompanyId: null,
    });
  }
  for (const company of cfas) {
    const id = text(company.id);
    items.push({
      id: `cfa_${id}`,
      name: text(company.company_name) || "Sans nom",
      city: text(company.city),
      sector: text(company.naf_label),
      siret: digits(company.siret),
      naf: text(company.naf_code),
      opco: text(company.opco),
      roleBusiness: false,
      roleCfa: true,
      businessLabel: "—",
      apprentices: apprentices.get(id) ?? 0,
      offers: offers.get(id) ?? 0,
      candidates: candidates.get(id) ?? 0,
      owner: "—",
      isDemo: looksLikeTestAccount({ name: text(company.company_name), email: text(company.email) }),
      logoUrl: null,
      organizationId: null,
      cfaCompanyId: id,
    });
  }
  for (const deal of deals) {
    const orgId = text(deal.organization_id);
    const siret = digits(deal.siret);
    if (orgId && orgIds.has(orgId)) continue;
    if (siret && items.some((item) => item.siret === siret && item.roleBusiness)) continue;
    items.push({
      id: `deal_${text(deal.id)}`,
      name: text(deal.company_name) || "Sans nom",
      city: text(deal.city),
      sector: text(deal.sector),
      siret,
      naf: text(deal.naf_code),
      opco: text(deal.opco_name),
      roleBusiness: deal.offers_business !== false,
      roleCfa: deal.offers_school === true,
      businessLabel: businessLabel("", text(deal.stage_slug)),
      apprentices: 0,
      offers: 0,
      candidates: 0,
      owner: pipelineOwnerLabel(text(deal.contact_owner_email)),
      isDemo: looksLikeTestDeal({ company_name: text(deal.company_name), email: text(deal.email), is_test: deal.is_test === true }),
      logoUrl: null,
      organizationId: null,
      cfaCompanyId: null,
    });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function findDuplicatePairs(items: CompanyListItem[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  const seen = new Set<string>();
  const push = (reason: DuplicatePair["reason"], left: CompanyListItem, right: CompanyListItem) => {
    const key = [left.id, right.id].sort().join(":");
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ id: key, reason, left, right });
  };
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i];
      const right = items[j];
      if (left.siret && left.siret === right.siret) push("siret", left, right);
      else if (
        left.city &&
        right.city &&
        normalizeOrgName(left.city) === normalizeOrgName(right.city) &&
        normalizeOrgName(left.name) === normalizeOrgName(right.name)
      ) {
        push("nom-ville", left, right);
      }
    }
  }
  return pairs;
}

export async function findCompanyBySource(sourceType: "organization" | "cfa_company" | "deal", sourceId: string) {
  const db = getServiceRoleClient();
  if (!db) return null;
  const source = await db
    .from("company_sources")
    .select("company_id")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .maybeSingle();
  if (source.error || !source.data?.company_id) return null;
  let companyId = String(source.data.company_id);
  const row = await db.from("companies").select("merged_into").eq("id", companyId).maybeSingle();
  if (row.data?.merged_into) companyId = String(row.data.merged_into);
  return companyId;
}
