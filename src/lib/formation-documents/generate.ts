import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BYOUND_COMPANY } from "@/lib/company";
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
  let { data: existing, error: existingErr } = await service
    .from("formation_documents")
    .select("*")
    .eq("dossier_id", dossierId)
    .eq("kind", kind)
    .is("participant_id", null)
    .is("slot_id", null)
    .maybeSingle();
  if (existingErr && /participant_id|slot_id/i.test(existingErr.message)) {
    ({ data: existing } = await service
      .from("formation_documents")
      .select("*")
      .eq("dossier_id", dossierId)
      .eq("kind", kind)
      .maybeSingle());
  }
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

  const needsClientSiret = kinds.some((k) => k === "devis" || k === "convention");
  const clientSiret = String(ctx.organization.siret ?? "").replace(/\D/g, "");
  if (needsClientSiret && clientSiret.length !== 14) {
    return {
      results: [],
      error:
        "SIRET client manquant sur l'organisation — renseignez-le sur le compte client avant de générer le devis / la convention.",
    };
  }

  if (kinds.includes("convention")) {
    for (const k of CONVENTION_PACK_KINDS) {
      if (!kinds.includes(k)) kinds.push(k);
    }
  }

  const results: GenerateResult[] = [];

  for (const kind of kinds) {
    const row = await ensureDocRow(service, params.dossierId, kind, DOC_TITLES[kind]);
    // Coffre Qualiopi pour convention / règlement / livret ; CGV reste générée (absente du coffre)
    let { buffer } = await resolveFormationPdfBuffer(service, {
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

    const isSignedRow =
      (kind === "devis" || kind === "convention") &&
      (row.status === "signed" || Boolean(row.signed_at));

    let acceptanceSeal: {
      trackingId: string;
      sealShort: string;
      sealHash: string;
    } | null = null;

    // Cachet signature visible sur devis / convention déjà acceptés
    if (isSignedRow) {
      try {
        const { resolveAcceptanceSeal } = await import(
          "@/lib/formation-documents/acceptance-seal"
        );
        const { stampAcceptanceOnPdf } = await import(
          "@/lib/formation-documents/stamp-acceptance"
        );
        const signerName = String(
          row.signer_name || ctx.dossier.contact_name || "Client",
        );
        const signedAt = String(row.signed_at || new Date().toISOString());
        const prevMeta =
          row.meta && typeof row.meta === "object"
            ? (row.meta as Record<string, unknown>)
            : {};
        acceptanceSeal = resolveAcceptanceSeal(prevMeta, {
          documentId: String(row.id),
          dossierId: params.dossierId,
          kind,
          signedAt,
          signerName,
          pdfContentHash: row.pdf_content_hash
            ? String(row.pdf_content_hash)
            : null,
        });
        buffer = await stampAcceptanceOnPdf(buffer, {
          documentLabel: kind === "devis" ? "Devis" : "Convention",
          signerName,
          signerRole: row.signer_role ? String(row.signer_role) : null,
          signedAt,
          method: row.acceptance_method
            ? String(row.acceptance_method)
            : "email_otp",
          emailedTo: row.accept_otp_sent_to
            ? String(row.accept_otp_sent_to)
            : null,
          trackingId: acceptanceSeal.trackingId,
          sealShort: acceptanceSeal.sealShort,
        });
      } catch (err) {
        console.warn(
          "[generate] stamp acceptance:",
          err instanceof Error ? err.message : err,
        );
      }
    }

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

    const prevMeta =
      row.meta && typeof row.meta === "object"
        ? (row.meta as Record<string, unknown>)
        : {};
    const patch: Record<string, unknown> = {
      // Réf privée (private://…) ou null — jamais d'URL publique
      file_url: uploaded?.fileUrl ?? (isPublicStorageUrl(row.file_url) ? null : row.file_url),
      access_token: accessToken,
      accept_token: acceptToken ?? null,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: row.status === "to_generate" ? "to_generate" : row.status,
    };
    if (isSignedRow) {
      patch.meta = {
        ...prevMeta,
        acceptance_stamped_at: new Date().toISOString(),
        ...(acceptanceSeal
          ? {
              acceptance_tracking_id: acceptanceSeal.trackingId,
              acceptance_seal_short: acceptanceSeal.sealShort,
              acceptance_seal_hash: acceptanceSeal.sealHash,
            }
          : {}),
      };
    }
    if (uploaded) {
      patch.storage_bucket = uploaded.bucket;
      patch.storage_path = uploaded.path;
    }
    if (kind === "devis") {
      const quoteNumber =
        row.quote_number || `DEV-${params.dossierId.slice(0, 8).toUpperCase()}`;
      const validUntil =
        row.valid_until ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      patch.quote_number = quoteNumber;
      patch.valid_until = validUntil;
      patch.cgv_version = row.cgv_version || BYOUND_COMPANY.cgv_version;
      patch.pdf_content_hash = createHash("sha256").update(buffer).digest("hex");
    }

    let { data: updated, error } = await service
      .from("formation_documents")
      .update(patch)
      .eq("id", row.id)
      .select("id, file_url, access_token")
      .single();

    // Colonnes absentes tant que la migration n'est pas appliquée
    if (
      error &&
      /storage_(bucket|path)|quote_number|valid_until|pdf_content_hash|cgv_version|signer_|meta/i.test(
        error.message,
      )
    ) {
      delete patch.storage_bucket;
      delete patch.storage_path;
      delete patch.quote_number;
      delete patch.valid_until;
      delete patch.pdf_content_hash;
      delete patch.cgv_version;
      if (/meta/i.test(error.message)) delete patch.meta;
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
