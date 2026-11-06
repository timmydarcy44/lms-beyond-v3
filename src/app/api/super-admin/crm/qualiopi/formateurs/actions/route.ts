import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    plan_id?: string;
    title?: string;
    action_date?: string;
    proof_url?: string;
    status?: "todo" | "done";
  };

  const planId = String(body.plan_id ?? "").trim();
  const title = String(body.title ?? "").trim();
  if (!planId || !title) {
    return NextResponse.json({ error: "plan_id et title requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_qualiopi_formateur_actions")
    .insert({
      plan_id: planId,
      title,
      action_date: body.action_date ? String(body.action_date).slice(0, 10) : null,
      proof_url: body.proof_url ? String(body.proof_url) : null,
      status: body.status === "done" ? "done" : "todo",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ action: data });
}

export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    status?: "todo" | "done";
    title?: string;
    proof_url?: string | null;
  };
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status === "todo" || body.status === "done") patch.status = body.status;
  if (typeof body.title === "string") patch.title = body.title.trim();
  if ("proof_url" in body) patch.proof_url = body.proof_url || null;

  const { data, error } = await supabase
    .from("crm_qualiopi_formateur_actions")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ action: data });
}
