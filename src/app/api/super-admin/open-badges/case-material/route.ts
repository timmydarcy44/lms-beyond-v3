import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const BUCKETS = ["Public", "public"] as const;
const ALLOWED = new Set([
  "application/pdf",
  "application/zip",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Ajoutez un fichier." }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Le fichier dépasse 15 Mo." }, { status: 400 });
  }
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Format accepté : PDF, ZIP, document, image ou texte." }, { status: 400 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Stockage indisponible" }, { status: 503 });
  const safe = file.name.replace(/[^\w.\-]+/g, "-").slice(0, 80) || "piece";
  const path = `open-badges/cases/${crypto.randomUUID()}-${safe}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let last = "Aucun espace de stockage disponible.";
  for (const bucket of BUCKETS) {
    const { error } = await db.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (!error) {
      const { data } = db.storage.from(bucket).getPublicUrl(path);
      return NextResponse.json({
        url: data.publicUrl,
        name: file.name,
        kind: file.type === "application/pdf" ? "pdf" : "file",
      });
    }
    last = error.message;
    if (!/bucket not found|not found/i.test(error.message)) break;
  }
  return NextResponse.json({ error: last }, { status: 502 });
}
