import type { SupabaseClient } from "@supabase/supabase-js";
import { searchRegistry } from "@/lib/cfa/registry-company";
import { findBoampSignals } from "@/lib/open-data/boamp";
import { isCallForTender } from "@/lib/open-data/tender";

export const BUSINESS_SIGNAL_DAILY_LIMIT = 10;

const QUERIES = [
  { q: "responsable formation", kind: "formation" },
  { q: "chargé de formation", kind: "formation" },
  { q: "plan de développement des compétences", kind: "formation" },
  { q: "digital learning", kind: "lms" },
  { q: "learning management system", kind: "lms" },
  { q: "LMS formation", kind: "lms" },
  { q: "SIRH", kind: "rh" },
  { q: "transformation RH", kind: "rh" },
] as const;

export type BusinessSignalKind = (typeof QUERIES)[number]["kind"];

export type BusinessSignalLead = {
  id: string;
  siret: string;
  company_name: string;
  city: string | null;
  signal_kind: string;
  reason: string | null;
  source_url: string | null;
  status: string;
  deal_id: string | null;
  created_at: string;
};

const SIGNAL_WORD = /formation|competence|compétences|lms|learning|sirh|ressources humaines|\brh\b|onboarding|digital learning/i;

function fold(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function publicExcerpt(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/(?:\+33|0)\s*[1-9](?:[\s.]?\d{2}){4}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 280);
}

function dayIndex() {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
}

async function franceTravailToken() {
  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Ajoutez FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET pour lire les offres publiques.");
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "api_offresdemploiv2 o2dsoffre",
  });
  const response = await fetch("https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("France Travail refuse l'accès aux offres.");
  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("France Travail n'a pas renvoyé de jeton.");
  return payload.access_token;
}

type Offer = { companyName: string; city: string; postalCode: string; department: string; title: string; excerpt: string; url: string; kind: BusinessSignalKind };

async function searchOffers(token: string, query: (typeof QUERIES)[number], rangeStart: number): Promise<Offer[]> {
  const url = new URL("https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search");
  url.searchParams.set("motsCles", query.q);
  url.searchParams.set("range", `${rangeStart}-${rangeStart + 49}`);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Les offres France Travail sont indisponibles.");
  const payload = (await response.json()) as {
    resultats?: {
      intitule?: string;
      description?: string;
      origineOffre?: { urlOrigine?: string };
      entreprise?: { nom?: string };
      lieuTravail?: { libelle?: string; codePostal?: string };
    }[];
  };
  return (payload.resultats ?? []).flatMap((offer) => {
    const title = String(offer.intitule ?? "").trim();
    const description = String(offer.description ?? "");
    const corpus = `${title}\n${description}`;
    if (!SIGNAL_WORD.test(fold(corpus)) && !SIGNAL_WORD.test(corpus)) return [];
    const companyName = String(offer.entreprise?.nom ?? "").trim();
    if (!companyName || /confidentiel|anonyme/i.test(companyName)) return [];
    const urlOrigine = String(offer.origineOffre?.urlOrigine ?? "");
    return [{
      companyName,
      city: String(offer.lieuTravail?.libelle ?? "").replace(/^\d+\s*-\s*/, "").trim(),
      postalCode: String(offer.lieuTravail?.codePostal ?? "").trim(),
      title: title || query.q,
      excerpt: publicExcerpt(description),
      url: /^https:\/\//.test(urlOrigine) ? urlOrigine : "",
      department: "",
      kind: query.kind,
    }];
  });
}

async function identify(offer: Offer) {
  try {
    const found = await searchRegistry(offer.companyName);
    const companies = found.companies;
    if (companies.length === 1) return companies[0];
    const department = offer.department;
    if (department) {
      const byDepartment = companies.filter((company) => company.postalCode.startsWith(department));
      if (byDepartment.length === 1) return byDepartment[0];
    }
    const city = offer.city.toLowerCase();
    const byCity = companies.filter((company) => city && company.city.toLowerCase().includes(city.slice(0, 4)));
    return byCity.length === 1 ? byCity[0] : null;
  } catch {
    return null;
  }
}

async function known(db: SupabaseClient, sirets: string[], names: string[]) {
  const siretSet = new Set<string>();
  const nameSet = new Set<string>();
  const [deals, organizations, leads] = await Promise.all([
    sirets.length ? db.from("crm_pipeline_deals").select("siret, company_name").in("siret", sirets) : Promise.resolve({ data: [] }),
    sirets.length ? db.from("organizations").select("siret, name").in("siret", sirets) : Promise.resolve({ data: [] }),
    sirets.length ? db.from("biz_signal_leads").select("siret, company_name").in("siret", sirets) : Promise.resolve({ data: [] }),
  ]);
  for (const row of (deals.data ?? []) as { siret?: string | null; company_name?: string | null }[]) {
    if (row.siret) siretSet.add(row.siret);
    if (row.company_name) nameSet.add(row.company_name.toLowerCase());
  }
  for (const row of (organizations.data ?? []) as { siret?: string | null; name?: string | null }[]) {
    if (row.siret) siretSet.add(row.siret);
    if (row.name) nameSet.add(row.name.toLowerCase());
  }
  for (const row of (leads.data ?? []) as { siret?: string | null; company_name?: string | null }[]) {
    if (row.siret) siretSet.add(row.siret);
    if (row.company_name) nameSet.add(row.company_name.toLowerCase());
  }
  if (names.length) {
    const existingNames = await db.from("crm_pipeline_deals").select("company_name").in("company_name", names);
    for (const row of (existingNames.data ?? []) as { company_name?: string | null }[]) {
      if (row.company_name) nameSet.add(row.company_name.toLowerCase());
    }
  }
  return { siretSet, nameSet };
}

export async function runBusinessSignaux(db: SupabaseClient, input: { force?: boolean } = {}) {
  const since = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
  if (!input.force) {
    const already = await db.from("biz_signal_runs").select("id").gte("started_at", since).limit(1);
    if (already.error && /biz_signal_runs|schema cache|does not exist/i.test(already.error.message)) {
      return { ok: false as const, error: "Collez le script 20261026190000_business_signaux.sql." };
    }
    if ((already.data ?? []).length) return { ok: true as const, skipped: true as const, created: 0 };
  }
  const run = await db.from("biz_signal_runs").insert({ started_at: new Date().toISOString() }).select("id").single();
  if (run.error || !run.data) {
    const missing = /biz_signal_runs|schema cache|does not exist/i.test(run.error?.message ?? "");
    return { ok: false as const, error: missing ? "Collez le script 20261026190000_business_signaux.sql." : run.error?.message ?? "Recherche impossible" };
  }
  try {
    const day = dayIndex();
    const offers: Offer[] = [];
    for (const notice of await findBoampSignals(day)) {
      if (isCallForTender(`${notice.title} ${notice.buyer}`)) continue;
      const published = new Date(`${notice.publishedOn}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      offers.push({
        companyName: notice.buyer,
        city: "",
        postalCode: "",
        department: notice.department,
        title: notice.title,
        excerpt: `Publié le ${published}.`,
        url: notice.url,
        kind: notice.kind,
      });
    }
    if (process.env.FRANCE_TRAVAIL_CLIENT_ID?.trim() && process.env.FRANCE_TRAVAIL_CLIENT_SECRET?.trim()) {
      try {
        const token = await franceTravailToken();
        const queries = [QUERIES[day % QUERIES.length], QUERIES[(day + 3) % QUERIES.length]];
        const rangeStart = (day % 4) * 50;
        for (const query of queries) offers.push(...await searchOffers(token, query, rangeStart));
      } catch (error) {
        if (!offers.length) throw error;
      }
    }
    const drafts = [];
    const seen = new Set<string>();
    for (const offer of offers) {
      if (drafts.length >= 20) break;
      const company = await identify(offer);
      const siret = company?.siret;
      if (!siret || seen.has(siret)) continue;
      seen.add(siret);
      const kindLabel = offer.kind === "lms" ? "LMS" : offer.kind === "rh" ? "RH" : "formation";
      const origin = offer.excerpt.startsWith("Publié") ? "Avis public" : "Offre";
      drafts.push({
        siret,
        company_name: company?.companyName || offer.companyName,
        city: company?.city || offer.city || null,
        postal_code: company?.postalCode || offer.postalCode || null,
        naf_code: company?.nafCode || null,
        signal_kind: offer.kind,
        reason: `${origin} « ${offer.title} » : signal ${kindLabel}. ${offer.excerpt}`.trim(),
        source_url: offer.url || null,
      });
    }
    const memory = await known(db, drafts.map((draft) => draft.siret), drafts.map((draft) => draft.company_name));
    const fresh = drafts.filter((draft) => !memory.siretSet.has(draft.siret) && !memory.nameSet.has(draft.company_name.toLowerCase())).slice(0, BUSINESS_SIGNAL_DAILY_LIMIT);
    let createdCount = 0;
    for (const draft of fresh) {
      const inserted = await db.from("biz_signal_leads").insert({ ...draft, status: "pending" });
      if (inserted.error && inserted.error.code !== "23505") throw new Error(inserted.error.message);
      if (!inserted.error) createdCount += 1;
    }
    await db.from("biz_signal_runs").update({ finished_at: new Date().toISOString(), found_count: createdCount }).eq("id", run.data.id);
    return { ok: true as const, skipped: false as const, created: createdCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recherche impossible";
    await db.from("biz_signal_runs").update({ finished_at: new Date().toISOString(), error: message }).eq("id", run.data.id);
    return { ok: false as const, error: message };
  }
}

export async function acceptBusinessSignal(db: SupabaseClient, leadId: string) {
  const lead = await db.from("biz_signal_leads").select("*").eq("id", leadId).eq("status", "pending").maybeSingle();
  const row = lead.data as BusinessSignalLead & { postal_code?: string | null; naf_code?: string | null } | null;
  if (!row) return { ok: false as const, error: "Piste introuvable" };
  const stage = "a_appeler";
  const order = await db.from("crm_pipeline_deals").select("sort_order").eq("pipeline_type", "btob").eq("stage_slug", stage).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const note = `Agent signaux. ${row.reason ?? ""}`.trim();
  let created = await db.from("crm_pipeline_deals").insert({
    pipeline_type: "btob",
    stage_slug: stage,
    company_name: row.company_name,
    contact_first_name: "",
    email: null,
    phone: null,
    siret: row.siret,
    location: [row.postal_code, row.city].filter(Boolean).join(" ") || null,
    naf_code: row.naf_code,
    why_target: note,
    training_needs: [row.signal_kind],
    notes: note,
    source: "agent_signaux",
    amount_cents: 0,
    sort_order: Number((order.data as { sort_order?: number } | null)?.sort_order ?? -1) + 1,
  }).select("id").single();
  if (created.error && /column|schema cache/i.test(created.error.message)) {
    created = await db.from("crm_pipeline_deals").insert({
      pipeline_type: "btob",
      stage_slug: stage,
      company_name: row.company_name,
      contact_first_name: "",
      notes: note,
      source: "agent_signaux",
      amount_cents: 0,
      sort_order: Number((order.data as { sort_order?: number } | null)?.sort_order ?? -1) + 1,
    }).select("id").single();
  }
  if (created.error || !created.data) return { ok: false as const, error: created.error?.message ?? "Création impossible" };
  await db.from("biz_signal_leads").update({ status: "accepted", deal_id: created.data.id }).eq("id", leadId);
  return { ok: true as const, dealId: created.data.id };
}
