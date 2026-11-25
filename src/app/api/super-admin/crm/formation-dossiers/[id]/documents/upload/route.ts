import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { DOC_TITLES, isLot4Kind, type Lot4DocumentKind } from "@/lib/formation-documents/constants";
import { normalizeStaffUploadToPdf } from "@/lib/formation-documents/normalize-upload-pdf";
import { newDocToken, uploadFormationPdf } from "@/lib/formation-documents/storage";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

const EXTRA_KINDS = new Set([
  "formateur_cv",
  "emargement",
  "facture",
  "suivi_lms",
  "suivi_lms_session",
  "preuve_devis",
  "preuve_convention",
  "preuve_signature",
  "reponses_positionnement",
  "reponses_chaud",
  "reponses_froid",
]);

function resolveTitle(kind: string): string {
  if (isLot4Kind(kind)) return DOC_TITLES[kind as Lot4DocumentKind];
  const labels: Record<string, string> = {
    formateur_cv: "CV formateur",
    emargement: "Émargement",
    facture: "Facture",
    suivi_lms: "Suivi LMS",
    suivi_lms_session: "Suivi LMS session",
    preuve_devis: "Preuve devis",
    preuve_convention: "Preuve convention",
    preuve_signature: "Preuve signature",
    reponses_positionnement: "Réponses positionnement",
    reponses_chaud: "Réponses évaluation à chaud",
    reponses_froid: "Réponses évaluation à froid",
  };
  return labels[kind] ?? kind;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: dossierId } = await ctx.params;
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });

  const kind = String(form.get("kind") ?? "").trim();
  const file = form.get("file");
  if (!kind) return NextResponse.json({ error: "kind requis" }, { status: 400 });
  if (!isLot4Kind(kind) && !EXTRA_KINDS.has(kind)) {
    return NextResponse.json({ error: `Kind non supporté: ${kind}` }, { status: 400 });
  }
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "Fichier requis (PDF, JPEG ou PNG)" }, { status: 400 });
  }

  const normalized = await normalizeStaffUploadToPdf(file);
  if (!normalized.buffer) {
    return NextResponse.json({ error: normalized.error || "Fichier invalide" }, { status: 400 });
  }

  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("id")
    .eq("id", dossierId)
    .maybeSingle();
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const uploaded = await uploadFormationPdf(service, {
    dossierId,
    kind,
    buffer: normalized.buffer,
  });
  if (!uploaded.ok) {
    return NextResponse.json(
      {
        error: `Upload stockage impossible: ${uploaded.error}`,
      },
      { status: 502 },
    );
  }

  // Ne pas filtrer participant_id/slot_id d’abord : certains docs seed n’ont pas ces colonnes renseignées.
  let existing: { id: string; access_token?: string | null; status?: string | null } | null = null;
  {
    const first = await service
      .from("formation_documents")
      .select("id, access_token, status")
      .eq("dossier_id", dossierId)
      .eq("kind", kind)
      .is("participant_id", null)
      .is("slot_id", null)
      .maybeSingle();
    if (!first.error && first.data) {
      existing = first.data;
    } else {
      const fallback = await service
        .from("formation_documents")
        .select("id, access_token, status")
        .eq("dossier_id", dossierId)
        .eq("kind", kind)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!fallback.error && fallback.data) existing = fallback.data;
    }
  }

  const now = new Date().toISOString();
  const accessToken =
    (existing as { access_token?: string | null } | null)?.access_token || newDocToken();
  // Contrainte SQL : to_generate | sent | opened | signed (pas "ready").
  // Dépôt staff devis/convention → signed + acceptance_method staff_upload (« Déposé le », pas OTP).
  const staffSignedKinds = new Set(["devis", "convention", "preuve_devis", "preuve_convention"]);
  const prevStatus = String(
    (existing as { status?: string | null } | null)?.status ?? "to_generate",
  );
  const nextStatus = staffSignedKinds.has(kind)
    ? "signed"
    : ["opened", "signed"].includes(prevStatus)
      ? prevStatus
      : "sent";
  const payload: Record<string, unknown> = {
    dossier_id: dossierId,
    kind,
    title: resolveTitle(kind),
    status: nextStatus,
    file_url: uploaded.fileUrl,
    storage_bucket: uploaded.bucket,
    storage_path: uploaded.path,
    access_token: accessToken,
    generated_at: now,
    updated_at: now,
    acceptance_method: "staff_upload",
  };
  if (nextStatus === "signed") {
    payload.signed_at = now;
  }

  if (existing?.id) {
    const { data, error } = await service
      .from("formation_documents")
      .update(payload)
      .eq("id", existing.id)
      .select("id, kind, title, status")
      .single();
    if (error) {
      // Colonnes storage absentes en prod → retry sans storage_* .
      if (/storage_(path|bucket)/i.test(error.message)) {
        const slim = { ...payload };
        delete slim.storage_bucket;
        delete slim.storage_path;
        const retry = await service
          .from("formation_documents")
          .update(slim)
          .eq("id", existing.id)
          .select("id, kind, title, status")
          .single();
        if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
        return NextResponse.json({ ok: true, document: retry.data });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, document: data });
  }

  const { data, error } = await service
    .from("formation_documents")
    .insert(payload)
    .select("id, kind, title, status")
    .single();
  if (error) {
    if (/storage_(path|bucket)/i.test(error.message)) {
      const slim = { ...payload };
      delete slim.storage_bucket;
      delete slim.storage_path;
      const retry = await service
        .from("formation_documents")
        .insert(slim)
        .select("id, kind, title, status")
        .single();
      if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
      return NextResponse.json({ ok: true, document: retry.data });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, document: data });
}
