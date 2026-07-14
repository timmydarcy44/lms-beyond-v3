import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  updatePipelineBtobDeal,
  type McpPipelineBtobInput,
} from "@/lib/crm/pipeline-btob-mcp";

export const dynamic = "force-dynamic";

type BriefingActionBody = {
  prospectId: string;
  actionType: "email_sent" | "call_script_copied";
  emailSubject?: string;
  notes?: string;
};

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: BriefingActionBody | null = null;
  try {
    body = (await request.json()) as BriefingActionBody;
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const prospectId = String(body?.prospectId ?? "").trim();
  if (!prospectId) {
    return NextResponse.json({ error: "prospectId requis" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const dateLabel = new Date().toLocaleDateString("fr-FR");
  const actionType = body?.actionType;

  const noteLine =
    actionType === "email_sent"
      ? `Briefing du ${dateLabel} : email envoyé${body?.emailSubject ? ` — ${body.emailSubject}` : ""}`
      : `Briefing du ${dateLabel} : script d'appel copié / appel prévu`;

  const extraNotes = body?.notes?.trim();
  const notes = extraNotes ? `${noteLine}\n${extraNotes}` : noteLine;

  const supabase = getServiceRoleClient();
  let engagementScore = 1;
  let mergedNotes = notes;
  if (supabase) {
    const { data } = await supabase
      .from("crm_pipeline_deals")
      .select("engagement_score, notes")
      .eq("id", prospectId)
      .maybeSingle();
    const current = Number(data?.engagement_score ?? 0);
    engagementScore = Math.min(3, current + 1);
    const prev = String(data?.notes ?? "").trim();
    if (prev) mergedNotes = `${noteLine}\n\n${prev}`;
  }

  try {
    const patch: McpPipelineBtobInput = {
      last_contact_date: today,
      notes: mergedNotes,
      engagement_score: engagementScore,
      ...(actionType === "email_sent" ? { stage_slug: "mail_envoye_catalogue" } : {}),
    };

    const prospect = await updatePipelineBtobDeal(prospectId, patch);
    return NextResponse.json({ success: true, prospect });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Mise à jour impossible";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
