import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { synthesizeCallFromNotes } from "@/lib/crm/pipeline-ai-synthesis";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("crm_pipeline_deal_actions")
    .select("*")
    .eq("deal_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ actions: data ?? [] });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id: dealId } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action_type = String(body?.action_type ?? "note").trim();
  const notes = body?.notes ? String(body.notes).trim() : null;
  const title = body?.title ? String(body.title).trim() : null;
  const created_by_email = body?.created_by_email ? String(body.created_by_email).trim() : null;
  const withAi = body?.with_ai_summary === true;

  const { data: deal } = await supabase
    .from("crm_pipeline_deals")
    .select("company_name, contact_first_name")
    .eq("id", dealId)
    .maybeSingle();

  if (!deal) {
    return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });
  }

  let ai_summary: string | null = null;
  if (withAi && notes) {
    ai_summary = await synthesizeCallFromNotes({
      companyName: String(deal.company_name),
      contactName: String(deal.contact_first_name ?? ""),
      actionType: action_type,
      notes,
    });
  }

  const { data, error } = await supabase
    .from("crm_pipeline_deal_actions")
    .insert({
      deal_id: dealId,
      action_type,
      title,
      notes,
      ai_summary,
      created_by_email,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase
    .from("crm_pipeline_deals")
    .update({
      last_contact_date: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealId);

  return NextResponse.json({ action: data });
}
