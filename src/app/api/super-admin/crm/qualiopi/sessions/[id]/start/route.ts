import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
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

  const { data: session } = await supabase.from("crm_qualiopi_sessions").select("*").eq("id", id).maybeSingle();
  if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const { data: deal } = await supabase.from("crm_pipeline_deals").select("*").eq("id", session.deal_id).maybeSingle();
  if (!deal) return NextResponse.json({ error: "Fiche client introuvable" }, { status: 404 });

  const { data: attendees } = await supabase.from("crm_qualiopi_attendees").select("*").eq("session_id", id);
  if (!attendees?.length) {
    return NextResponse.json({ error: "Intégrez d'abord les collaborateurs invités." }, { status: 400 });
  }

  const { data: livret } = await supabase
    .from("crm_qualiopi_documents")
    .select("*")
    .eq("session_id", id)
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
  const { error } = await supabase
    .from("crm_qualiopi_sessions")
    .update({
      status: "in_progress",
      livret_sent_at: now,
      emargement_sent_at: now,
      updated_at: now,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    success: true,
    email_failures: results.filter((item) => !item.success),
  });
}
