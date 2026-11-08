import { getServiceRoleClient } from "@/lib/supabase/server";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/crm/pipeline-shared";
import { classifyOrganization } from "@/lib/control/policy";
import { findDuplicatePairs, loadCompanyDirectory } from "@/lib/control/companies";
import { looksLikeTestAccount, looksLikeTestDeal } from "@/lib/control/test-account";

export type TodayChannel = "linkedin" | "call" | "email" | "other";

export type TodayAction = {
  id: string;
  title: string;
  company: string;
  contact: string;
  date: string;
  channel: TodayChannel;
  ownerEmail: string;
  phone: string;
  email: string;
  linkedin: string;
};

export type TodayStage = { slug: string; label: string; owners: string[] };

export type TodayAlert = { id: string; label: string; href: string; count: number };

export type TodayIncomingDemande = {
  id: string;
  organizationName: string;
  courseTitle: string;
  contactName: string;
  amountHtCents: number | null;
  source: string;
  updatedAt: string;
};

export type TodayHome = {
  firstName: string;
  email: string;
  revenueCents: number | null;
  prospects: string[];
  opens: Array<{ ownerEmail: string; opened: boolean }>;
  actions: TodayAction[];
  stages: TodayStage[];
  alerts: TodayAlert[];
  incomingDemandes: TodayIncomingDemande[];
  cfa: {
    candidates: number;
    active: number;
    review: number;
    withoutCompany: number;
  };
};

const STAGE_LABELS: Record<string, string> = {
  a_appeler: "À appeler",
  mail_envoye_catalogue: "Catalogue envoyé",
  presentation_programmee: "Présentation prévue",
  demo_realisee: "Démo faite",
  proposition_a_faire: "Proposition à faire",
  proposition_envoyee: "Proposition envoyée",
  proposition_signee: "Proposition signée",
  reussi: "Réussi",
  client_actif: "Client actif",
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function loadDealRows(db: NonNullable<ReturnType<typeof getServiceRoleClient>>): Promise<Array<Record<string, unknown>>> {
  const selects = [
    "id, company_name, contact_first_name, contact_last_name, email, phone, contact_linkedin, stage_slug, organization_id, contact_owner_email, next_action, next_action_date, approach_channel, pipeline_type, catalog_email_sent_at, catalog_email_opened_at, naf_code, is_test",
    "id, company_name, contact_first_name, contact_last_name, email, phone, contact_linkedin, stage_slug, organization_id, contact_owner_email, next_action, next_action_date, approach_channel, pipeline_type, catalog_email_sent_at, catalog_email_opened_at, naf_code",
    "id, company_name, contact_first_name, contact_last_name, email, phone, stage_slug, organization_id, contact_owner_email, next_action, next_action_date, pipeline_type",
  ];
  for (const columns of selects) {
    const result = await db.from("crm_pipeline_deals").select(columns).limit(1000);
    if (!result.error) return (result.data ?? []) as unknown as Array<Record<string, unknown>>;
  }
  return [];
}

function channelOf(action: string, approach: string): TodayChannel {
  const blob = `${action} ${approach}`.toLowerCase();
  if (blob.includes("linkedin")) return "linkedin";
  if (blob.includes("appel") || blob.includes("telephone") || blob.includes("téléphone")) return "call";
  if (blob.includes("mail") || blob.includes("e-mail") || blob.includes("email")) return "email";
  if (approach === "linkedin") return "linkedin";
  if (approach === "telephone") return "call";
  return "other";
}

export async function loadTodayHome(user: { email?: string | null; user_metadata?: Record<string, unknown> }): Promise<TodayHome> {
  const email = text(user.email).toLowerCase();
  const metaName = text(user.user_metadata?.full_name) || text(user.user_metadata?.name);
  const firstName = (metaName || email.split("@")[0] || "toi").split(/[\s.]+/)[0] || "toi";
  const db = getServiceRoleClient();
  const empty: TodayHome = {
    firstName,
    email,
    revenueCents: null,
    prospects: [],
    opens: [],
    actions: [],
    stages: DEFAULT_PIPELINE_STAGES.filter((stage) => stage.slug !== "echec").map((stage) => ({
      slug: stage.slug,
      label: STAGE_LABELS[stage.slug] ?? stage.label,
      owners: [],
    })),
    alerts: [],
    incomingDemandes: [],
    cfa: { candidates: 0, active: 0, review: 0, withoutCompany: 0 },
  };
  if (!db) return empty;

  try {
  const [dealRows, orgsQuery, invoicesQuery, expertsQuery, applicationsQuery, placementsQuery, dossiersQuery] = await Promise.all([
    loadDealRows(db),
    db.from("organizations").select("id, slug, kind, is_test"),
    db.from("org_billing_documents").select("org_id, doc_type, status, issued_at, due_at, amount_ht_cents"),
    db.from("experts").select("id, email").or("review_status.eq.pending_review,review_status.is.null"),
    db.from("cfa_applications").select("id, status, email, first_name, last_name"),
    db.from("apprentice_placements").select("apprentice_id, status"),
    db
      .from("formation_dossiers")
      .select(
        "id, organization_id, course_title, contact_name, amount_ht_cents, source, status, updated_at",
      )
      .in("source", ["dashboard_request", "site_request"])
      .eq("status", "qualification")
      .order("updated_at", { ascending: false })
      .limit(12),
  ]);

  let orgRows = (orgsQuery.error ? [] : orgsQuery.data ?? []) as Array<Record<string, unknown>>;
  if (orgsQuery.error) {
    const retry = await db.from("organizations").select("id, slug");
    orgRows = (retry.error ? [] : retry.data ?? []) as Array<Record<string, unknown>>;
  }
  const demoOrgIds = new Set(
    orgRows
      .filter((org) => org.is_test === true || text(org.kind) === "demo" || classifyOrganization(text(org.slug)).kind === "demo")
      .map((org) => text(org.id)),
  );

  const deals = dealRows.filter((deal) => {
    if (text(deal.pipeline_type) === "btoc") return false;
    if (text(deal.stage_slug) === "echec") return false;
    if (looksLikeTestDeal({ company_name: text(deal.company_name), email: text(deal.email), is_test: deal.is_test === true })) return false;
    const orgId = text(deal.organization_id);
    return !orgId || !demoOrgIds.has(orgId);
  });

  const stages = empty.stages.map((stage) => ({
    ...stage,
    owners: deals.filter((deal) => text(deal.stage_slug) === stage.slug).map((deal) => text(deal.contact_owner_email).toLowerCase()),
  }));
  const knownStages = new Set(stages.map((stage) => stage.slug));
  const otherOwners = deals
    .filter((deal) => !knownStages.has(text(deal.stage_slug)))
    .map((deal) => text(deal.contact_owner_email).toLowerCase());
  if (otherOwners.length > 0) stages.push({ slug: "autre", label: "Autre", owners: otherOwners });

  const actions: TodayAction[] = deals
    .filter((deal) => text(deal.next_action_date))
    .map((deal) => ({
      id: text(deal.id),
      title: text(deal.next_action) || "Action à faire",
      company: text(deal.company_name) || "Entreprise",
      contact: `${text(deal.contact_first_name)} ${text(deal.contact_last_name)}`.trim(),
      date: text(deal.next_action_date).slice(0, 10),
      channel: channelOf(text(deal.next_action), text(deal.approach_channel)),
      ownerEmail: text(deal.contact_owner_email).toLowerCase(),
      phone: text(deal.phone),
      email: text(deal.email),
      linkedin: text(deal.contact_linkedin),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const month = new Date().toISOString().slice(0, 7);
  let revenueCents: number | null = null;
  let overdueInvoices = 0;
  if (!invoicesQuery.error) {
    const today = new Date().toISOString().slice(0, 10);
    let monthTotal = 0;
    let monthDocs = 0;
    for (const doc of invoicesQuery.data ?? []) {
      if (demoOrgIds.has(text(doc.org_id))) continue;
      const type = text(doc.doc_type);
      const status = text(doc.status);
      const issued = text(doc.issued_at).slice(0, 7);
      if ((type === "invoice" || type === "credit_note") && issued === month && ["issued", "paid", "overdue"].includes(status)) {
        const amount = Number(doc.amount_ht_cents ?? 0);
        monthTotal += type === "credit_note" ? -amount : amount;
        monthDocs += 1;
      }
      const due = text(doc.due_at).slice(0, 10);
      if (type === "invoice" && (status === "overdue" || (status === "issued" && due && due < today))) overdueInvoices += 1;
    }
    if (monthDocs > 0) revenueCents = monthTotal;
  }

  const applications = (applicationsQuery.error ? [] : applicationsQuery.data ?? []).filter(
    (row) => !looksLikeTestAccount({ email: text(row.email), name: `${text(row.first_name)} ${text(row.last_name)}` }),
  );
  const placed = new Set(
    ((placementsQuery.error ? [] : placementsQuery.data) ?? [])
      .filter((row) => {
        const status = text(row.status);
        return status === "" || status === "pending" || status === "active";
      })
      .map((row) => text(row.apprentice_id)),
  );
  const living = applications.filter((row) => text(row.status) !== "rejected");
  const cfa = {
    candidates: living.length,
    active: living.filter((row) => ["admitted", "contract"].includes(text(row.status))).length,
    review: living.filter((row) => text(row.status) === "review").length,
    withoutCompany: placementsQuery.error
      ? 0
      : living.filter((row) => ["admitted", "review", "administrative"].includes(text(row.status)) && !placed.has(text(row.id))).length,
  };

  const directory = await loadCompanyDirectory().catch(() => ({ items: [], schemaReady: false }));
  const duplicates = findDuplicatePairs(directory.items.filter((item) => !item.isDemo)).length;
  const nafMissing = deals.some((deal) => "naf_code" in deal)
    ? deals.filter((deal) => !text(deal.naf_code)).length
    : 0;
  const expertsPending = expertsQuery.error
    ? 0
    : (expertsQuery.data ?? []).filter((row) => !looksLikeTestAccount({ email: text((row as { email?: string }).email) })).length;
  const testAccounts = demoOrgIds.size;

  const incomingRows = (dossiersQuery.error ? [] : dossiersQuery.data ?? []) as Array<
    Record<string, unknown>
  >;
  const incomingOrgIds = Array.from(
    new Set(incomingRows.map((row) => text(row.organization_id)).filter(Boolean)),
  );
  const incomingOrgNames = new Map<string, string>();
  if (incomingOrgIds.length) {
    const { data: incomingOrgs } = await db
      .from("organizations")
      .select("id, name")
      .in("id", incomingOrgIds);
    for (const org of incomingOrgs ?? []) {
      incomingOrgNames.set(text(org.id), text(org.name) || "Entreprise");
    }
  }
  const incomingDemandes: TodayIncomingDemande[] = incomingRows.map((row) => ({
    id: text(row.id),
    organizationName: incomingOrgNames.get(text(row.organization_id)) || "Entreprise",
    courseTitle: text(row.course_title) || "Formation",
    contactName: text(row.contact_name),
    amountHtCents: row.amount_ht_cents != null ? Number(row.amount_ht_cents) : null,
    source: text(row.source),
    updatedAt: text(row.updated_at),
  }));

  const alerts: TodayAlert[] = [
    {
      id: "incoming",
      label: "demandes entrantes",
      href: "/super/crm/demandes",
      count: incomingDemandes.length,
    },
    { id: "duplicates", label: "doublons à comparer", href: "/super/entreprises/doublons", count: duplicates },
    { id: "experts", label: "experts à valider", href: "/super/experts?status=pending_review", count: expertsPending },
    { id: "tests", label: "comptes de test", href: "/super/entreprises", count: testAccounts },
    { id: "naf", label: "codes NAF à vérifier", href: "/super/crm/pipeline", count: nafMissing },
    { id: "invoices", label: "factures en retard", href: "/super/chiffre-affaires", count: overdueInvoices },
  ].filter((alert) => alert.count > 0);

  return {
    firstName,
    email,
    revenueCents,
    prospects: deals.map((deal) => text(deal.contact_owner_email).toLowerCase()),
    opens: deals
      .filter((deal) => text(deal.catalog_email_sent_at))
      .map((deal) => ({ ownerEmail: text(deal.contact_owner_email).toLowerCase(), opened: Boolean(text(deal.catalog_email_opened_at)) })),
    actions,
    stages,
    alerts,
    incomingDemandes,
    cfa,
  };
  } catch {
    return empty;
  }
}
