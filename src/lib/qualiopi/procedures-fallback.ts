/**
 * Repli tant que la migration procédures v2 n’est pas appliquée :
 * synthétise la forme API depuis crm_qualiopi_process_docs.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PROCEDURE_SECTION_KEYS,
  type ProcedureSectionKey,
} from "@/lib/qualiopi/procedure-sections";

const SEED_META: Record<
  string,
  { title: string; indicators: number[]; legal: boolean; slug: string }
> = {
  formateurs: {
    slug: "formateurs",
    title: "Plan de développement des compétences des formateurs",
    indicators: [21, 22],
    legal: false,
  },
  handicap: {
    slug: "handicap",
    title: "Accueil des personnes en situation de handicap",
    indicators: [26],
    legal: false,
  },
  moyens: {
    slug: "moyens",
    title: "Moyens matériels et locaux",
    indicators: [17],
    legal: false,
  },
  paq: {
    slug: "paq",
    title: "Comité qualité et plan d’amélioration",
    indicators: [32],
    legal: false,
  },
  reclamations: {
    slug: "reclamations",
    title: "Traitement des réclamations",
    indicators: [31],
    legal: false,
  },
  signalements: {
    slug: "signalements",
    title: "Signalements (violences, harcèlement, discriminations)",
    indicators: [12],
    legal: true,
  },
};

function splitBodyToSections(body: string): Record<ProcedureSectionKey, string> {
  const out = Object.fromEntries(PROCEDURE_SECTION_KEYS.map((k) => [k, ""])) as Record<
    ProcedureSectionKey,
    string
  >;
  const text = String(body ?? "").trim();
  if (!text) return out;

  const chunks = text.split(/^##\s+/m).filter(Boolean);
  // First chunk may be H1 title
  const parts: Array<{ title: string; body: string }> = [];
  for (const chunk of chunks) {
    const nl = chunk.indexOf("\n");
    if (nl < 0) {
      parts.push({ title: chunk.trim(), body: "" });
    } else {
      parts.push({ title: chunk.slice(0, nl).trim(), body: chunk.slice(nl + 1).trim() });
    }
  }

  // Drop leading H1-only part without ##
  const hasLeadingTitle = !text.startsWith("##") && parts.length;
  if (hasLeadingTitle && !/^#{1,2}\s/m.test(parts[0]?.title ?? "")) {
    // first part is from "# Title\n\n..." without ##
    const first = text.replace(/^#\s+[^\n]+\n*/, "").trim();
    return splitBodyToSections("## Deroulement\n" + first);
  }

  const deroulementBits: string[] = [];
  for (const p of parts) {
    const t = p.title.toLowerCase();
    if (t === "objet") out.objet = p.body;
    else if (/destinataire|périmètre|perimetre|champ/.test(t)) out.champ_application = p.body;
    else if (/référent|referent|responsabilité|responsabilite/.test(t)) out.responsabilites = p.body;
    else if (/suivi|preuve|conservation/.test(t)) out.suivi_preuves = p.body;
    else if (/diagnostic|action|déroulement|deroulement|canal|délai|delai|étape|etape|fréquence|frequence|entrée|entree|sortie|modalit|partenariat|plateforme|présentiel|presentiel/.test(t)) {
      deroulementBits.push(`## ${p.title}\n${p.body}`);
    } else {
      deroulementBits.push(`## ${p.title}\n${p.body}\n\n> Note migration : section hors titres standard.`);
    }
  }
  if (deroulementBits.length) {
    out.deroulement = [out.deroulement, ...deroulementBits].filter(Boolean).join("\n\n");
  }
  if (!out.objet && !out.deroulement && text) {
    out.deroulement = text + "\n\n> Note migration : contenu non structuré.";
  }
  return out;
}

export async function listProceduresFallback(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("crm_qualiopi_process_docs")
    .select("*")
    .order("kind");
  if (error) throw new Error(error.message);

  return (data ?? []).map((doc) => {
    const meta = SEED_META[doc.kind] ?? {
      slug: doc.kind,
      title: doc.title,
      indicators: [],
      legal: false,
    };
    const sectionsMap = splitBodyToSections(doc.body ?? "");
    const sections = PROCEDURE_SECTION_KEYS.map((key, i) => ({
      id: `legacy-${doc.kind}-${key}`,
      procedure_id: doc.id,
      key,
      position: i + 1,
      content: sectionsMap[key],
      updated_at: doc.updated_at,
    }));
    return {
      id: doc.id,
      slug: meta.slug,
      legacy_kind: doc.kind,
      title: meta.title || doc.title,
      status: "draft" as const,
      current_version: "0.1",
      indicators: meta.indicators,
      legal_obligation: meta.legal,
      owner_name: "Jessica Contentin",
      validated_by_name: null,
      validated_at: null,
      effective_date: null,
      next_review_at: null,
      audiences: [] as string[],
      updated_at: doc.updated_at,
      sections,
      migration_required: true,
    };
  });
}

export async function saveSectionFallback(
  supabase: SupabaseClient,
  procedureId: string,
  key: ProcedureSectionKey,
  content: string,
) {
  const { data: doc, error } = await supabase
    .from("crm_qualiopi_process_docs")
    .select("*")
    .eq("id", procedureId)
    .maybeSingle();
  if (error || !doc) throw new Error(error?.message || "Document introuvable");

  const map = splitBodyToSections(doc.body ?? "");
  map[key] = content;
  const rebuilt = PROCEDURE_SECTION_KEYS.map((k, i) => {
    const body = map[k]?.trim();
    if (!body) return "";
    const labels: Record<string, string> = {
      objet: "Objet",
      champ_application: "Champ d’application",
      responsabilites: "Responsabilités",
      deroulement: "Déroulement",
      suivi_preuves: "Suivi et preuves",
      indicateurs_suivi: "Indicateurs de suivi",
      revision: "Révision",
    };
    return `## ${labels[k] ?? k}\n${body}`;
  })
    .filter(Boolean)
    .join("\n\n");

  const { data, error: upErr } = await supabase
    .from("crm_qualiopi_process_docs")
    .update({ body: rebuilt, status: "draft", updated_at: new Date().toISOString() })
    .eq("id", procedureId)
    .select("*")
    .single();
  if (upErr) throw new Error(upErr.message);
  return data;
}
