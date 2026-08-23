import { NextRequest, NextResponse } from "next/server";
import { assertJessicaAdmin } from "@/lib/jessica-contentin/assert-jessica-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const CATEGORIES = new Set(["ordonnance", "compte_rendu", "assurance", "mdph", "autre"]);

export async function GET(request: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const patientId = request.nextUrl.searchParams.get("patientId");
  const profileId = request.nextUrl.searchParams.get("profileId");

  let query = supabase
    .from("jessica_patient_documents")
    .select(
      "id, patient_id, profile_id, title, description, file_name, file_url, mime_type, file_size_bytes, category, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (patientId) query = query.eq("patient_id", patientId);
  if (profileId) query = query.eq("profile_id", profileId);

  const { data, error } = await query;
  if (error) {
    // Table absente tant que la migration n'est pas appliquée
    if (error.code === "42P01" || /does not exist/i.test(error.message)) {
      return NextResponse.json({ documents: [], migrationRequired: true });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const formData = await request.formData();
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const patientIdRaw = String(formData.get("patientId") ?? "").trim() || null;
  const profileIdRaw = String(formData.get("profileId") ?? "").trim() || null;
  const categoryRaw = String(formData.get("category") ?? "autre").trim().toLowerCase();
  const category = CATEGORIES.has(categoryRaw) ? categoryRaw : "autre";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }
  if (!patientIdRaw && !profileIdRaw) {
    return NextResponse.json({ error: "Patient requis" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 15 Mo)" }, { status: 400 });
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé (PDF, Word, images)." },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const safeName = file.name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 120);
  const folder = patientIdRaw || profileIdRaw || "misc";
  const storagePath = `patient-docs/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const buckets = ["jessica contentin", "Public", "public"];
  let publicUrl: string | null = null;
  let lastError: string | null = null;

  for (const bucket of buckets) {
    const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      publicUrl = data.publicUrl;
      break;
    }
    lastError = error.message;
  }

  if (!publicUrl) {
    return NextResponse.json({ error: lastError ?? "Upload impossible" }, { status: 400 });
  }

  const { data: row, error: insertError } = await supabase
    .from("jessica_patient_documents")
    .insert({
      patient_id: patientIdRaw,
      profile_id: profileIdRaw,
      title,
      description,
      file_name: safeName,
      file_url: publicUrl,
      mime_type: file.type || null,
      file_size_bytes: file.size,
      category,
      uploaded_by: user.id,
    })
    .select(
      "id, patient_id, profile_id, title, description, file_name, file_url, mime_type, file_size_bytes, category, created_at",
    )
    .single();

  if (insertError) {
    if (insertError.code === "42P01" || /does not exist/i.test(insertError.message)) {
      return NextResponse.json(
        {
          error:
            "Table jessica_patient_documents absente. Appliquez la migration 20260823160000_jessica_patient_documents.sql.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ document: row });
}

export async function DELETE(request: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { error } = await supabase.from("jessica_patient_documents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
