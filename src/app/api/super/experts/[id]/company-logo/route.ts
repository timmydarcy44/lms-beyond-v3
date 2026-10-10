import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { parseContributorProfile, withContributorProfile } from "@/lib/expert/contributor-profile";
import { getServiceRoleClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const BUCKETS = ["Public", "public", "avatars"] as const;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as const;

function revalidateContributorPages(id: string) {
  revalidatePath("/super/experts");
  revalidatePath(`/super/experts/${id}`);
  revalidatePath("/admin/experts");
  revalidatePath(`/admin/experts/${id}`);
  for (const path of [
    "/ecole/ntc/ai-business",
    "/ecole/ntc/business-sport",
    "/ecole/ntc/real-estate",
    "/edge-lab/ecole/ntc/ai-business",
    "/edge-lab/ecole/ntc/business-sport",
    "/edge-lab/ecole/ntc/real-estate",
  ]) {
    revalidatePath(path);
  }
}

async function uploadLogo(userId: string, file: File): Promise<string> {
  if (!TYPES.includes(file.type as (typeof TYPES)[number])) {
    throw new Error("Le logo doit être un JPEG, PNG, WebP ou SVG.");
  }
  if (file.size > 2 * 1024 * 1024) throw new Error("Le logo dépasse 2 Mo.");
  const db = getServiceRoleClient();
  if (!db) throw new Error("Service indisponible");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/svg+xml" ? "svg" : "jpg";
  const path = `experts/${userId}/company-logo.${ext}`;
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

async function saveLogo(id: string, companyLogoUrl: string | null) {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { data: expert, error } = await supabase.from("experts").select("references,headline").eq("id", id).maybeSingle();
  if (error || !expert) return NextResponse.json({ error: "Expert introuvable" }, { status: 404 });
  const profile = parseContributorProfile(expert.references, expert.headline);
  const { error: updateError } = await supabase
    .from("experts")
    .update({
      references: withContributorProfile(expert.references, { ...profile, companyLogoUrl }),
    })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  revalidateContributorPages(id);
  return NextResponse.json({ companyLogoUrl });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  const { id } = await params;
  const form = await request.formData().catch(() => null);
  const file = form?.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choisis un logo." }, { status: 400 });
  }
  try {
    const url = await uploadLogo(id, file);
    return await saveLogo(id, `${url}?v=${Date.now()}`);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Envoi impossible" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  const { id } = await params;
  return saveLogo(id, null);
}
