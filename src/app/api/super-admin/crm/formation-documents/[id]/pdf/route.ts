import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { ensureSignedPdfBuffer } from "@/lib/formation-documents/ensure-signed-pdf";
import { downloadFormationPdf } from "@/lib/formation-documents/storage";

type Ctx = { params: Promise<{ id: string }> };

const SELECT_FULL =
  "id, dossier_id, kind, title, status, signed_at, signer_name, signer_role, acceptance_method, accept_otp_sent_to, pdf_content_hash, file_url, storage_bucket, storage_path, meta";
const SELECT_COMPAT =
  "id, dossier_id, kind, title, status, signed_at, signer_name, signer_role, acceptance_method, accept_otp_sent_to, pdf_content_hash, file_url, meta";

/** Stream PDF archivé du coffre (tous kinds : devis, émargement, réponses évals…). */
export async function GET(_req: Request, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  let { data: doc, error } = await service
    .from("formation_documents")
    .select(SELECT_FULL)
    .eq("id", id)
    .maybeSingle();
  if (error && /storage_(bucket|path)/i.test(error.message)) {
    ({ data: doc, error } = await service
      .from("formation_documents")
      .select(SELECT_COMPAT)
      .eq("id", id)
      .maybeSingle());
  }
  if (error || !doc) {
    return NextResponse.json(
      { error: error?.message || "Document introuvable" },
      { status: error ? 400 : 404 },
    );
  }

  let buffer =
    doc.kind === "devis" || doc.kind === "convention"
      ? await ensureSignedPdfBuffer(service, {
          id: String(doc.id),
          dossier_id: String(doc.dossier_id),
          kind: String(doc.kind),
          status: doc.status,
          signed_at: doc.signed_at,
          signer_name: doc.signer_name,
          signer_role: doc.signer_role,
          acceptance_method: doc.acceptance_method,
          accept_otp_sent_to: doc.accept_otp_sent_to,
          pdf_content_hash: doc.pdf_content_hash,
          file_url: doc.file_url,
          storage_bucket:
            "storage_bucket" in doc
              ? ((doc as { storage_bucket?: string | null }).storage_bucket ?? null)
              : null,
          storage_path:
            "storage_path" in doc
              ? ((doc as { storage_path?: string | null }).storage_path ?? null)
              : null,
          meta: (doc.meta as Record<string, unknown> | null) ?? null,
        })
      : await downloadFormationPdf(service, {
          bucket:
            "storage_bucket" in doc
              ? ((doc as { storage_bucket?: string | null }).storage_bucket ?? null)
              : null,
          path:
            "storage_path" in doc
              ? ((doc as { storage_path?: string | null }).storage_path ?? null)
              : null,
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
  if (!buffer?.length) {
    return NextResponse.json({ error: "Fichier PDF indisponible" }, { status: 404 });
  }

  const safeName = String(doc.title || doc.kind || "document")
    .replace(/[^\w\-àâäéèêëïîôùûüç\s]+/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName || doc.kind}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
