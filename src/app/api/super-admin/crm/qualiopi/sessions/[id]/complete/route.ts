import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendQualiopiSatisfactionPack } from "@/lib/crm/qualiopi-emails";
import { resolveCatalogueFromEmail, resolveCatalogueFromName } from "@/lib/crm/pipeline-btob-owners";
import { newAttendeeToken } from "@/lib/crm/qualiopi-sessions";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: session } = await supabase.from("crm_qualiopi_sessions").select("*").eq("id", id).maybeSingle();
  if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const { data: deal } = await supabase.from("crm_pipeline_deals").select("*").eq("id", session.deal_id).maybeSingle();
  if (!deal) return NextResponse.json({ error: "Fiche client introuvable" }, { status: 404 });

  const { data: attendees } = await supabase.from("crm_qualiopi_attendees").select("*").eq("session_id", id);
  if (!attendees?.length) {
    return NextResponse.json({ error: "Aucun collaborateur sur cette formation." }, { status: 400 });
  }

  for (const attendee of attendees) {
    if (!attendee.satisfaction_token) {
      await supabase
        .from("crm_qualiopi_attendees")
        .update({ satisfaction_token: newAttendeeToken() })
        .eq("id", attendee.id);
    }
  }

  const { data: refreshed } = await supabase.from("crm_qualiopi_attendees").select("*").eq("session_id", id);
  const ownerEmail = deal.contact_owner_email ? String(deal.contact_owner_email) : null;
  const results = await sendQualiopiSatisfactionPack({
    attendees: (refreshed ?? []).map((item) => ({
      full_name: String(item.full_name),
      email: String(item.email),
      satisfaction_token: String(item.satisfaction_token ?? item.token),
    })),
    companyName: String(deal.company_name ?? ""),
    courseName: String(session.course_name),
    fromEmail: resolveCatalogueFromEmail(ownerEmail),
    fromName: resolveCatalogueFromName(ownerEmail),
  });

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("crm_qualiopi_sessions")
    .update({
      status: "done",
      satisfaction_sent_at: now,
      updated_at: now,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    success: true,
    email_failures: results.filter((item) => !item.success),
  });
}
