import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isLot4Kind } from "@/lib/formation-documents/constants";
import { loadDossierDocContext } from "@/lib/formation-documents/context";
import { buildFormationDocumentPdf } from "@/lib/formation-documents/pdf";
import { generateFormationDocuments } from "@/lib/formation-documents/generate";
import { resolveFormationPdfBuffer } from "@/lib/formation-documents/vault";

type Ctx = { params: Promise<{ id: string; kind: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id, kind } = await ctx.params;
  if (!isLot4Kind(kind)) {
    return NextResponse.json({ error: "Type non supporté" }, { status: 400 });
  }

  const persist = req.nextUrl.searchParams.get("persist") === "1";
  if (persist) {
    await generateFormationDocuments(service, { dossierId: id, kinds: [kind] });
  }

  const docCtx = await loadDossierDocContext(service, id);
  if (!docCtx) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const { buffer } = await resolveFormationPdfBuffer(service, {
    kind,
    buildFallback: () => buildFormationDocumentPdf({ ctx: docCtx, kind }),
  });
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${kind}-${id.slice(0, 8)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
