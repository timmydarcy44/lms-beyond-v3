import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { DOC_TITLES, isLot4Kind, type Lot4DocumentKind } from "@/lib/formation-documents/constants";
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
    return NextResponse.json({ error: "Fichier PDF requis" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 25 Mo)" }, { status: 400 });
  }

  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("id")
    .eq("id", dossierId)
    .maybeSingle();
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadFormationPdf(service, { dossierId, kind, buffer });
  if (!uploaded) {
    return NextResponse.json({ error: "Upload stockage impossible" }, { status: 502 });
  }

  let { data: existing } = await service
    .from("formation_documents")
    .select("id, access_token, status")
    .eq("dossier_id", dossierId)
    .eq("kind", kind)
    .is("participant_id", null)
    .is("slot_id", null)
    .maybeSingle();

  if (!existing) {
    const { data: fallback } = await service
      .from("formation_documents")
      .select("id, access_token, status")
      .eq("dossier_id", dossierId)
      .eq("kind", kind)
      .maybeSingle();
    existing = fallback;
  }

  const now = new Date().toISOString();
  const accessToken =
    (existing as { access_token?: string | null } | null)?.access_token || newDocToken();
  // Contrainte SQL : to_generate | sent | opened | signed (pas "ready").
  const prevStatus = String(
    (existing as { status?: string | null } | null)?.status ?? "to_generate",
  );
  const nextStatus = ["opened", "signed"].includes(prevStatus) ? prevStatus : "sent";
  const payload = {
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
  };

  if (existing?.id) {
    const { data, error } = await service
      .from("formation_documents")
      .update(payload)
      .eq("id", existing.id)
      .select("id, kind, title, status")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, document: data });
  }

  const { data, error } = await service
    .from("formation_documents")
    .insert(payload)
    .select("id, kind, title, status")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, document: data });
}
