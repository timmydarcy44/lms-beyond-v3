import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  mergeRegistrationMeta,
  parseRegistrationMeta,
  type ExpertDocumentMeta,
} from "@/lib/expert/expert-registration-meta";
import { getServiceRoleClient } from "@/lib/supabase/server";

const BUCKETS = ["Public", "public"] as const;
const FOLDERS = new Set(["cv", "attestation", "diplome", "contrat", "admin", "autre"]);

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

export async function POST(request: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }
  const { id: expertId } = await ctx.params;
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });

  const file = form.get("file");
  const folderRaw = String(form.get("folder") ?? "autre").trim().toLowerCase();
  const folder = FOLDERS.has(folderRaw) ? folderRaw : "autre";
  const labelOverride = String(form.get("label") ?? "").trim();

  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 25 Mo)" }, { status: 400 });
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
  const url = urlData.publicUrl;
  const now = new Date().toISOString();
  const name = labelOverride || file.name || `${folderLabel(folder)}.${ext}`;
  const docId = objectId;

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
    mime_type: file.type || null,
    size: file.size,
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
    mime_type: file.type || null,
    size: file.size,
    uploaded_at: now,
    at: now,
  };

  const meta = parseRegistrationMeta(expert.references);
  const references = mergeRegistrationMeta(expert.references, {
    documents: [...(meta?.documents ?? []), metaDoc],
  });
  // Ajoute aussi une entrée plate lisible par parseExpertDocuments
  const nextRefs = Array.isArray(references) ? [...references, edgeDoc] : [edgeDoc];

  const { error: updateErr } = await db
    .from("experts")
    .update({ references: nextRefs })
    .eq("id", expertId);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

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

  return NextResponse.json({ ok: true, document: edgeDoc });
}
