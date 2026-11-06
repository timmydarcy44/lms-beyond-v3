import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await supabase
    .from("crm_qualiopi_actions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ actions: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const source = ["manual", "reclamation", "veille", "satisfaction", "revue"].includes(String(body.source))
    ? String(body.source)
    : "manual";

  const { data, error } = await supabase
    .from("crm_qualiopi_actions")
    .insert({
      title,
      cause: String(body.cause ?? "").trim() || null,
      owner_name: String(body.owner_name ?? "").trim() || null,
      due_at: body.due_at ? String(body.due_at).slice(0, 10) : null,
      source,
      reclamation_id: body.reclamation_id ? String(body.reclamation_id) : null,
      highlight_id: body.highlight_id ? String(body.highlight_id) : null,
      status: "todo",
      reviewed_at: source === "revue" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ action: data });
}
