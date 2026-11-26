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

/** Axes Qualiopi 23–25 — titres alignés sur le référentiel. */
export const VEILLE_AXES = [
  {
    theme: "reglementaire" as const,
    indicatorId: 23,
    title: "Veille légale et réglementaire",
    shortTitle: "Légale & réglementaire",
    description: "Formation professionnelle, Qualiopi, financement, obligations OF.",
  },
  {
    theme: "metier" as const,
    indicatorId: 24,
    title: "Veille compétences et métiers",
    shortTitle: "Compétences & métiers",
    description: "Évolutions des compétences, emplois et besoins entreprises.",
  },
  {
    theme: "pedagogie" as const,
    indicatorId: 25,
    title: "Veille innovations pédagogiques",
    shortTitle: "Innovations pédagogiques",
    description: "Méthodes, outils et technologies pour la formation d’adultes.",
  },
] as const;

export type VeilleAxis = (typeof VEILLE_AXES)[number];

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
  /**
   * Synthèse détaillée de l’article / information lue
   * (contexte, faits, impact OF / Byound, enjeux).
   */
  summary: string;
  /**
   * Proposition d’action pour Byound (quoi en faire concrètement :
   * mettre à jour une procédure, surligner pour preuve Qualiopi, former, ignorer…).
   */
  recommendedAction?: string | null;
  url?: string | null;
  theme?: VeilleTheme | null;
  rag?: VeilleRag | null;
  sourceLabel?: string | null;
  isPriority?: boolean;
};

/** Marqueur stocké dans highlight.note pour le plan d’action généré. */
export const VEILLE_ACTION_PLAN_MARKER = "## Plan d'action Byound";

export type VeillePlanDraftItem = {
  id: string;
  title: string;
  owner_name?: string | null;
  due_at?: string | null;
  selected?: boolean;
};

export type VeillePlanDraft = {
  version: 1;
  summary?: string;
  items: VeillePlanDraftItem[];
};

export function splitVeilleHighlightNote(note: string | null | undefined): {
  preface: string;
  actionPlan: string | null;
  planDraft: VeillePlanDraft | null;
} {
  const raw = String(note ?? "").trim();
  if (!raw) return { preface: "", actionPlan: null, planDraft: null };
  const idx = raw.indexOf(VEILLE_ACTION_PLAN_MARKER);
  if (idx < 0) return { preface: raw, actionPlan: null, planDraft: null };
  const body = raw.slice(idx + VEILLE_ACTION_PLAN_MARKER.length).trim();
  const planDraft = parseVeillePlanDraft(body);
  return {
    preface: raw.slice(0, idx).trim(),
    actionPlan: body || null,
    planDraft,
  };
}

export function parseVeillePlanDraft(raw: string | null | undefined): VeillePlanDraft | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as VeillePlanDraft;
      if (parsed?.version === 1 && Array.isArray(parsed.items)) {
        return {
          version: 1,
          summary: parsed.summary ? String(parsed.summary) : undefined,
          items: parsed.items
            .map((item, index) => ({
              id: String(item.id || `a${index + 1}`),
              title: String(item.title ?? "").trim(),
              owner_name: item.owner_name ? String(item.owner_name) : null,
              due_at: item.due_at ? String(item.due_at).slice(0, 10) : null,
              selected: item.selected !== false,
            }))
            .filter((item) => item.title),
        };
      }
    }
  } catch {
    // fallback below
  }
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^[\s\-•*\d.)]+/, "").trim())
    .filter((line) => line.length >= 8);
  if (!lines.length) return null;
  return {
    version: 1,
    items: lines.slice(0, 12).map((title, index) => ({
      id: `a${index + 1}`,
      title,
      owner_name: null,
      due_at: null,
      selected: true,
    })),
  };
}

export function mergeVeilleHighlightNote(
  preface: string,
  actionPlan: string | VeillePlanDraft | null | undefined,
): string {
  const head = preface.trim();
  let plan = "";
  if (actionPlan && typeof actionPlan === "object") {
    plan = JSON.stringify(actionPlan, null, 2);
  } else {
    plan = String(actionPlan ?? "").trim();
  }
  if (!plan) return head;
  const block = `${VEILLE_ACTION_PLAN_MARKER}\n${plan}`;
  return head ? `${head}\n\n${block}` : block;
}

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
