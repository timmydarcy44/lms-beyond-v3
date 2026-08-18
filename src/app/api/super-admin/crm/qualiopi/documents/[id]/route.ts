import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: doc } = await supabase.from("crm_qualiopi_documents").select("kind").eq("id", id).maybeSingle();
  if (doc && ["convention", "reglement", "livret"].includes(String(doc.kind))) {
    const { error } = await supabase
      .from("crm_qualiopi_documents")
      .update({ file_url: null, file_name: null, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, cleared: true });
  }

  const { error } = await supabase.from("crm_qualiopi_documents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
