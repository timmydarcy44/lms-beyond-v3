/** Une seule veille fusionnée (réglementaire + métier + pédagogie). */
export const VEILLE_KIND = "globale" as const;
export type VeilleKind = typeof VEILLE_KIND | "legale" | "metier" | "pedagogie";

export const VEILLE_KIND_LABEL = "Veille formation continue";

export type VeilleTheme = "reglementaire" | "metier" | "pedagogie" | "transversal";
export type VeilleRag = "rag1" | "rag2";

export const VEILLE_THEME_LABELS: Record<VeilleTheme, string> = {
  reglementaire: "Réglementaire",
  metier: "Métier",
  pedagogie: "Pédagogie",
  transversal: "Transversal",
};

/** RAG 2 — recherche web formation continue (pas une liste de sites). */
export const VEILLE_WEB_QUERIES = [
  "actualité formation professionnelle continue France",
  "Qualiopi actualité organisme de formation",
  "réforme financement formation continue CPF OPCO",
  "innovation pédagogique formation adultes compétences",
  "compétences métiers formation continue entreprises",
] as const;

export type VeilleDigestItem = {
  id: string;
  title: string;
  summary: string;
  url?: string | null;
  theme?: VeilleTheme | null;
  rag?: VeilleRag | null;
  sourceLabel?: string | null;
  isPriority?: boolean;
};

export type VeilleSource = {
  id: string;
  kind: VeilleKind;
  url: string;
  title: string | null;
  is_priority: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VeilleDigest = {
  id: string;
  week_start: string;
  kind: VeilleKind;
  title: string;
  summary: string;
  items: VeilleDigestItem[];
  sources_used: Array<{ url?: string; title?: string; priority?: boolean; rag?: VeilleRag }>;
  email_sent_at: string | null;
  created_at: string;
};

export type VeilleHighlightStatus = "saved" | "in_progress" | "done";

export type VeilleHighlight = {
  id: string;
  kind: VeilleKind;
  digest_id: string | null;
  title: string;
  excerpt: string;
  note: string | null;
  url: string | null;
  theme?: VeilleTheme | null;
  status: VeilleHighlightStatus;
  created_at: string;
  updated_at: string;
};

export function isVeilleKind(value: string): value is VeilleKind {
  return value === VEILLE_KIND || value === "legale" || value === "metier" || value === "pedagogie";
}

/** Lundi de la semaine (UTC date) pour regrouper les digests. */
export function weekStartMonday(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProto);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function parseVeilleTheme(value: unknown): VeilleTheme | null {
  if (value === "reglementaire" || value === "metier" || value === "pedagogie" || value === "transversal") {
    return value;
  }
  return null;
}

export function parseVeilleRag(value: unknown): VeilleRag | null {
  if (value === "rag1" || value === "rag2") return value;
  return null;
}
