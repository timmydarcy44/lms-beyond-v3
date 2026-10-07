import { NextResponse } from "next/server";

import { getServiceRoleClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "video/mp4",
  "video/webm",
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

  const documentKinds = ["identity", "social_security", "diploma"];
  if (
    !token ||
    !["cv", "motivation", ...documentKinds].includes(kind) ||
    !(file instanceof File)
  ) {
    return NextResponse.json({ error: "Fichier ou candidature invalide." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Format non accepté ou fichier supérieur à 25 Mo." },
      { status: 400 },
    );
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: application } = await db
    .from("cfa_applications")
    .select("id,status,administrative_documents,private_files")
    .eq("resume_token", token)
    .maybeSingle();

  const dossierUpload = ["cv", "motivation"].includes(kind) && application?.status === "dossier";
  const administrativeUpload =
    documentKinds.includes(kind) && application?.status === "administrative";
  if (!application || (!dossierUpload && !administrativeUpload)) {
    return NextResponse.json({ error: "Téléversement non autorisé." }, { status: 403 });
  }

  const path = `${application.id}/${kind}-${crypto.randomUUID()}${safeExtension(file)}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await db.storage
    .from("cfa-applications")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const privateFiles = {
    ...(application.private_files as Record<string, unknown> | null),
    [kind]: {
      path,
      original_name: file.name.slice(0, 240),
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_at: new Date().toISOString(),
    },
  };
  const patch: Record<string, unknown> = { private_files: privateFiles };
  if (kind === "cv") patch.cv_path = path;
  if (kind === "motivation") patch.motivation_media_url = path;
  if (documentKinds.includes(kind)) {
    const documents = {
      ...(application.administrative_documents as Record<string, string> | null),
      [kind]: path,
    };
    patch.administrative_documents = documents;
  }
  const { error } = await db
    .from("cfa_applications")
    .update(patch)
    .eq("id", application.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ path, file: privateFiles[kind] });
}
