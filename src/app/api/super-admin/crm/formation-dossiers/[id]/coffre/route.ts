import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  buildCoffreSnapshot,
  exportCoffreZip,
} from "@/lib/formation-documents/coffre";

type Ctx = { params: Promise<{ id: string }> };

/** Checklist coffre Qualiopi (JSON) ou export ZIP (?format=zip). */
export async function GET(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const format = new URL(req.url).searchParams.get("format");

  if (format === "zip") {
    const zip = await exportCoffreZip(service, id);
    if (!zip.ok) {
      return NextResponse.json({ error: zip.error }, { status: 400 });
    }
    return new NextResponse(new Uint8Array(zip.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zip.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const snap = await buildCoffreSnapshot(service, id);
  if (!snap) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  return NextResponse.json(snap);
}
