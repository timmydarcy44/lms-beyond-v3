import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CFA_SPECIALIZATIONS, type CfaSpecialization } from "@/lib/cfa-applications";
import { listByoundProgramFacts } from "@/lib/byound-school/program-facts-server";
import { getServiceRoleClient } from "@/lib/supabase/server";

const BUCKETS = ["Public", "public", "pdfs"] as const;
const MAX_BYTES = 12 * 1024 * 1024;

function isSpecialization(value: string): value is CfaSpecialization {
  return CFA_SPECIALIZATIONS.some((item) => item.value === value);
}

function revalidateProgramPages() {
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
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choisissez un fichier PDF." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Le fichier doit être un PDF." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Le PDF dépasse 12 Mo." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const path = `byound-programs/${specialization}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let publicUrl = "";
  let lastError = "Aucun espace de stockage disponible.";
  for (const bucket of BUCKETS) {
    const { error } = await db.storage.from(bucket).upload(path, buffer, {
      contentType: "application/pdf",
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
  if (!publicUrl) {
    return NextResponse.json({ error: lastError }, { status: 500 });
  }

  const { error } = await db.from("byound_school_programs").upsert(
    { specialization, program_pdf_url: publicUrl, updated_at: new Date().toISOString() },
    { onConflict: "specialization" },
  );
  if (error) {
    return NextResponse.json(
      {
        error:
          error.code === "42P01"
            ? "Applique la migration byound_school_programs pour activer l’édition."
            : error.message,
      },
      { status: 400 },
    );
  }

  revalidateProgramPages();
  const programs = await listByoundProgramFacts();
  return NextResponse.json({
    programPdfUrl: publicUrl,
    programs,
    program: programs.find((item) => item.specialization === specialization),
  });
}
