import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { documentUploadSchema, parseInput } from "@/lib/cfa/fiche-input";
import { loadCfaApplicationBoard, loadCfaCompanies } from "@/lib/cfa/load-cfa-crm";
import { listPrivateFiles, type CfaPrivateFile } from "@/lib/cfa-applications";
import { recordCfaTouch } from "@/lib/cfa/upsert-cfa-person";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STAFF_CURSUS = "_staff_curriculum_id";
const STAFF_COMPANY = "_staff_host_company_id";

async function authorize() {
  if (!(await isSuperAdmin())) {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  const session = await getSession();
  const supabase = await getServerClient();
  const db = getServiceRoleClient();
  if (!session?.id || !supabase || !db) {
    return { error: NextResponse.json({ error: "Service indisponible" }, { status: 503 }) };
  }
  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  return { db, schoolId, actorId: session.id };
}

export async function GET() {
  const ctx = await authorize();
  if ("error" in ctx) return ctx.error;
  const { db, schoolId } = ctx;
  const curriculaQuery = schoolId
    ? db
        .from("school_curricula")
        .select("id, name, code")
        .eq("school_id", schoolId)
        .neq("status", "archived")
        .order("name")
    : db.from("school_curricula").select("id, name, code").neq("status", "archived").order("name");
  const [board, companies, curricula] = await Promise.all([
    loadCfaApplicationBoard(db, "admin"),
    loadCfaCompanies(db),
    curriculaQuery,
  ]);
  if ("error" in board && board.error) return NextResponse.json({ error: board.error }, { status: 400 });
  // Apprentis = admis OU déjà en contrat (sinon ils disparaissent dès le passage en "contract")
  const APPRENTICE_STATUSES = new Set(["admitted", "contract"]);
  const students = (board.applications ?? []).filter((row) =>
    APPRENTICE_STATUSES.has(String((row as { status?: string }).status ?? "")),
  );
  // Filet anti-doublons : même code/nom seedé sur plusieurs écoles (si schoolId introuvable)
  const seen = new Set<string>();
  const uniqueCurricula = (curricula.data ?? []).filter((row) => {
    const key = String(row.code ?? row.name ?? row.id).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return NextResponse.json({
    students,
    companies: "companies" in companies ? companies.companies : [],
    curricula: uniqueCurricula,
  });
}

export async function PATCH(request: Request) {
  const ctx = await authorize();
  if ("error" in ctx) return ctx.error;
  const body = (await request.json().catch(() => null)) as {
    id?: string;
    curriculumId?: string | null;
    companyId?: string | null;
  } | null;
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Dossier manquant." }, { status: 400 });

  const { data: current, error } = await ctx.db
    .from("cfa_applications")
    .select("cerfa_data")
    .eq("id", id)
    .maybeSingle();
  if (error || !current) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  const cerfa = {
    ...((current.cerfa_data ?? {}) as Record<string, string>),
  };
  if (body && "curriculumId" in body) cerfa[STAFF_CURSUS] = String(body.curriculumId ?? "");
  if (body && "companyId" in body) cerfa[STAFF_COMPANY] = String(body.companyId ?? "");

  const { error: updateError } = await ctx.db.from("cfa_applications").update({ cerfa_data: cerfa }).eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  const changes = [
    body && "curriculumId" in body ? `Cursus : ${String(body.curriculumId || "aucun")}` : "",
    body && "companyId" in body ? `Entreprise : ${String(body.companyId || "aucune")}` : "",
  ].filter(Boolean);
  await recordCfaTouch(ctx.db, {
    personId: id,
    type: body && "companyId" in body ? "placement" : "curriculum",
    detail: changes.join(" · "),
    createdBy: ctx.actorId,
  });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const ctx = await authorize();
  if ("error" in ctx) return ctx.error;
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const parsed = parseInput(documentUploadSchema, {
    id: String(formData?.get("id") ?? ""),
    label: String(formData?.get("label") ?? "").trim() || "Document",
    kind: String(formData?.get("kind") ?? ""),
    fileName: file instanceof File ? file.name : "",
    fileSize: file instanceof File ? file.size : 0,
    fileType: file instanceof File ? file.type : "",
  }, "Fichier ou dossier manquant.");
  if (!parsed.ok || !(file instanceof File)) {
    return NextResponse.json({ error: parsed.ok ? "Fichier ou dossier manquant." : parsed.error }, { status: 400 });
  }
  const id = parsed.data.id;
  const label = parsed.data.label;
  const kind = parsed.data.kind ?? "";

  const { data: application } = await ctx.db
    .from("cfa_applications")
    .select("id, administrative_documents, private_files")
    .eq("id", id)
    .maybeSingle();
  if (!application) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = ["identity", "social_security", "diploma", "transcript", "attestation", "cv"].includes(kind)
    ? kind
    : `scan_${Date.now()}`;
  const path = `${application.id}/${key}-${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await ctx.db.storage
    .from("cfa-applications")
    .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const documents = {
    ...((application.administrative_documents ?? {}) as Record<string, string>),
    [key]: path,
  };
  const currentFiles = (application.private_files ?? {}) as Record<string, CfaPrivateFile | CfaPrivateFile[]>;
  const nextFile: CfaPrivateFile = {
    path,
    original_name: label.slice(0, 240),
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_at: new Date().toISOString(),
  };
  const privateFiles = {
    ...currentFiles,
    [key]: [...listPrivateFiles(currentFiles, key), nextFile],
  };
  const { error: updateError } = await ctx.db
    .from("cfa_applications")
    .update({ administrative_documents: documents, private_files: privateFiles })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  await recordCfaTouch(ctx.db, {
    personId: id,
    type: "document",
    detail: `Dépôt : ${label}`,
    createdBy: ctx.actorId,
    proofUrl: path,
  });
  return NextResponse.json({ ok: true });
}
