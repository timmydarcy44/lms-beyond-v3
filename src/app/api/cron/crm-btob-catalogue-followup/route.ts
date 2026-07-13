import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { BTOB_CATALOGUE_STAGE_SLUG } from "@/lib/crm/pipeline-shared";
import { sendBtobCatalogueFollowupEmail } from "@/lib/crm/pipeline-catalogue-email";

const FOLLOWUP_DAYS = Number(process.env.CRM_BTOB_CATALOGUE_FOLLOWUP_DAYS ?? 3);

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - FOLLOWUP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: deals, error } = await service
    .from("crm_pipeline_deals")
    .select("id, email, contact_first_name, company_name, catalog_email_sent_at, catalogue_followup_email_sent_at, stage_slug, pipeline_type")
    .eq("pipeline_type", "btob")
    .eq("stage_slug", BTOB_CATALOGUE_STAGE_SLUG)
    .not("catalog_email_sent_at", "is", null)
    .lt("catalog_email_sent_at", cutoff)
    .is("catalogue_followup_email_sent_at", null)
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let scanned = 0;
  let sent = 0;
  let skipped = 0;

  for (const deal of deals ?? []) {
    scanned += 1;
    const recipient = String(deal.email ?? "").trim();
    if (!recipient) {
      skipped += 1;
      continue;
    }

    const result = await sendBtobCatalogueFollowupEmail({
      email: recipient,
      contact_first_name: deal.contact_first_name ? String(deal.contact_first_name) : null,
      company_name: String(deal.company_name ?? "").trim() || "votre entreprise",
    });

    if (!result.success) {
      skipped += 1;
      continue;
    }

    sent += 1;
    await service
      .from("crm_pipeline_deals")
      .update({ catalogue_followup_email_sent_at: new Date().toISOString() })
      .eq("id", deal.id);
  }

  return NextResponse.json({ ok: true, scanned, sent, skipped, cutoff });
}

