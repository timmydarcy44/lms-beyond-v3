import { NextResponse } from "next/server";

import { listPrivateFiles, type CfaPrivateFile } from "@/lib/cfa-applications";
import { getServiceRoleClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_CV_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "video/mp4",
  "video/webm",
  "video/quicktime",
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

  const documentKinds = ["identity", "social_security", "diploma", "transcript", "attestation"];
  const challengeKinds = ["cv", "motivation", "challenge_media"];
  if (
    !token ||
    ![...challengeKinds, ...documentKinds].includes(kind) ||
    !(file instanceof File)
  ) {
    return NextResponse.json({ error: "Fichier ou candidature invalide." }, { status: 400 });
  }
  const sizeLimit = kind === "cv" ? MAX_CV_SIZE : MAX_FILE_SIZE;
  const lowerName = file.name.toLowerCase();
  const inferredType =
    file.type ||
    (lowerName.endsWith(".mp4")
      ? lowerName.includes("audio")
        ? "audio/mp4"
        : "video/mp4"
      : lowerName.endsWith(".webm")
        ? lowerName.includes("audio")
          ? "audio/webm"
          : "video/webm"
        : lowerName.endsWith(".ogg")
          ? "audio/ogg"
          : lowerName.endsWith(".wav")
            ? "audio/wav"
            : "");
  if (file.size > sizeLimit || !ALLOWED_TYPES.has(inferredType)) {
    return NextResponse.json(
      {
        error:
          kind === "cv"
            ? "Format non accepté ou CV supérieur à 10 Mo."
            : "Format non accepté ou fichier supérieur à 50 Mo.",
      },
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

  const candidatureUpload =
    challengeKinds.includes(kind) &&
    (application?.status === "dossier" || application?.status === "challenge" || application?.status === "profile");
  const administrativeUpload =
    documentKinds.includes(kind) &&
    (application?.status === "administrative" || application?.status === "profile");
  if (!application || (!candidatureUpload && !administrativeUpload)) {
    return NextResponse.json({ error: "Téléversement non autorisé." }, { status: 403 });
  }

  const bucket = kind === "challenge_media" ? "admission-media" : "cfa-applications";
  const questionId = String(formData?.get("questionId") ?? "").trim().slice(0, 80);
  const path =
    kind === "challenge_media"
      ? `${application.id}/${questionId || "q"}-${crypto.randomUUID()}${safeExtension(file)}`
      : `${application.id}/${kind}-${crypto.randomUUID()}${safeExtension(file)}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await db.storage
    .from(bucket)
    .upload(path, bytes, { contentType: inferredType || file.type || "application/octet-stream", upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const fileKey = kind === "challenge_media" ? `challenge_${questionId || "media"}` : kind;
  const meta: CfaPrivateFile = {
    path,
    bucket,
    original_name: file.name.slice(0, 240),
    mime_type: inferredType || file.type,
    size_bytes: file.size,
    uploaded_at: new Date().toISOString(),
  };
  const currentFiles = (application.private_files ?? {}) as Record<string, CfaPrivateFile | CfaPrivateFile[]>;
  const privateFiles: Record<string, CfaPrivateFile | CfaPrivateFile[]> = {
    ...currentFiles,
    [fileKey]:
      kind === "challenge_media" ? meta : [...listPrivateFiles(currentFiles, fileKey), meta],
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

  return NextResponse.json({ path, bucket, file: meta });
}
