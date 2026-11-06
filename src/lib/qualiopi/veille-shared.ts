export const VEILLE_KINDS = ["legale", "metier", "pedagogie"] as const;
export type VeilleKind = (typeof VEILLE_KINDS)[number];

export const VEILLE_KIND_LABELS: Record<VeilleKind, string> = {
  legale: "Veille légale",
  metier: "Veille métier",
  pedagogie: "Veille pédagogie",
};

export const VEILLE_KIND_HINTS: Record<VeilleKind, string> = {
  legale:
    "Code du travail, Qualiopi, financement de la formation, obligations des organismes.",
  metier:
    "Compétences, métiers, emplois, formations et besoins des entreprises dans vos domaines.",
  pedagogie:
    "Innovations pédagogiques, outils numériques, IA appliquée à la formation.",
};

export const VEILLE_DEFAULT_QUERIES: Record<VeilleKind, string[]> = {
  legale: [
    "Qualiopi référentiel national qualité formation professionnelle",
    "réforme formation professionnelle France actualité",
    "Code du travail organisme de formation obligations",
  ],
  metier: [
    "compétences métiers formation continue France",
    "intelligence artificielle compétences commerciales formation",
    "besoins formation entreprises automatisation",
  ],
  pedagogie: [
    "innovation pédagogique formation professionnelle numérique",
    "IA générative pédagogie formation adultes",
    "apprentissage asynchrone e-learning bonnes pratiques",
  ],
};

export type VeilleDigestItem = {
  id: string;
  title: string;
  summary: string;
  url?: string | null;
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
  sources_used: Array<{ url?: string; title?: string; priority?: boolean }>;
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
  status: VeilleHighlightStatus;
  created_at: string;
  updated_at: string;
};

export function isVeilleKind(value: string): value is VeilleKind {
  return (VEILLE_KINDS as readonly string[]).includes(value);
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
