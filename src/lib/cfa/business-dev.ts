import type { SupabaseClient } from "@supabase/supabase-js";
import { CFA_SPECIALIZATIONS, getCfaSpecializationLabel, type CfaSpecialization } from "@/lib/cfa-applications";
import { findSeptember2027Offers, mentionsProfessionalTitle, mentionsSeptember2027, type AlternanceOffer } from "@/lib/cfa/alternance-offers";
import { readPublicPage } from "@/lib/cfa/public-page";
import { searchRegistry, type RegistryCompany } from "@/lib/cfa/registry-company";
import { logCompanyEvent } from "@/lib/cfa/company-events";
import { generateJSON } from "@/lib/ai/openai-client";
import { generateChatWithAnthropic } from "@/lib/ai/anthropic-messages";

export const BUSINESS_DEV_DAILY_LIMIT = 10;

const NORMANDY = ["76", "14", "27", "50", "61"];
const PARIS = ["75", "92", "93", "94", "95", "77", "78", "91"];
const CURSUS = new Set<string>(CFA_SPECIALIZATIONS.map((item) => item.value));

const NAF_CURSUS: Record<string, CfaSpecialization> = {
  "62": "ai_business",
  "63": "ai_business",
  "58": "ai_business",
  "93": "sport_business",
  "68": "real_estate",
  "47": "retail_experience",
  "45": "retail_experience",
  "46": "merchandising",
  "14": "luxury_premium",
  "15": "luxury_premium",
  "32": "luxury_premium",
  "70": "business_performance",
  "69": "business_performance",
  "73": "growth_acquisition",
  "74": "strategic_partnerships",
  "82": "strategic_partnerships",
  "78": "strategic_partnerships",
  "64": "growth_acquisition",
  "65": "growth_acquisition",
  "66": "growth_acquisition",
  "55": "luxury_premium",
  "56": "retail_experience",
  "41": "real_estate",
  "43": "real_estate",
  "71": "transition_innovation",
  "72": "ai_management",
  "85": "ai_management",
  "49": "international_business",
  "52": "international_business",
  "10": "entrepreneurship",
};

export type BusinessDevLead = {
  id: string;
  siret: string;
  company_name: string;
  city: string | null;
  postal_code: string | null;
  naf_code: string | null;
  naf_label: string | null;
  headcount_range: string | null;
  cursus_id: string | null;
  reason: string | null;
  territory: string;
  source_url?: string | null;
  mentions_title?: boolean | null;
  model: string | null;
  status: string;
  company_id: string | null;
  created_at: string;
};

type Draft = RegistryCompany & {
  territory: "normandie" | "idf" | "france";
  cursusId: string | null;
  reason: string;
  model: string | null;
  sourceUrl: string;
  mentionsTitle: boolean;
};

function dayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

function territoryOf(postal: string): Draft["territory"] {
  const dept = postal.startsWith("97") || postal.startsWith("98") ? postal.slice(0, 3) : postal.slice(0, 2);
  if (NORMANDY.includes(dept)) return "normandie";
  if (PARIS.includes(dept)) return "idf";
  return "france";
}

function cursusFromNaf(naf: string) {
  const prefix = naf.replace(/\D/g, "").slice(0, 2);
  return NAF_CURSUS[prefix] ?? null;
}

function recentRunCutoff() {
  return new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
}

async function knownSirets(db: SupabaseClient, sirets: string[]) {
  const known = new Set<string>();
  if (!sirets.length) return known;
  const [companies, prospects, leads] = await Promise.all([
    db.from("cfa_companies").select("siret").in("siret", sirets),
    db.from("crm_prospects").select("siret").in("siret", sirets),
    db.from("cfa_bd_leads").select("siret").in("siret", sirets),
  ]);
  for (const batch of [companies.data, prospects.data, leads.data]) {
    for (const row of (batch ?? []) as { siret?: string | null }[]) {
      if (row.siret) known.add(row.siret);
    }
  }
  return known;
}

function offerReason(offer: AlternanceOffer) {
  const place = offer.city ? ` à ${offer.city}` : "";
  const title = offer.mentionsTitle ? " Titre pro mentionné." : "";
  const excerpt = offer.excerpt ? ` ${offer.excerpt}` : "";
  return `Offre « ${offer.title} » (${offer.partner})${place} : alternance pour septembre 2027.${title}${excerpt}`;
}

async function companyFromOffer(offer: AlternanceOffer) {
  try {
    const query = offer.siret || offer.companyName;
    if (!query) return null;
    const found = await searchRegistry(query);
    if (offer.siret) return found.companies[0] ?? null;
    const city = offer.city.toLowerCase();
    return found.companies.find((company) => city && company.city.toLowerCase() === city) ?? found.companies[0] ?? null;
  } catch {
    return null;
  }
}

async function collect(db: SupabaseClient) {
  const offers = await findSeptember2027Offers(dayIndex());
  const drafts: Draft[] = [];
  const seen = new Set<string>();
  for (const offer of offers) {
    if (drafts.length >= 25) break;
    const company = await companyFromOffer(offer);
    const siret = company?.siret || offer.siret;
    if (!siret || seen.has(siret)) continue;
    seen.add(siret);
    const postalCode = company?.postalCode || offer.postalCode;
    drafts.push({
      siret,
      companyName: company?.companyName || offer.companyName,
      tradeName: company?.tradeName || "",
      addressLine: company?.addressLine || "",
      postalCode,
      city: company?.city || offer.city,
      companyAddress: company?.companyAddress || "",
      nafCode: company?.nafCode || "",
      nafLabel: company?.nafLabel || "",
      headcountRange: company?.headcountRange || "",
      idcc: company?.idcc || "",
      idccLabel: company?.idccLabel || "",
      territory: postalCode ? territoryOf(postalCode) : offer.territoryHint,
      cursusId: cursusFromNaf(company?.nafCode || ""),
      reason: offerReason(offer),
      model: null,
      sourceUrl: offer.sourceUrl,
      mentionsTitle: offer.mentionsTitle,
    });
  }
  const known = await knownSirets(db, drafts.map((draft) => draft.siret));
  const fresh = drafts.filter((draft) => !known.has(draft.siret));
  fresh.sort((a, b) => Number(b.mentionsTitle) - Number(a.mentionsTitle) || Number(a.territory === "france") - Number(b.territory === "france"));
  const priority = fresh.filter((draft) => draft.territory !== "france").slice(0, 7);
  const rest = fresh.filter((draft) => draft.territory === "france").slice(0, BUSINESS_DEV_DAILY_LIMIT - priority.length);
  return [...priority, ...rest].slice(0, BUSINESS_DEV_DAILY_LIMIT);
}

async function enrich(drafts: Draft[]) {
  if (!drafts.length) return drafts;
  const catalog = CFA_SPECIALIZATIONS.map((item) => `${item.value} (${item.label})`).join(", ");
  const lines = drafts.map((item) => `${item.siret} | ${item.companyName} | ${item.city} | ${item.nafCode} ${item.nafLabel}`).join("\n");
  const prompt = `Pour chaque entreprise, choisis un cursus parmi : ${catalog}. cursusId vide si aucun ne convient. Ne réécris pas l'offre. reason : une seule phrase sur le lien avec le cursus, sans nom de personne, sans e-mail, sans téléphone.\n${lines}\nRéponds {"items":[{"siret":"","cursusId":"","reason":""}]}`;
  let model: string | null = null;
  let parsed: { items?: { siret?: string; cursusId?: string; reason?: string }[] } | null = await generateJSON(prompt, undefined, "Tu prépares une liste d'entreprises pour un CFA. Tu ne contactes personne et tu n'inventes aucun interlocuteur.");
  if (parsed) model = "openai";
  if (!parsed) {
    const text = await generateChatWithAnthropic(
      "Tu prépares une liste d'entreprises pour un CFA. Tu ne contactes personne et tu n'inventes aucun interlocuteur. Réponds uniquement en JSON.",
      [{ role: "user", content: prompt }],
      { maxTokens: 1200 },
    );
    if (text) {
      try {
        parsed = JSON.parse(text.replace(/^```json\s*|```$/g, "").trim()) as { items?: { siret?: string; cursusId?: string; reason?: string }[] };
        model = "anthropic";
      } catch {
        parsed = null;
      }
    }
  }
  const bySiret = new Map((parsed?.items ?? []).map((item) => [String(item.siret ?? ""), item]));
  return drafts.map((draft) => {
    const extra = bySiret.get(draft.siret);
    const cursusId = extra?.cursusId && CURSUS.has(extra.cursusId) ? extra.cursusId : draft.cursusId;
    const added = extra?.reason?.trim();
    const reason = added ? `${draft.reason} ${added}` : draft.reason;
    return { ...draft, cursusId, reason, model: extra ? model : draft.model };
  });
}

export async function runBusinessDev(db: SupabaseClient, input: { force?: boolean } = {}) {
  if (!input.force) {
    const already = await db.from("cfa_bd_runs").select("id").gte("started_at", recentRunCutoff()).limit(1);
    if (already.error && /cfa_bd_runs|schema cache|does not exist/i.test(already.error.message)) {
      return { ok: false as const, error: "Collez le script 20261026180000_cfa_business_dev.sql." };
    }
    if ((already.data ?? []).length) return { ok: true as const, skipped: true as const, created: 0 };
  }
  const run = await db.from("cfa_bd_runs").insert({ started_at: new Date().toISOString() }).select("id").single();
  if (run.error || !run.data) {
    const missing = /cfa_bd_runs|schema cache|does not exist/i.test(run.error?.message ?? "");
    return { ok: false as const, error: missing ? "Collez le script 20261026180000_cfa_business_dev.sql." : run.error?.message ?? "Recherche impossible" };
  }
  try {
    const drafts = await enrich(await collect(db));
    let createdCount = 0;
    for (const draft of drafts) {
      const inserted = await db.from("cfa_bd_leads").insert({
        siret: draft.siret,
        company_name: draft.companyName,
        city: draft.city || null,
        postal_code: draft.postalCode || null,
        address_line: draft.addressLine || null,
        naf_code: draft.nafCode || null,
        naf_label: draft.nafLabel || null,
        headcount_range: draft.headcountRange || null,
        idcc: draft.idcc || null,
        cursus_id: draft.cursusId,
        reason: draft.reason,
        territory: draft.territory,
        model: draft.model,
        source_url: draft.sourceUrl || null,
        mentions_title: draft.mentionsTitle,
        status: "pending",
      });
      if (inserted.error && /source_url|mentions_title|column/i.test(inserted.error.message)) {
        const retry = await db.from("cfa_bd_leads").insert({
          siret: draft.siret,
          company_name: draft.companyName,
          city: draft.city || null,
          postal_code: draft.postalCode || null,
          address_line: draft.addressLine || null,
          naf_code: draft.nafCode || null,
          naf_label: draft.nafLabel || null,
          headcount_range: draft.headcountRange || null,
          idcc: draft.idcc || null,
          cursus_id: draft.cursusId,
          reason: draft.reason,
          territory: draft.territory,
          model: draft.model,
          status: "pending",
        });
        if (retry.error && retry.error.code !== "23505") throw new Error(retry.error.message);
        if (!retry.error) createdCount += 1;
        continue;
      }
      if (inserted.error && inserted.error.code !== "23505") throw new Error(inserted.error.message);
      if (!inserted.error) createdCount += 1;
    }
    await db.from("cfa_bd_runs").update({ finished_at: new Date().toISOString(), found_count: createdCount }).eq("id", run.data.id);
    return { ok: true as const, skipped: false as const, created: createdCount, notice: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recherche impossible";
    await db.from("cfa_bd_runs").update({ finished_at: new Date().toISOString(), error: message }).eq("id", run.data.id);
    return { ok: false as const, error: message };
  }
}

function excerptAround(value: string) {
  const at = value.toLowerCase().indexOf("2027");
  const start = Math.max(0, at - 80);
  return value
    .slice(start, start + 280)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/(?:\+33|0)\s*[1-9](?:[\s.]?\d{2}){4}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function capturePublicOffer(db: SupabaseClient, rawUrl: string, companyName = "") {
  const page = await readPublicPage(rawUrl, companyName);
  const corpus = `${page.title}\n${page.text}`;
  if (!/alternance|apprentissage|apprenti/i.test(corpus)) throw new Error("Cette page ne parle pas d'alternance.");
  if (!mentionsSeptember2027("", corpus)) throw new Error("Cette page ne mentionne pas septembre 2027.");
  if (!page.companyName) throw new Error("Le nom de l'entreprise n'est pas lisible. Indiquez-le à côté de l'adresse.");
  const offer: AlternanceOffer = {
    siret: page.siret,
    companyName: page.companyName,
    city: page.city,
    postalCode: "",
    title: page.title || "Page publique",
    excerpt: excerptAround(page.text),
    partner: "Page publique",
    sourceUrl: page.url,
    mentionsTitle: mentionsProfessionalTitle(corpus),
    territoryHint: "france",
  };
  const company = await companyFromOffer(offer);
  const siret = company?.siret || offer.siret;
  if (!siret) throw new Error("Cette entreprise est introuvable dans l'annuaire.");
  const known = await knownSirets(db, [siret]);
  if (known.has(siret)) throw new Error("Cette entreprise est déjà connue.");
  const postalCode = company?.postalCode || "";
  const row = {
    siret,
    company_name: company?.companyName || offer.companyName,
    city: company?.city || offer.city || null,
    postal_code: postalCode || null,
    address_line: company?.addressLine || null,
    naf_code: company?.nafCode || null,
    naf_label: company?.nafLabel || null,
    headcount_range: company?.headcountRange || null,
    idcc: company?.idcc || null,
    cursus_id: cursusFromNaf(company?.nafCode || ""),
    reason: offerReason(offer),
    territory: postalCode ? territoryOf(postalCode) : "france",
    model: null,
    source_url: offer.sourceUrl,
    mentions_title: offer.mentionsTitle,
    status: "pending",
  };
  let inserted = await db.from("cfa_bd_leads").insert(row);
  if (inserted.error && /source_url|mentions_title|column/i.test(inserted.error.message)) {
    const { source_url: _source, mentions_title: _title, ...base } = row;
    inserted = await db.from("cfa_bd_leads").insert(base);
  }
  if (inserted.error?.code === "23505") throw new Error("Cette entreprise est déjà connue.");
  if (inserted.error) throw new Error(inserted.error.message);
  return { ok: true as const, companyName: company?.companyName || offer.companyName };
}

export async function acceptBusinessDevLead(db: SupabaseClient, leadId: string, actorId: string | null) {
  const lead = await db.from("cfa_bd_leads").select("*").eq("id", leadId).eq("status", "pending").maybeSingle();
  const row = lead.data as (BusinessDevLead & { address_line?: string | null; idcc?: string | null }) | null;
  if (!row) return { ok: false as const, error: "Piste introuvable" };
  const cursus = row.cursus_id && CURSUS.has(row.cursus_id) ? row.cursus_id : null;
  const note = `Agent Business Dev. ${row.reason ?? ""}`.trim();
  const full = {
    company_name: row.company_name,
    siret: row.siret,
    city: row.city,
    postal_code: row.postal_code,
    address_line: row.address_line ?? null,
    company_address: [row.address_line, row.postal_code, row.city].filter(Boolean).join(" ") || null,
    naf_code: row.naf_code,
    naf_label: row.naf_label,
    headcount_range: row.headcount_range,
    idcc: row.idcc ?? null,
    status: "to_contact",
    apprentices_wanted: cursus ? 1 : null,
    apprentice_track_1: cursus,
    notes: note,
  };
  let created = await db.from("cfa_companies").insert(full).select("id").single();
  if (created.error && /column|schema cache/i.test(created.error.message)) {
    created = await db.from("cfa_companies").insert({
      company_name: row.company_name,
      siret: row.siret,
      company_address: full.company_address,
      status: "to_contact",
      apprentices_wanted: cursus ? 1 : null,
      apprentice_track_1: cursus,
      notes: note,
    }).select("id").single();
  }
  if (created.error || !created.data) return { ok: false as const, error: created.error?.message ?? "Création impossible" };
  await db.from("cfa_bd_leads").update({ status: "accepted", company_id: created.data.id }).eq("id", leadId);
  await logCompanyEvent(db, {
    companyId: created.data.id,
    actorId,
    action: "business_dev",
    activityType: "note",
    body: note,
    newValue: row.siret,
  });
  return { ok: true as const, companyId: created.data.id, cursusLabel: cursus ? getCfaSpecializationLabel(cursus) : "" };
}
