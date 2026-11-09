import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { downloadFormationPdf } from "@/lib/formation-documents/storage";

type Ctx = { params: Promise<{ id: string }> };

/** Stream PDF archivé du coffre (tous kinds : devis, émargement, réponses évals…). */
export async function GET(_req: Request, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const { data: doc } = await service
    .from("formation_documents")
    .select("id, kind, title, file_url, storage_bucket, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

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
