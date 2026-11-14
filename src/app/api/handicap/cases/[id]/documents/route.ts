import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { loadDisabilityCaseDetail } from "@/lib/handicap/case-data";
import { resolveDisabilityCaseId } from "@/lib/handicap/resolve-case";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const KINDS = new Set(["rqth", "plan_signe", "autre"]);
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);

function extForMime(mime: string) {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "bin";
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) return NextResponse.json({ error: "Non autorisé" }, { status: gate.status });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: rawId } = await ctx.params;
  const caseId = await resolveDisabilityCaseId(service, rawId);
  if (!caseId) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });

  const kind = String(form.get("kind") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const validUntilRaw = String(form.get("valid_until") ?? "").trim();
  const file = form.get("file");

  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return NextResponse.json({ error: "Formats acceptés : PDF, JPG, PNG" }, { status: 400 });
  }

  const fileId = randomUUID();
  const storagePath = `${caseId}/${fileId}.${extForMime(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await service.storage
    .from("disability-docs")
    .upload(storagePath, buffer, { contentType: mime, upsert: false });
  if (upErr) {
    console.error("[disability] upload", caseId, upErr.message);
    return NextResponse.json({ error: "Échec du dépôt" }, { status: 400 });
  }

  const defaultTitle =
    kind === "rqth" ? "Justificatif RQTH" : kind === "plan_signe" ? "Plan signé" : "Document";
  const validUntil =
    kind === "rqth" && validUntilRaw ? validUntilRaw.slice(0, 10) : validUntilRaw ? validUntilRaw.slice(0, 10) : null;

  const { error: insErr } = await service.from("disability_documents").insert({
    case_id: caseId,
    kind,
    title: title || defaultTitle,
    storage_path: storagePath,
    valid_until: validUntil,
    uploaded_by: gate.userId,
  });
  if (insErr) {
    console.error("[disability] doc insert", caseId, insErr.message);
    await service.storage.from("disability-docs").remove([storagePath]);
    return NextResponse.json({ error: "Échec de l'enregistrement" }, { status: 400 });
  }

  if (kind === "rqth" && validUntil) {
    await service
      .from("disability_cases")
      .update({ rqth_valid_until: validUntil, updated_at: new Date().toISOString() })
      .eq("id", caseId);
  } else {
    await service
      .from("disability_cases")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", caseId);
  }

  const detail = await loadDisabilityCaseDetail(service, caseId);
  return NextResponse.json({
    case: detail,
    isSuperAdmin: await isSuperAdmin(),
  });
}
