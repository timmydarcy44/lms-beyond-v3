import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const BUCKETS = ["Public", "public"] as const;
const AUTHOR_ROLES = ["instructor", "formateur", "admin", "tutor", "super_admin", "owner"];
const ALLOWED = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user || !supabase) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!(await isSuperAdmin())) {
    const { data } = await supabase.from("org_memberships").select("role").eq("user_id", user.id).in("role", AUTHOR_ROLES).limit(1);
    if (!data?.length) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Ajoutez un fichier." }, { status: 400 });
  }
  if (/\.zip$/i.test(file.name) || file.type === "application/zip") {
    return NextResponse.json({ error: "Déposez un PDF, une image ou un document, ou collez une url." }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Le fichier dépasse 15 Mo." }, { status: 400 });
  }
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Format accepté : PDF, image ou document." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Stockage indisponible" }, { status: 503 });
  const safe = file.name.replace(/[^\w.\-]+/g, "-").slice(0, 80) || "piece";
  const path = `ateliers/pieces/${crypto.randomUUID()}-${safe}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let last = "Aucun espace de stockage disponible.";
  for (const bucket of BUCKETS) {
    const { error } = await db.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (!error) {
      const { data } = db.storage.from(bucket).getPublicUrl(path);
      return NextResponse.json({ url: data.publicUrl, name: file.name });
    }
    last = error.message;
    if (!/bucket not found|not found/i.test(error.message)) break;
  }
  return NextResponse.json({ error: last }, { status: 502 });
}
