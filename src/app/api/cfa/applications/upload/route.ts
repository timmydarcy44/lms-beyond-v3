import { NextResponse } from "next/server";

import { getServiceRoleClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "video/mp4",
]);

function safeExtension(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension ? `.${extension}` : "";
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const token = String(formData?.get("token") ?? "").trim();
  const kind = String(formData?.get("kind") ?? "").trim();
  const file = formData?.get("file");

  if (!token || !["cv", "motivation"].includes(kind) || !(file instanceof File)) {
    return NextResponse.json({ error: "Fichier ou candidature invalide." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Format non accepté ou fichier supérieur à 10 Mo." },
      { status: 400 },
    );
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: application } = await db
    .from("cfa_applications")
    .select("id,status")
    .eq("resume_token", token)
    .maybeSingle();

  if (!application || application.status !== "dossier") {
    return NextResponse.json({ error: "Téléversement non autorisé." }, { status: 403 });
  }

  const path = `${application.id}/${kind}-${crypto.randomUUID()}${safeExtension(file)}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await db.storage
    .from("cfa-applications")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  if (kind === "cv") {
    const { error } = await db
      .from("cfa_applications")
      .update({ cv_path: path })
      .eq("id", application.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ path });
}
