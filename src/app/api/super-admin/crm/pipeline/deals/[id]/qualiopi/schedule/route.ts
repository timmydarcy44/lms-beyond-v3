import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { updatePipelineDeal } from "@/lib/crm/pipeline-deal-update";
import { BTOB_FORMATION_SCHEDULED_STAGE_SLUG } from "@/lib/crm/pipeline-shared";
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
  const attendeesRaw = Array.isArray(body?.attendees) ? body.attendees : [];
  const attendees = attendeesRaw
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

  const { data: deal, error: dealError } = await supabase.from("crm_pipeline_deals").select("*").eq("id", id).maybeSingle();
  if (dealError) return NextResponse.json({ error: dealError.message }, { status: 400 });
  if (!deal) return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });

  const { data: session, error: sessionError } = await supabase
    .from("crm_qualiopi_sessions")
    .insert({
      deal_id: id,
      course_id: courseId,
      course_name: courseName,
      scheduled_at: scheduledAt,
      status: "scheduled",
    })
    .select()
    .single();
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 400 });

  const attendeeRows = attendees.map((item) => ({
    session_id: session.id,
    full_name: item.full_name,
    email: item.email,
    token: randomUUID(),
  }));
  const { error: attendeeError } = await supabase.from("crm_qualiopi_attendees").insert(attendeeRows);
  if (attendeeError) return NextResponse.json({ error: attendeeError.message }, { status: 400 });

  const { data: docs } = await supabase
    .from("crm_qualiopi_documents")
    .select("*")
    .in("kind", ["convention", "reglement"]);

  const recipients = Array.from(
    new Set([deal.email ? String(deal.email).trim().toLowerCase() : "", ...attendees.map((item) => item.email)].filter(Boolean))
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
  await supabase
    .from("crm_qualiopi_sessions")
    .update({
      convention_sent_at: sent.success ? now : null,
      reglement_sent_at: sent.success ? now : null,
      updated_at: now,
    })
    .eq("id", session.id);

  const { data: updated, error: updateError } = await updatePipelineDeal(supabase, id, {
    stage_slug: BTOB_FORMATION_SCHEDULED_STAGE_SLUG,
    updated_at: now,
  });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    deal: updated,
    session,
    email_sent: sent.success,
    email_error: sent.error ?? null,
  });
}
