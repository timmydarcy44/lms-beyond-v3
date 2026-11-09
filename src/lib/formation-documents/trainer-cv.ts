import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadFormationPdf, newDocToken } from "@/lib/formation-documents/storage";

export type ExpertCvRef = {
  name: string;
  url: string;
  source: "expert_documents" | "experts_references";
  uploadedAt?: string | null;
};

/** CV déposé dans l’espace expert (table ou references JSON). */
export async function resolveExpertCv(
  service: SupabaseClient,
  expertUserId: string,
): Promise<ExpertCvRef | null> {
  const { data: rows } = await service
    .from("expert_documents")
    .select("name, url, folder, uploaded_at, status")
    .eq("expert_id", expertUserId)
    .eq("folder", "cv")
    .order("uploaded_at", { ascending: false })
    .limit(5);

  const fromTable = (rows ?? []).find((r) => String(r.url || "").trim());
  if (fromTable) {
    return {
      name: String(fromTable.name || "CV"),
      url: String(fromTable.url),
      source: "expert_documents",
      uploadedAt: fromTable.uploaded_at ? String(fromTable.uploaded_at) : null,
    };
  }

  const { data: expert } = await service
    .from("experts")
    .select("references")
    .eq("id", expertUserId)
    .maybeSingle();

  const refs = expert?.references as { documents?: Array<Record<string, unknown>> } | null;
  const docs = Array.isArray(refs?.documents) ? refs!.documents! : [];
  const cv = docs
    .filter((d) => {
      const folder = String(d.folder ?? d.category ?? "").toLowerCase();
      return folder === "cv" && String(d.url || "").trim();
    })
    .sort((a, b) => String(b.uploaded_at ?? "").localeCompare(String(a.uploaded_at ?? "")))[0];

  if (!cv) return null;
  return {
    name: String(cv.name || "CV"),
    url: String(cv.url),
    source: "experts_references",
    uploadedAt: cv.uploaded_at ? String(cv.uploaded_at) : null,
  };
}

async function fetchRemoteBytes(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

/**
 * Copie figée du CV formateur dans le coffre du dossier (kind formateur_cv).
 * Refuse si aucun CV expert.
 */
export async function snapshotTrainerCvToDossier(
  service: SupabaseClient,
  params: {
    dossierId: string;
    trainerUserId: string;
    actorUserId?: string | null;
  },
): Promise<{ ok: true; documentId: string } | { ok: false; error: string; code: string }> {
  const cv = await resolveExpertCv(service, params.trainerUserId);
  if (!cv) {
    return {
      ok: false,
      code: "trainer_cv_required",
      error:
        "CV formateur manquant. Le formateur doit déposer son CV dans /dashboard/expert/documents (dossier CV).",
    };
  }

  const bytes = await fetchRemoteBytes(cv.url);
  const uploaded = bytes
    ? await uploadFormationPdf(service, {
        dossierId: params.dossierId,
        kind: "formateur_cv",
        buffer: bytes,
      })
    : null;

  const now = new Date().toISOString();
  const title = `CV formateur — ${cv.name}`;
  const meta = {
    source_url: cv.url,
    source: cv.source,
    trainer_user_id: params.trainerUserId,
    uploaded_at: cv.uploadedAt,
    snapshotted_at: now,
    copied_to_vault: Boolean(uploaded),
  };

  const { data: existing } = await service
    .from("formation_documents")
    .select("id")
    .eq("dossier_id", params.dossierId)
    .eq("kind", "formateur_cv")
    .is("participant_id", null)
    .is("slot_id", null)
    .maybeSingle();

  const patch: Record<string, unknown> = {
    title,
    status: "signed",
    signed_at: now,
    generated_at: now,
    updated_at: now,
    meta,
    // Copie privée si possible, sinon lien source (dépôt expert)
    file_url: uploaded?.fileUrl ?? cv.url,
  };
  if (uploaded) {
    patch.storage_bucket = uploaded.bucket;
    patch.storage_path = uploaded.path;
  }

  let documentId: string;
  if (existing?.id) {
    const { error } = await service.from("formation_documents").update(patch).eq("id", existing.id);
    if (error) return { ok: false, code: "cv_snapshot_failed", error: error.message };
    documentId = String(existing.id);
  } else {
    const { data, error } = await service
      .from("formation_documents")
      .insert({
        dossier_id: params.dossierId,
        kind: "formateur_cv",
        title,
        status: "signed",
        access_token: newDocToken(),
        ...patch,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, code: "cv_snapshot_failed", error: error?.message || "Insert CV impossible" };
    }
    documentId = String(data.id);
  }

  await service.from("formation_events").insert({
    dossier_id: params.dossierId,
    event_type: "trainer_cv_snapshotted",
    actor_user_id: params.actorUserId ?? null,
    payload: { document_id: documentId, trainer_user_id: params.trainerUserId },
  });

  return { ok: true, documentId };
}

export async function dossierHasTrainerCv(
  service: SupabaseClient,
  dossierId: string,
): Promise<boolean> {
  const { data } = await service
    .from("formation_documents")
    .select("id, file_url, storage_path")
    .eq("dossier_id", dossierId)
    .eq("kind", "formateur_cv")
    .maybeSingle();
  return Boolean(data && (data.file_url || data.storage_path));
}
