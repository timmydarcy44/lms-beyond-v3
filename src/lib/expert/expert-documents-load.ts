import type { SupabaseClient } from "@supabase/supabase-js";
import { parseExpertDocuments } from "@/lib/expert/admin-expert-types";
import { parseRegistrationMeta, type ExpertDocumentMeta } from "@/lib/expert/expert-registration-meta";
import type { ExpertDocumentItem } from "@/lib/expert/space-model";

function mapMetaDoc(doc: ExpertDocumentMeta): ExpertDocumentItem {
  const folder =
    doc.folder ??
    (doc.category === "cv"
      ? "cv"
      : doc.category === "certificates" || doc.category === "diplomas"
        ? "attestation"
        : doc.category === "admin"
          ? "contrat"
          : "autre");
  return {
    id: doc.id,
    name: doc.name,
    folder,
    status: doc.status ?? "deposited",
    uploadedAt: doc.uploaded_at,
    expiresAt: doc.expires_at ?? null,
    pages: doc.pages ?? null,
    url: doc.url,
  };
}

function mapTableRow(row: Record<string, unknown>): ExpertDocumentItem {
  const folderRaw = String(row.folder ?? "autre");
  const allowed = new Set(["contrat", "cv", "attestation", "facture", "modele", "autre"]);
  const folder = (allowed.has(folderRaw) ? folderRaw : "autre") as ExpertDocumentItem["folder"];
  return {
    id: String(row.id),
    name: String(row.name || "Document"),
    folder,
    status: (row.status as ExpertDocumentItem["status"]) || "deposited",
    uploadedAt: String(row.uploaded_at ?? row.created_at ?? new Date().toISOString()),
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    pages: typeof row.pages === "number" ? row.pages : null,
    url: String(row.url || ""),
  };
}

/** Fusion table expert_documents + references (meta + flat). */
export async function loadExpertDocumentsMerged(
  service: SupabaseClient,
  expertId: string,
  references?: unknown,
): Promise<ExpertDocumentItem[]> {
  let refs = references;
  if (refs === undefined) {
    const { data } = await service.from("experts").select("references").eq("id", expertId).maybeSingle();
    refs = data?.references;
  }

  const meta = parseRegistrationMeta(refs);
  const fromMeta = (meta?.documents ?? []).map(mapMetaDoc);
  const fromFlat = parseExpertDocuments(refs).map((doc) => ({
    id: String(doc.id ?? crypto.randomUUID()),
    name: String(doc.label ?? doc.name ?? "Document"),
    folder: (String(doc.folder ?? "autre") as ExpertDocumentItem["folder"]) || "autre",
    status: "deposited" as const,
    uploadedAt: String(doc.uploaded_at ?? doc.at ?? new Date().toISOString()),
    expiresAt: null,
    pages: null,
    url: String(doc.url ?? ""),
  }));

  const { data: rows, error } = await service
    .from("expert_documents")
    .select("id, name, folder, status, url, uploaded_at, expires_at, pages")
    .eq("expert_id", expertId)
    .order("uploaded_at", { ascending: false });

  const fromTable = error ? [] : ((rows ?? []) as Array<Record<string, unknown>>).map(mapTableRow);

  const seen = new Set<string>();
  const out: ExpertDocumentItem[] = [];
  for (const doc of [...fromTable, ...fromMeta, ...fromFlat]) {
    const key = doc.id || doc.url || doc.name;
    if (!key || seen.has(key)) continue;
    if (!doc.url?.trim()) continue;
    seen.add(key);
    out.push(doc);
  }
  return out;
}

/** Entrées plates pour la fiche /super (parseExpertDocuments). */
export function toAdminDocumentEntries(docs: ExpertDocumentItem[]): Record<string, unknown>[] {
  return docs.map((doc) => ({
    _type: doc.folder === "cv" ? "edge_cv" : "edge_document",
    id: doc.id,
    label: doc.name,
    name: doc.name,
    url: doc.url,
    folder: doc.folder,
    uploaded_at: doc.uploadedAt,
    at: doc.uploadedAt,
  }));
}
