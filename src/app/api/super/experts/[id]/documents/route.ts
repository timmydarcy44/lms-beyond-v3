import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  mergeRegistrationMeta,
  parseRegistrationMeta,
  type ExpertDocumentMeta,
} from "@/lib/expert/expert-registration-meta";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
/** Upload direct storage : on ne lit plus le fichier dans la fonction (limite body Vercel). */
export const maxDuration = 60;

const BUCKETS = ["Public", "public"] as const;
const FOLDERS = new Set(["cv", "attestation", "diplome", "contrat", "admin", "autre"]);
/** Contrats scannés lourds — upload direct Storage (hors body Next/Vercel). */
const MAX_BYTES = 80 * 1024 * 1024;

type Ctx = { params: Promise<{ id: string }> };

function folderLabel(folder: string) {
  const map: Record<string, string> = {
    cv: "CV",
    attestation: "Attestation",
    diplome: "Diplôme",
    contrat: "Contrat de prestation",
    admin: "Pièce administrative",
    autre: "Document",
  };
  return map[folder] ?? "Document";
}

function normalizeFolder(raw: string) {
  const folder = raw.trim().toLowerCase();
  return FOLDERS.has(folder) ? folder : "autre";
}

async function resolveBucket(
  db: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  path: string,
) {
  let lastError = "Aucun bucket disponible";
  for (const bucket of BUCKETS) {
    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (!error && data) {
      return { bucket, signed: data, error: null as string | null };
    }
    lastError = error?.message ?? lastError;
    if (error && !/bucket not found|not found/i.test(error.message)) {
      return { bucket: null, signed: null, error: lastError };
    }
  }
  return { bucket: null, signed: null, error: lastError };
}

async function registerDocument(params: {
  db: NonNullable<ReturnType<typeof getServiceRoleClient>>;
  expertId: string;
  references: unknown;
  folder: string;
  name: string;
  docId: string;
  url: string;
  mimeType: string | null;
  size: number;
  now: string;
}) {
  const { db, expertId, folder, name, docId, url, mimeType, size, now } = params;
  const metaDoc: ExpertDocumentMeta = {
    id: docId,
    name,
    category:
      folder === "cv"
        ? "cv"
        : folder === "attestation" || folder === "diplome"
          ? "certificates"
          : folder === "contrat" || folder === "admin"
            ? "admin"
            : "portfolio",
    url,
    mime_type: mimeType,
    size,
    uploaded_at: now,
    status: "deposited",
    folder:
      folder === "diplome" || folder === "admin"
        ? "autre"
        : (folder as ExpertDocumentMeta["folder"]),
  };

  const edgeDoc = {
    _type: folder === "cv" ? "edge_cv" : "edge_document",
    id: docId,
    label: name,
    name,
    url,
    folder,
    mime_type: mimeType,
    size,
    uploaded_at: now,
    at: now,
  };

  const meta = parseRegistrationMeta(params.references);
  const references = mergeRegistrationMeta(params.references, {
    documents: [...(meta?.documents ?? []), metaDoc],
  });
  const nextRefs = Array.isArray(references) ? [...references, edgeDoc] : [edgeDoc];

  const { error: updateErr } = await db
    .from("experts")
    .update({ references: nextRefs })
    .eq("id", expertId);
  if (updateErr) return { error: updateErr.message, edgeDoc: null };

  await db.from("expert_documents").insert({
    id: docId,
    expert_id: expertId,
    name,
    folder: metaDoc.folder ?? "autre",
    status: "deposited",
    url,
  });

  revalidatePath("/super/experts");
  revalidatePath(`/super/experts/${expertId}`);

  return { error: null as string | null, edgeDoc };
}

/**
 * Upload expert docs :
 * - `action=prepare` → URL signée Storage (fichiers lourds, hors limite body Next)
 * - `action=complete` → enregistre la métadonnée après PUT réussi
 * - FormData legacy → petits fichiers (< 4,5 Mo typiquement)
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }
  const { id: expertId } = await ctx.params;
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      action?: string;
      folder?: string;
      fileName?: string;
      contentType?: string;
      size?: number;
      label?: string;
      path?: string;
      bucket?: string;
      docId?: string;
      url?: string;
    } | null;
    if (!body?.action) {
      return NextResponse.json({ error: "Action requise" }, { status: 400 });
    }

    const { data: expert, error: expertErr } = await db
      .from("experts")
      .select("id, references")
      .eq("id", expertId)
      .maybeSingle();
    if (expertErr || !expert) {
      return NextResponse.json({ error: "Expert introuvable" }, { status: 404 });
    }

    if (body.action === "prepare") {
      const size = Number(body.size ?? 0);
      if (!Number.isFinite(size) || size <= 0) {
        return NextResponse.json({ error: "Taille de fichier invalide" }, { status: 400 });
      }
      if (size > MAX_BYTES) {
        return NextResponse.json(
          {
            error: `Fichier trop volumineux (max ${Math.round(MAX_BYTES / (1024 * 1024))} Mo). Compressez le PDF (ex. 150–200 dpi) puis réessayez.`,
          },
          { status: 400 },
        );
      }

      const folder = normalizeFolder(String(body.folder ?? "autre"));
      const fileName = String(body.fileName ?? "document.bin");
      const ext =
        (fileName.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
      const docId = crypto.randomUUID();
      const path = `experts/${expertId}/documents/${folder}/${docId}.${ext}`;
      const resolved = await resolveBucket(db, path);
      if (!resolved.bucket || !resolved.signed) {
        return NextResponse.json({ error: resolved.error || "Upload indisponible" }, { status: 502 });
      }

      const { data: urlData } = db.storage.from(resolved.bucket).getPublicUrl(path);
      const labelOverride = String(body.label ?? "").trim();
      const name = labelOverride || fileName || `${folderLabel(folder)}.${ext}`;

      return NextResponse.json({
        ok: true,
        docId,
        bucket: resolved.bucket,
        path: resolved.signed.path ?? path,
        token: resolved.signed.token,
        signedUrl: resolved.signed.signedUrl,
        url: urlData.publicUrl,
        folder,
        name,
      });
    }

    if (body.action === "complete") {
      const folder = normalizeFolder(String(body.folder ?? "autre"));
      const docId = String(body.docId ?? "").trim();
      const url = String(body.url ?? "").trim();
      const name = String(body.label ?? body.fileName ?? folderLabel(folder)).trim();
      const size = Number(body.size ?? 0);
      if (!docId || !url) {
        return NextResponse.json({ error: "Métadonnées incomplètes" }, { status: 400 });
      }

      const now = new Date().toISOString();
      const registered = await registerDocument({
        db,
        expertId,
        references: expert.references,
        folder,
        name,
        docId,
        url,
        mimeType: body.contentType ? String(body.contentType) : null,
        size: Number.isFinite(size) ? size : 0,
        now,
      });
      if (registered.error || !registered.edgeDoc) {
        return NextResponse.json({ error: registered.error || "Enregistrement impossible" }, { status: 400 });
      }
      return NextResponse.json({ ok: true, document: registered.edgeDoc });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  // Legacy FormData (petits fichiers)
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });

  const file = form.get("file");
  const folder = normalizeFolder(String(form.get("folder") ?? "autre"));
  const labelOverride = String(form.get("label") ?? "").trim();

  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `Fichier trop volumineux (max ${Math.round(MAX_BYTES / (1024 * 1024))} Mo). Compressez le PDF puis réessayez.`,
      },
      { status: 400 },
    );
  }
  // Au-delà de ~4,5 Mo le body Vercel échoue souvent : demander le flux signé.
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json(
      {
        error: "Fichier trop lourd pour l’envoi classique. Rechargez la page et réessayez (upload direct).",
        code: "USE_SIGNED_UPLOAD",
      },
      { status: 413 },
    );
  }

  const { data: expert, error: expertErr } = await db
    .from("experts")
    .select("id, references")
    .eq("id", expertId)
    .maybeSingle();
  if (expertErr || !expert) {
    return NextResponse.json({ error: "Expert introuvable" }, { status: 404 });
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const objectId = crypto.randomUUID();
  const path = `experts/${expertId}/documents/${folder}/${objectId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let bucketName: string | null = null;
  let lastError = "Aucun bucket disponible";
  for (const bucket of BUCKETS) {
    const { error } = await db.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (!error) {
      bucketName = bucket;
      break;
    }
    lastError = error.message;
    if (!/bucket not found|not found/i.test(error.message)) break;
  }
  if (!bucketName) {
    return NextResponse.json({ error: lastError }, { status: 502 });
  }

  const { data: urlData } = db.storage.from(bucketName).getPublicUrl(path);
  const now = new Date().toISOString();
  const name = labelOverride || file.name || `${folderLabel(folder)}.${ext}`;

  const registered = await registerDocument({
    db,
    expertId,
    references: expert.references,
    folder,
    name,
    docId: objectId,
    url: urlData.publicUrl,
    mimeType: file.type || null,
    size: file.size,
    now,
  });
  if (registered.error || !registered.edgeDoc) {
    return NextResponse.json({ error: registered.error || "Enregistrement impossible" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, document: registered.edgeDoc });
}
