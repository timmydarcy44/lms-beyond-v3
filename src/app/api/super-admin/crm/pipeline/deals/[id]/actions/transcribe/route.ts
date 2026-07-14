import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { synthesizeCallFromTranscript } from "@/lib/crm/pipeline-ai-synthesis";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: dealId } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("audio");
  const action_type = String(form.get("action_type") ?? "call_success").trim();
  const manualNotes = form.get("notes") ? String(form.get("notes")).trim() : "";
  const created_by_email = form.get("created_by_email")
    ? String(form.get("created_by_email")).trim()
    : null;

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fichier audio requis" }, { status: 400 });
  }

  const { data: deal } = await supabase
    .from("crm_pipeline_deals")
    .select("company_name, contact_first_name")
    .eq("id", dealId)
    .maybeSingle();

  if (!deal) {
    return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });
  }

  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json({ error: "OpenAI non configuré" }, { status: 503 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const transcription = await client.audio.transcriptions.create({
    file: new File([buffer], file.name || "call.webm", { type: file.type || "audio/webm" }),
    model: "whisper-1",
    language: "fr",
  });

  const transcript = typeof transcription === "string" ? transcription : transcription.text ?? "";

  const ai_summary = await synthesizeCallFromTranscript({
    companyName: String(deal.company_name),
    contactName: String(deal.contact_first_name ?? ""),
    actionType: action_type,
    transcript,
    manualNotes: manualNotes || undefined,
  });

  const { data, error } = await supabase
    .from("crm_pipeline_deal_actions")
    .insert({
      deal_id: dealId,
      action_type,
      notes: manualNotes || null,
      transcript,
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

  return NextResponse.json({ action: data, transcript });
}
