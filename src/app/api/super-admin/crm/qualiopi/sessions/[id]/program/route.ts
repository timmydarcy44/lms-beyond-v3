import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { copyTemplateDocsToSession, newAttendeeToken } from "@/lib/crm/qualiopi-sessions";
import { sendQualiopiConventionPack } from "@/lib/crm/qualiopi-emails";
import { resolveCatalogueFromEmail, resolveCatalogueFromName } from "@/lib/crm/pipeline-btob-owners";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const courseName = String(body?.course_name ?? "").trim();
  const courseId = body?.course_id ? String(body.course_id) : null;
  const scheduledAt = body?.scheduled_at ? String(body.scheduled_at) : null;
  const attendees = (Array.isArray(body?.attendees) ? body.attendees : [])
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        full_name: String(row.full_name ?? row.name ?? "").trim(),
        email: String(row.email ?? "").trim().toLowerCase(),
      };
    })
    .filter((item) => item.full_name && item.email.includes("@"));

  if (!courseName) return NextResponse.json({ error: "Indiquez la formation prévue." }, { status: 400 });
  if (attendees.length === 0) {
    return NextResponse.json({ error: "Ajoutez au moins un collaborateur invité." }, { status: 400 });
  }

  const { data: session } = await supabase.from("crm_qualiopi_sessions").select("*").eq("id", id).maybeSingle();
  if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const { data: deal } = await supabase.from("crm_pipeline_deals").select("*").eq("id", session.deal_id).maybeSingle();
  if (!deal) return NextResponse.json({ error: "Fiche client introuvable" }, { status: 404 });

  await supabase.from("crm_qualiopi_attendees").delete().eq("session_id", id);
  await supabase.from("crm_qualiopi_attendees").insert(
    attendees.map((item) => ({
      session_id: id,
      full_name: item.full_name,
      email: item.email,
      token: newAttendeeToken(),
      satisfaction_token: newAttendeeToken(),
    }))
  );
  await copyTemplateDocsToSession(supabase, id);

  const { data: docs } = await supabase
    .from("crm_qualiopi_documents")
    .select("*")
    .eq("session_id", id)
    .in("kind", ["convention", "reglement"]);

  const recipients = Array.from(
    new Set(
      [deal.email ? String(deal.email).trim().toLowerCase() : "", ...attendees.map((item) => item.email)].filter(Boolean)
    )
  );
  const ownerEmail = deal.contact_owner_email ? String(deal.contact_owner_email) : null;
  const sent = await sendQualiopiConventionPack({
    to: recipients,
    companyName: String(deal.company_name ?? ""),
    courseName,
    scheduledAt,
    fromEmail: resolveCatalogueFromEmail(ownerEmail),
    fromName: resolveCatalogueFromName(ownerEmail),
    documents: (docs ?? []).map((doc) => ({
      title: String(doc.title),
      file_url: doc.file_url ? String(doc.file_url) : null,
      file_name: doc.file_name ? String(doc.file_name) : null,
    })),
  });

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("crm_qualiopi_sessions")
    .update({
      course_name: courseName,
      course_id: courseId,
      scheduled_at: scheduledAt,
      status: "scheduled",
      convention_sent_at: sent.success ? now : null,
      reglement_sent_at: sent.success ? now : null,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    success: true,
    session: updated,
    email_sent: sent.success,
    email_error: sent.error ?? null,
  });
}
