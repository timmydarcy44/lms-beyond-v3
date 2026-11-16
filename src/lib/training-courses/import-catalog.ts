/**
 * Import catalogue formations (JSON Claude / Excel) → rows training_courses.
 * Upsert par slug. Ne touche pas cover_url si absente / null.
 */

import * as XLSX from "xlsx";
import {
  QUALIOPI_PEDAGOGICAL_MODALITIES,
  QUALIOPI_RECOGNITION_TYPES,
} from "@/lib/training-courses/qualiopi-fiche";

const RECOGNITION = new Set(QUALIOPI_RECOGNITION_TYPES.map((t) => t.id));
const MODALITIES = new Set(QUALIOPI_PEDAGOGICAL_MODALITIES.map((t) => t.id));

export type CatalogImportRow = Record<string, unknown>;

export type CatalogImportResult = {
  upserted: number;
  created: number;
  updated: number;
  errors: Array<{ index: number; slug?: string; title?: string; error: string }>;
  slugs: string[];
};

function asString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function asBool(v: unknown, fallback = true): boolean {
  if (typeof v === "boolean") return v;
  if (v == null || v === "") return fallback;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "oui", "yes", "y"].includes(s)) return true;
  if (["0", "false", "non", "no", "n"].includes(s)) return false;
  return fallback;
}

function asNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function asStringArray(v: unknown): string[] | null {
  if (v == null || v === "") return null;
  if (Array.isArray(v)) {
    const arr = v.map((x) => String(x).trim()).filter(Boolean);
    return arr.length ? arr : null;
  }
  const s = String(v).trim();
  if (!s) return null;
  // JSON array string
  if (s.startsWith("[")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        const arr = parsed.map((x) => String(x).trim()).filter(Boolean);
        return arr.length ? arr : null;
      }
    } catch {
      /* fall through */
    }
  }
  // pipe / newline / bullet separators
  const arr = s
    .split(/\n|\||•|;/)
    .map((x) => x.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

function asJson<T>(v: unknown, fallback: T): T {
  if (v == null || v === "") return fallback;
  if (typeof v === "object") return v as T;
  try {
    return JSON.parse(String(v)) as T;
  } catch {
    return fallback;
  }
}

export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || `formation-${Date.now()}`
  );
}

/** Normalise 1 entrée Claude / Excel → payload upsert. */
export function normalizeCatalogImportItem(
  raw: CatalogImportRow,
  index: number,
): { ok: true; row: Record<string, unknown> } | { ok: false; error: string } {
  const title = asString(raw.title ?? raw.titre);
  if (!title) return { ok: false, error: `Ligne ${index + 1} : titre manquant` };

  const slug = asString(raw.slug) || slugifyTitle(title);
  const recognition = asString(raw.recognition_type);
  if (recognition && !RECOGNITION.has(recognition as never)) {
    return {
      ok: false,
      error: `Ligne ${index + 1} (${slug}) : recognition_type invalide (${recognition})`,
    };
  }
  const modality = asString(raw.pedagogical_modality);
  if (modality && !MODALITIES.has(modality as never)) {
    return {
      ok: false,
      error: `Ligne ${index + 1} (${slug}) : pedagogical_modality invalide (${modality})`,
    };
  }

  const objectives = asStringArray(raw.objectives);
  const priceOnQuote = asBool(raw.price_on_quote, false);
  const inter = asNumber(raw.inter_price ?? raw.prix_inter_eur);
  const intra = asNumber(raw.intra_price ?? raw.prix_intra_eur);

  const row: Record<string, unknown> = {
    slug,
    title,
    short_description: asString(raw.short_description ?? raw.description_courte),
    long_description: asString(raw.long_description ?? raw.description_longue),
    domain: asString(raw.domain ?? raw.domaine),
    duration: asString(raw.duration ?? raw.duree),
    level: asString(raw.level ?? raw.niveau),
    formats: asStringArray(raw.formats),
    objectives,
    skills: asStringArray(raw.skills ?? raw.competences),
    program: asJson(raw.program, null),
    program_structure: asJson(raw.program_structure, []),
    prerequisites: asString(raw.prerequisites ?? raw.prerequis),
    audience: asStringArray(raw.audience ?? raw.public),
    why_choose: asStringArray(raw.why_choose ?? raw.pourquoi_choisir),
    benefits: asStringArray(raw.benefits ?? raw.benefices),
    case_studies: asStringArray(raw.case_studies ?? raw.cas_pratiques),
    deliverables: asStringArray(raw.deliverables ?? raw.livrables),
    methodology: asStringArray(raw.methodology ?? raw.methodologie),
    faq: asJson(raw.faq, null),
    meta_description: asString(raw.meta_description),
    seo_tags: asStringArray(raw.seo_tags),
    recognition_type: recognition,
    recognition_detail: asString(raw.recognition_detail),
    pedagogical_modality: modality,
    pedagogical_modality_detail: asString(raw.pedagogical_modality_detail),
    financing_modalities: asString(raw.financing_modalities),
    price_on_quote: priceOnQuote || (inter == null && intra == null),
    inter_price: inter,
    intra_price: intra,
    max_intra_participants: asNumber(raw.max_intra_participants) ?? 12,
    badge_name: asString(raw.badge_name ?? raw.badge),
    badge_class_id: asString(raw.badge_class_id),
    results_method_override: asString(raw.results_method_override),
    is_active: asBool(raw.is_active ?? raw.actif, true),
    page_blocks: asJson(raw.page_blocks, null),
    sessions: asJson(raw.sessions, []),
    instructors: asJson(raw.instructors, []),
    updated_at: new Date().toISOString(),
  };

  // Ne pas écraser une cover existante avec null si absente du fichier
  if ("cover_url" in raw && raw.cover_url != null && String(raw.cover_url).trim()) {
    row.cover_url = asString(raw.cover_url);
  }
  if ("illustrations" in raw) {
    row.illustrations = asStringArray(raw.illustrations) ?? [];
  }

  return { ok: true, row };
}

/** Parse body JSON : array | { courses: [] } | single object. */
export function parseCatalogImportJson(raw: unknown): CatalogImportRow[] {
  if (Array.isArray(raw)) return raw as CatalogImportRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.courses)) return obj.courses as CatalogImportRow[];
    if (obj.title || obj.titre || obj.slug) return [obj as CatalogImportRow];
  }
  throw new Error("JSON invalide : attendu un tableau, { courses: [...] }, ou un objet formation");
}

/** Parse Excel buffer — onglet Catalogue ou 1re feuille. */
export function parseCatalogImportExcel(buffer: ArrayBuffer | Buffer): CatalogImportRow[] {
  const book = XLSX.read(buffer, { type: "buffer" });
  const sheetName =
    book.SheetNames.find((n) => /catalogue|formations|courses/i.test(n)) ?? book.SheetNames[0];
  if (!sheetName) throw new Error("Fichier Excel vide");
  const sheet = book.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!rows.length) throw new Error(`Onglet « ${sheetName} » vide`);
  return rows.map((r) => {
    const out: CatalogImportRow = { ...r };
    // Normalise headers FR export → champs API
    if (r.titre && !r.title) out.title = r.titre;
    if (r.domaine && !r.domain) out.domain = r.domaine;
    if (r.duree && !r.duration) out.duration = r.duree;
    if (r.niveau && !r.level) out.level = r.niveau;
    if (r.description_courte && !r.short_description) out.short_description = r.description_courte;
    if (r.description_longue && !r.long_description) out.long_description = r.description_longue;
    if (r.objectifs && !r.objectives) out.objectives = r.objectifs;
    if (r.competences && !r.skills) out.skills = r.competences;
    if (r.public && !r.audience) out.audience = r.public;
    if (r.prerequis && !r.prerequisites) out.prerequisites = r.prerequis;
    if (r.prix_inter_eur != null && r.inter_price == null) out.inter_price = r.prix_inter_eur;
    if (r.prix_intra_eur != null && r.intra_price == null) out.intra_price = r.prix_intra_eur;
    if (r.actif != null && r.is_active == null) out.is_active = r.actif;
    return out;
  });
}
