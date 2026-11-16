import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  PROCEDURE_SECTION_KEYS,
  type ProcedureSectionKey,
} from "@/lib/qualiopi/procedure-sections";
import { saveSectionFallback } from "@/lib/qualiopi/procedures-fallback";
import { draftFromValidated } from "@/lib/qualiopi/procedure-status";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const key = String(body.key ?? "") as ProcedureSectionKey;
  if (!(PROCEDURE_SECTION_KEYS as readonly string[]).includes(key)) {
    return NextResponse.json({ error: "Clé de section invalide" }, { status: 400 });
  }
  const content = typeof body.content === "string" ? body.content : "";

  // Tables v2 ?
  const { data: proc, error: loadErr } = await supabase
    .from("crm_qualiopi_procedures")
    .select("id, status, current_version")
    .eq("id", id)
    .maybeSingle();

  if (loadErr && /does not exist|schema cache/i.test(loadErr.message)) {
    try {
      await saveSectionFallback(supabase, id, key, content);
      return NextResponse.json({ ok: true, migration_required: true });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Enregistrement impossible" },
        { status: 400 },
      );
    }
  }

  if (loadErr || !proc) {
    // Peut être un id legacy process_docs
    try {
      await saveSectionFallback(supabase, id, key, content);
      return NextResponse.json({ ok: true, migration_required: true });
    } catch {
      return NextResponse.json({ error: loadErr?.message || "Introuvable" }, { status: 404 });
    }
  }

  if (proc.status === "validated") {
    await supabase
      .from("crm_qualiopi_procedures")
      .update({
        status: "draft",
        current_version: draftFromValidated(proc.current_version),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  }

  const { data, error } = await supabase
    .from("crm_qualiopi_procedure_sections")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("procedure_id", id)
    .eq("key", key)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase
    .from("crm_qualiopi_procedures")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ section: data });
}
