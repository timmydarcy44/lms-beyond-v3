import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { QUALIOPI_PROCESS_DOCS, processDocByKind } from "@/lib/qualiopi/qualiopi-of-b2b";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  // Seed templates manquants
  for (const doc of QUALIOPI_PROCESS_DOCS) {
    await supabase.from("crm_qualiopi_process_docs").upsert(
      {
        kind: doc.kind,
        title: doc.title,
        body: doc.template,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kind", ignoreDuplicates: true },
    );
  }

  const { data, error } = await supabase.from("crm_qualiopi_process_docs").select("*").order("kind");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ docs: data ?? [], catalog: QUALIOPI_PROCESS_DOCS });
}

export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    kind?: string;
    title?: string;
    body?: string;
    status?: "draft" | "ready" | "attested";
    file_url?: string | null;
    file_name?: string | null;
  };

  const meta = processDocByKind(String(body.kind ?? ""));
  if (!meta) return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });

  const patch: Record<string, unknown> = {
    kind: meta.kind,
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : meta.title,
    updated_at: new Date().toISOString(),
  };
  if (typeof body.body === "string") patch.body = body.body;
  if (body.status === "draft" || body.status === "ready" || body.status === "attested") {
    patch.status = body.status;
  }
  if ("file_url" in body) patch.file_url = body.file_url || null;
  if ("file_name" in body) patch.file_name = body.file_name || null;

  const { data, error } = await supabase
    .from("crm_qualiopi_process_docs")
    .upsert(patch, { onConflict: "kind" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ doc: data });
}
