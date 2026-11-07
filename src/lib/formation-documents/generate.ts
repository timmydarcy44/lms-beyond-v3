import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CONVENTION_PACK_KINDS,
  DOC_TITLES,
  isLot4Kind,
  type Lot4DocumentKind,
} from "@/lib/formation-documents/constants";
import { loadDossierDocContext } from "@/lib/formation-documents/context";
import { buildFormationDocumentPdf } from "@/lib/formation-documents/pdf";
import {
  isPublicStorageUrl,
  newDocToken,
  uploadFormationPdf,
} from "@/lib/formation-documents/storage";
import { resolveFormationPdfBuffer } from "@/lib/formation-documents/vault";

export type GenerateResult = {
  kind: string;
  document_id: string;
  file_url: string | null;
  access_token: string;
};

async function ensureDocRow(
  service: SupabaseClient,
  dossierId: string,
  kind: Lot4DocumentKind,
  title: string,
) {
  const { data: existing } = await service
    .from("formation_documents")
    .select("*")
    .eq("dossier_id", dossierId)
    .eq("kind", kind)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await service
    .from("formation_documents")
    .insert({
      dossier_id: dossierId,
      kind,
      title,
      status: "to_generate",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message || `Création doc ${kind} impossible`);
  return data;
}

export async function generateFormationDocuments(
  service: SupabaseClient,
  params: {
    dossierId: string;
    kinds?: string[];
    participantName?: string | null;
    attendedHalfDays?: number | null;
    plannedHalfDays?: number | null;
    actorUserId?: string | null;
  },
): Promise<{ results: GenerateResult[]; error?: string }> {
  const ctx = await loadDossierDocContext(service, params.dossierId);
  if (!ctx) return { results: [], error: "Dossier introuvable" };

  let kinds = (
    params.kinds?.length
      ? params.kinds
      : ["devis", "convention", "cgv", "reglement", "programme", "convocation", "livret"]
  ).filter(isLot4Kind);

  if (kinds.includes("convention")) {
    for (const k of CONVENTION_PACK_KINDS) {
      if (!kinds.includes(k)) kinds.push(k);
    }
  }

  const results: GenerateResult[] = [];

  for (const kind of kinds) {
    const row = await ensureDocRow(service, params.dossierId, kind, DOC_TITLES[kind]);
    // Coffre Qualiopi pour convention / règlement / livret ; CGV reste générée (absente du coffre)
    const { buffer } = await resolveFormationPdfBuffer(service, {
      kind,
      ctx,
      buildFallback: () =>
        buildFormationDocumentPdf({
          ctx,
          kind,
          participantName:
            kind === "convocation" || kind === "certificat" || kind === "attestation"
              ? params.participantName
              : null,
          attendedHalfDays: params.attendedHalfDays,
          plannedHalfDays: params.plannedHalfDays,
        }),
    });
    const uploaded = await uploadFormationPdf(service, {
      dossierId: params.dossierId,
      kind,
      buffer,
    });

    const accessToken = row.access_token || newDocToken();
    const acceptToken =
      kind === "devis" || kind === "convention"
        ? row.accept_token || newDocToken()
        : row.accept_token;

    const patch: Record<string, unknown> = {
      // Réf privée (private://…) ou null — jamais d'URL publique
      file_url: uploaded?.fileUrl ?? (isPublicStorageUrl(row.file_url) ? null : row.file_url),
      access_token: accessToken,
      accept_token: acceptToken ?? null,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: row.status === "to_generate" ? "to_generate" : row.status,
    };
    if (uploaded) {
      patch.storage_bucket = uploaded.bucket;
      patch.storage_path = uploaded.path;
    }

    let { data: updated, error } = await service
      .from("formation_documents")
      .update(patch)
      .eq("id", row.id)
      .select("id, file_url, access_token")
      .single();

    // Colonnes storage_* absentes tant que la migration n'est pas appliquée
    if (error && /storage_(bucket|path)/i.test(error.message)) {
      delete patch.storage_bucket;
      delete patch.storage_path;
      ({ data: updated, error } = await service
        .from("formation_documents")
        .update(patch)
        .eq("id", row.id)
        .select("id, file_url, access_token")
        .single());
    }

    if (error || !updated) {
      return { results, error: error?.message || `Échec génération ${kind}` };
    }

    results.push({
      kind,
      document_id: String(updated.id),
      file_url: updated.file_url ? String(updated.file_url) : null,
      access_token: String(updated.access_token),
    });
  }

  await service.from("formation_events").insert({
    dossier_id: params.dossierId,
    event_type: "documents_generated",
    actor_user_id: params.actorUserId ?? null,
    payload: { kinds: results.map((r) => r.kind) },
  });

  return { results };
}
