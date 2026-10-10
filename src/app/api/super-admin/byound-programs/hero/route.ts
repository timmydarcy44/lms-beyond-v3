import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CFA_SPECIALIZATIONS, type CfaSpecialization } from "@/lib/cfa-applications";
import { listByoundProgramFacts } from "@/lib/byound-school/program-facts-server";
import { getServiceRoleClient } from "@/lib/supabase/server";

const BUCKETS = ["Public", "public", "avatars"] as const;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 8 * 1024 * 1024;

function isSpecialization(value: string): value is CfaSpecialization {
  return CFA_SPECIALIZATIONS.some((item) => item.value === value);
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const specialization = String(form?.get("specialization") ?? "").trim();
  const file = form?.get("file");
  if (!isSpecialization(specialization)) {
    return NextResponse.json({ error: "Spécialisation invalide." }, { status: 400 });
  }
  if (!(file instanceof File) || !TYPES[file.type]) {
    return NextResponse.json({ error: "Choisissez une image JPEG, PNG ou WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "L’image dépasse 8 Mo." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const path = `byound-programs/${specialization}-hero.${TYPES[file.type]}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let publicUrl = "";
  let lastError = "Aucun espace de stockage disponible.";
  for (const bucket of BUCKETS) {
    const { error } = await db.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });
    if (!error) {
      const { data } = db.storage.from(bucket).getPublicUrl(path);
      publicUrl = data.publicUrl ? `${data.publicUrl}?v=${Date.now()}` : "";
      if (publicUrl) break;
    }
    lastError = error?.message || lastError;
    if (error && !/bucket not found|not found/i.test(error.message)) break;
  }
  if (!publicUrl) return NextResponse.json({ error: lastError }, { status: 500 });

  const { error } = await db.from("byound_school_programs").upsert(
    { specialization, hero_image_url: publicUrl, updated_at: new Date().toISOString() },
    { onConflict: "specialization" },
  );
  if (error) {
    return NextResponse.json(
      {
        error:
          error.message.includes("hero_image_url") || error.code === "42703"
            ? "Applique la migration 20261010220000_cfa_brochure_and_hero.sql pour l’image de couverture."
            : error.message,
      },
      { status: 400 },
    );
  }

  for (const page of [
    "/ecole/ntc/ai-business",
    "/ecole/ntc/business-sport",
    "/ecole/ntc/real-estate",
    "/edge-lab/ecole/ntc/ai-business",
    "/edge-lab/ecole/ntc/business-sport",
    "/edge-lab/ecole/ntc/real-estate",
  ]) {
    revalidatePath(page);
  }

  const programs = await listByoundProgramFacts();
  return NextResponse.json({
    heroImageUrl: publicUrl,
    programs,
    program: programs.find((item) => item.specialization === specialization),
  });
}
