import type { SupabaseClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import { newDocToken, uploadFormationPdf } from "@/lib/formation-documents/storage";

/** Archive une preuve de signature OTP à côté du devis/convention. */
export async function archiveSignatureProof(
  service: SupabaseClient,
  params: {
    dossierId: string;
    parentKind: "devis" | "convention";
    parentDocumentId: string;
    signerName: string;
    signerRole?: string | null;
    acceptanceMethod: string;
    signedAt: string;
    emailedTo?: string | null;
    acceptedIp?: string | null;
    acceptedUserAgent?: string | null;
    pdfContentHash?: string | null;
  },
): Promise<{ ok: true; documentId: string } | { ok: false; error: string }> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  let y = 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Preuve de signature electronique", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = [
    `Document : ${params.parentKind}`,
    `Signe le : ${new Date(params.signedAt).toLocaleString("fr-FR")}`,
    `Signataire : ${params.signerName}${params.signerRole ? ` (${params.signerRole})` : ""}`,
    `Methode : ${params.acceptanceMethod}`,
    params.emailedTo ? `Code envoye a : ${params.emailedTo}` : null,
    params.acceptedIp ? `IP : ${params.acceptedIp}` : null,
    params.pdfContentHash ? `Hash PDF : ${params.pdfContentHash}` : null,
    `Document source id : ${params.parentDocumentId}`,
  ].filter(Boolean) as string[];

  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, 174);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 6 + 2;
  }
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    "Preuve archivee pour le coffre Qualiopi (OTP e-mail Byound).",
    margin,
    y,
  );

  const buffer = Buffer.from(doc.output("arraybuffer"));
  // Kind distinct par parent pour respecter l’unicité dossier+kind (scope null)
  const kind = params.parentKind === "convention" ? "preuve_convention" : "preuve_devis";

  const uploaded = await uploadFormationPdf(service, {
    dossierId: params.dossierId,
    kind,
    buffer,
  });

  const title = `Preuve signature — ${params.parentKind}`;
  const meta = {
    parent_kind: params.parentKind,
    parent_document_id: params.parentDocumentId,
    signer_name: params.signerName,
    signer_role: params.signerRole ?? null,
    acceptance_method: params.acceptanceMethod,
    signed_at: params.signedAt,
    emailed_to: params.emailedTo ?? null,
    accepted_ip: params.acceptedIp ?? null,
    pdf_content_hash: params.pdfContentHash ?? null,
  };

  const { data: existing } = await service
    .from("formation_documents")
    .select("id")
    .eq("dossier_id", params.dossierId)
    .eq("kind", kind)
    .is("participant_id", null)
    .is("slot_id", null)
    .maybeSingle();

  const existingId = existing?.id ? String(existing.id) : null;

  const patch: Record<string, unknown> = {
    title,
    status: "signed",
    signed_at: params.signedAt,
    generated_at: params.signedAt,
    updated_at: new Date().toISOString(),
    meta,
    file_url: uploaded?.fileUrl ?? null,
  };
  if (uploaded) {
    patch.storage_bucket = uploaded.bucket;
    patch.storage_path = uploaded.path;
  }

  if (existingId) {
    const { error } = await service.from("formation_documents").update(patch).eq("id", existingId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, documentId: existingId };
  }

  const { data, error } = await service
    .from("formation_documents")
    .insert({
      dossier_id: params.dossierId,
      kind,
      title,
      access_token: newDocToken(),
      ...patch,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message || "Preuve non archivée" };
  return { ok: true, documentId: String(data.id) };
}
