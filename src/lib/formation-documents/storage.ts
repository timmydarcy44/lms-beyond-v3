import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const FORMATION_DOCS_BUCKET = "formation-docs";
const PRIVATE_REF_PREFIX = "private://";

export function newDocToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Référence interne stockée en file_url (jamais une URL HTTP publique). */
export function toPrivateStorageRef(bucket: string, path: string): string {
  return `${PRIVATE_REF_PREFIX}${bucket}/${path}`;
}

export function parsePrivateStorageRef(
  ref: string | null | undefined,
): { bucket: string; path: string } | null {
  if (!ref?.startsWith(PRIVATE_REF_PREFIX)) return null;
  const rest = ref.slice(PRIVATE_REF_PREFIX.length);
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) };
}

export type FormationPdfUploadResult =
  | { ok: true; bucket: string; path: string; fileUrl: string }
  | { ok: false; error: string };

/**
 * Upload PDF en bucket privé, chemin non devinable.
 * Ne jamais exposer d'URL publique.
 */
export async function uploadFormationPdf(
  service: SupabaseClient,
  params: { dossierId: string; kind: string; buffer: Buffer },
): Promise<FormationPdfUploadResult> {
  const objectId = newDocToken();
  // Chemin opaque : pas de dossierId complet énumérable
  const path = `${objectId}/${params.kind}.pdf`;

  const tryUpload = () =>
    service.storage.from(FORMATION_DOCS_BUCKET).upload(path, params.buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  let { error } = await tryUpload();

  // Bucket manquant → créer puis réessayer (évite un listBuckets flaky).
  if (error && /bucket not found|not found/i.test(error.message)) {
    const created = await service.storage.createBucket(FORMATION_DOCS_BUCKET, {
      public: false,
      fileSizeLimit: "25MB",
      allowedMimeTypes: ["application/pdf"],
    });
    if (created.error && !/already exists|duplicate/i.test(created.error.message)) {
      console.warn("[formation-docs/storage] createBucket:", created.error.message);
      return { ok: false, error: `Bucket formation-docs: ${created.error.message}` };
    }
    ({ error } = await tryUpload());
  }

  if (error) {
    console.warn("[formation-docs/storage] upload failed:", error.message);
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    bucket: FORMATION_DOCS_BUCKET,
    path,
    fileUrl: toPrivateStorageRef(FORMATION_DOCS_BUCKET, path),
  };
}

/** Télécharge un PDF privé (service role) pour streaming API. */
export async function downloadFormationPdf(
  service: SupabaseClient,
  params: {
    bucket?: string | null;
    path?: string | null;
    fileUrl?: string | null;
  },
): Promise<Buffer | null> {
  const fromRef = parsePrivateStorageRef(params.fileUrl);
  const bucket = params.bucket || fromRef?.bucket || FORMATION_DOCS_BUCKET;
  const path = (params.path || fromRef?.path || "").trim();
  if (!path) return null;

  const { data, error } = await service.storage.from(bucket).download(path);
  if (error || !data) return null;
  const ab = await data.arrayBuffer();
  return Buffer.from(ab);
}

/** True si file_url pointe vers un objet storage public (à ne plus rediriger). */
export function isPublicStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\/storage\/v1\/object\/public\//i.test(url);
}
