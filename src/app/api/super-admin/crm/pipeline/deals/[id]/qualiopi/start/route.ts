import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { updatePipelineDeal } from "@/lib/crm/pipeline-deal-update";
import { BTOB_FORMATION_IN_PROGRESS_STAGE_SLUG } from "@/lib/crm/pipeline-shared";
import { sendQualiopiStartPack } from "@/lib/crm/qualiopi-emails";
import { resolveCatalogueFromEmail, resolveCatalogueFromName } from "@/lib/crm/pipeline-btob-owners";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: deal } = await supabase.from("crm_pipeline_deals").select("*").eq("id", id).maybeSingle();
  if (!deal) return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });

  const { data: session } = await supabase
    .from("crm_qualiopi_sessions")
    .select("*")
    .eq("deal_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!session) {
    return NextResponse.json(
      { error: "Programmez d'abord la formation (colonne Formation programmée)." },
      { status: 400 }
    );
  }

  const { data: attendees } = await supabase
    .from("crm_qualiopi_attendees")
    .select("*")
    .eq("session_id", session.id);
  if (!attendees?.length) {
    return NextResponse.json({ error: "Aucun collaborateur invité sur cette session." }, { status: 400 });
  }

  const { data: livret } = await supabase
    .from("crm_qualiopi_documents")
    .select("*")
    .eq("kind", "livret")
    .maybeSingle();

  const ownerEmail = deal.contact_owner_email ? String(deal.contact_owner_email) : null;
  const results = await sendQualiopiStartPack({
    attendees: attendees.map((item) => ({
      full_name: String(item.full_name),
      email: String(item.email),
      token: String(item.token),
    })),
    companyName: String(deal.company_name ?? ""),
    courseName: String(session.course_name),
    fromEmail: resolveCatalogueFromEmail(ownerEmail),
    fromName: resolveCatalogueFromName(ownerEmail),
    livret: livret
      ? {
          title: String(livret.title),
          file_url: livret.file_url ? String(livret.file_url) : null,
          file_name: livret.file_name ? String(livret.file_name) : null,
        }
      : null,
  });

  const now = new Date().toISOString();
  await supabase
    .from("crm_qualiopi_sessions")
    .update({
      status: "in_progress",
      livret_sent_at: now,
      emargement_sent_at: now,
      updated_at: now,
    })
    .eq("id", session.id);

  const { data: updated, error: updateError } = await updatePipelineDeal(supabase, id, {
    stage_slug: BTOB_FORMATION_IN_PROGRESS_STAGE_SLUG,
    updated_at: now,
  });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const failed = results.filter((item) => !item.success);
  return NextResponse.json({
    success: true,
    deal: updated,
    email_failures: failed,
  });
}
