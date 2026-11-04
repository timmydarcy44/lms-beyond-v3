import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const BUCKETS = ["Public", "public", "avatars"] as const;
const TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

async function uploadPhoto(userId: string, file: File): Promise<string> {
  if (!TYPES.includes(file.type as (typeof TYPES)[number])) {
    throw new Error("La photo doit être un JPEG, PNG ou WebP.");
  }
  if (file.size > 4 * 1024 * 1024) throw new Error("La photo dépasse 4 Mo.");
  const db = getServiceRoleClient();
  if (!db) throw new Error("Service indisponible");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `experts/${userId}/photo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let lastError = "Aucun espace de stockage disponible.";
  for (const bucket of BUCKETS) {
    const { error } = await db.storage.from(bucket).upload(path, buffer, { contentType: file.type, upsert: true });
    if (!error) {
      const { data } = db.storage.from(bucket).getPublicUrl(path);
      if (data.publicUrl) return data.publicUrl;
    }
    lastError = error?.message || lastError;
    if (error && !/bucket not found|not found/i.test(error.message)) break;
  }
  throw new Error(lastError);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  const { id } = await params;
  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choisis une photo." }, { status: 400 });
  }
  try {
    const url = `${await uploadPhoto(id, file)}?v=${Date.now()}`;
    const supabase = await getServiceRoleClientOrFallback();
    if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const { error } = await supabase.from("experts").update({ photo_url: url, avatar_url: url }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/super/experts");
    revalidatePath(`/super/experts/${id}`);
    revalidatePath("/");
    return NextResponse.json({ photoUrl: url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Envoi impossible" }, { status: 400 });
  }
}
