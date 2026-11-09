import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAcceptanceSeal } from "@/lib/formation-documents/acceptance-seal";
import { stampAcceptanceOnPdf } from "@/lib/formation-documents/stamp-acceptance";
import {
  downloadFormationPdf,
  uploadFormationPdf,
} from "@/lib/formation-documents/storage";

type SignableDoc = {
  id: string;
  dossier_id: string;
  kind: string;
  status?: string | null;
  signed_at?: string | null;
  signer_name?: string | null;
  signer_role?: string | null;
  acceptance_method?: string | null;
  accept_otp_sent_to?: string | null;
  pdf_content_hash?: string | null;
  file_url?: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  meta?: Record<string, unknown> | null;
  contact_fallback?: string | null;
};

/**
 * Garantit un cachet « SIGNÉ » sur le PDF devis/convention.
 * - Si déjà tamponné (meta.acceptance_stamped_at) → buffer tel quel
 * - Sinon tamponne, ré-upload, marque le meta
 */
export async function ensureSignedPdfBuffer(
  service: SupabaseClient,
  doc: SignableDoc,
  sourceBuffer?: Buffer | null,
): Promise<Buffer | null> {
  const isSignable = doc.kind === "devis" || doc.kind === "convention";
  const isSigned = doc.status === "signed" || Boolean(doc.signed_at);
  if (!isSignable || !isSigned) {
    return sourceBuffer ?? (await loadBuffer(service, doc));
  }

  const already =
    doc.meta &&
    typeof doc.meta === "object" &&
    Boolean((doc.meta as { acceptance_stamped_at?: unknown }).acceptance_stamped_at) &&
    Boolean((doc.meta as { acceptance_tracking_id?: unknown }).acceptance_tracking_id);

  let buffer = sourceBuffer ?? (await loadBuffer(service, doc));
  if (!buffer?.length) return null;
  if (already) return buffer;

  const signerName = String(doc.signer_name || doc.contact_fallback || "Client");
  const signedAt = String(doc.signed_at || new Date().toISOString());
  const prevMeta = doc.meta && typeof doc.meta === "object" ? doc.meta : {};
  const seal = resolveAcceptanceSeal(prevMeta, {
    documentId: String(doc.id),
    dossierId: String(doc.dossier_id),
    kind: String(doc.kind),
    signedAt,
    signerName,
    pdfContentHash: doc.pdf_content_hash ? String(doc.pdf_content_hash) : null,
  });

  try {
    buffer = await stampAcceptanceOnPdf(buffer, {
      documentLabel: doc.kind === "devis" ? "Devis" : "Convention",
      signerName,
      signerRole: doc.signer_role ? String(doc.signer_role) : null,
      signedAt,
      method: doc.acceptance_method ? String(doc.acceptance_method) : "email_otp",
      emailedTo: doc.accept_otp_sent_to ? String(doc.accept_otp_sent_to) : null,
      trackingId: seal.trackingId,
      sealShort: seal.sealShort,
    });
  } catch (err) {
    console.warn(
      "[ensure-signed-pdf] stamp:",
      err instanceof Error ? err.message : err,
    );
    return buffer;
  }

  const uploaded = await uploadFormationPdf(service, {
    dossierId: String(doc.dossier_id),
    kind: String(doc.kind),
    buffer,
  });

  const nextMeta = {
    ...prevMeta,
    acceptance_stamped_at: new Date().toISOString(),
    acceptance_tracking_id: seal.trackingId,
    acceptance_seal_short: seal.sealShort,
    acceptance_seal_hash: seal.sealHash,
  };

  const patch: Record<string, unknown> = {
    meta: nextMeta,
    file_url: uploaded?.fileUrl ?? doc.file_url ?? null,
    updated_at: new Date().toISOString(),
  };
  if (uploaded) {
    patch.storage_bucket = uploaded.bucket;
    patch.storage_path = uploaded.path;
  }

  let { error } = await service
    .from("formation_documents")
    .update(patch)
    .eq("id", doc.id);
  if (error && /storage_(bucket|path)|meta/i.test(error.message)) {
    delete patch.storage_bucket;
    delete patch.storage_path;
    if (/meta/i.test(error.message)) delete patch.meta;
    ({ error } = await service
      .from("formation_documents")
      .update(patch)
      .eq("id", doc.id));
  }
  if (error) {
    console.warn("[ensure-signed-pdf] persist:", error.message);
  }

  return buffer;
}

async function loadBuffer(
  service: SupabaseClient,
  doc: SignableDoc,
): Promise<Buffer | null> {
  let buffer = await downloadFormationPdf(service, {
    bucket: doc.storage_bucket,
    path: doc.storage_path,
    fileUrl: doc.file_url,
  });
  if (!buffer && doc.file_url && /^https?:\/\//i.test(String(doc.file_url))) {
    try {
      const res = await fetch(String(doc.file_url));
      if (res.ok) buffer = Buffer.from(await res.arrayBuffer());
    } catch {
      /* ignore */
    }
  }
  return buffer;
}
