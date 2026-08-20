import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { QUALIOPI_CORE_DOCS, type QualiopiDocKind } from "@/lib/crm/qualiopi-shared";

async function ensureCoreDocs(supabase: NonNullable<ReturnType<typeof getServiceRoleClient>>) {
  const { data } = await supabase.from("crm_qualiopi_documents").select("kind").is("session_id", null);
  const existing = new Set((data ?? []).map((row) => String(row.kind)));
  const missing = QUALIOPI_CORE_DOCS.filter((doc) => !existing.has(doc.kind));
  if (missing.length) {
    await supabase.from("crm_qualiopi_documents").insert(missing.map((doc) => ({ kind: doc.kind, title: doc.title })));
  }
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  await ensureCoreDocs(supabase);
  const { data, error } = await supabase
    .from("crm_qualiopi_documents")
    .select("*")
    .is("session_id", null)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim();
  const kind = (String(form.get("kind") ?? "autre") as QualiopiDocKind) || "autre";
  const replaceId = String(form.get("id") ?? "").trim();
  const sessionId = String(form.get("session_id") ?? "").trim();
  const file = form.get("file");

  if (!title) return NextResponse.json({ error: "Titre obligatoire" }, { status: 400 });

  let fileUrl: string | null = null;
  let fileName: string | null = null;

  if (file instanceof File && file.size > 0) {
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "pdf";
    const pathName = `qualiopi/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from("Public").upload(pathName, buffer, {
      contentType: file.type || "application/pdf",
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("Public").getPublicUrl(pathName);
    fileUrl = publicUrl;
    fileName = file.name;
  }

  const payload = {
    title,
    kind: ["convention", "reglement", "livret", "autre"].includes(kind) ? kind : "autre",
    file_url: fileUrl,
    file_name: fileName,
    session_id: sessionId || null,
    updated_at: new Date().toISOString(),
  };

  if (replaceId) {
    const updatePayload = fileUrl ? payload : { title: payload.title, kind: payload.kind, updated_at: payload.updated_at };
    const { data, error } = await supabase
      .from("crm_qualiopi_documents")
      .update(updatePayload)
      .eq("id", replaceId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ document: data });
  }

  const { data, error } = await supabase.from("crm_qualiopi_documents").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ document: data });
}
