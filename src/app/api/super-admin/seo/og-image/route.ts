import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const querySchema = z.object({
  path: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  const parsed = querySchema.safeParse({ path: String(form.get("path") ?? "") });
  if (!parsed.success || !parsed.data.path.startsWith("/")) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image requise (1200 × 630)" }, { status: 400 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safePath = parsed.data.path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
  const filePath = `seo/og/${safePath}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  for (const bucket of ["public", "Public"] as const) {
    const uploaded = await db.storage.from(bucket).upload(filePath, buffer, { contentType: file.type, upsert: true });
    if (!uploaded.error) {
      const { data } = db.storage.from(bucket).getPublicUrl(filePath);
      return NextResponse.json({ ok: true, url: data.publicUrl });
    }
  }
  return NextResponse.json({ error: "Téléversement impossible. Vérifiez le bucket public." }, { status: 500 });
}
