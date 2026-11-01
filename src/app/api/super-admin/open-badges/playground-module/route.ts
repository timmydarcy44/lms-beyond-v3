import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { moduleVersionFromZip } from "@/lib/openbadges/playground-zip";

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Déposez un fichier ZIP." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Le module dépasse 20 Mo." }, { status: 400 });
  const previous = Number(form?.get("version") ?? 0);
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const moduleFile = moduleVersionFromZip(bytes, file.name, Number.isFinite(previous) ? previous : 0);
    return NextResponse.json({ module: moduleFile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import impossible";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
