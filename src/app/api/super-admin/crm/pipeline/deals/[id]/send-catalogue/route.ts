import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  DEFAULT_CATALOGUE_EMAIL_BODY,
  sendBtobCatalogueEmail,
} from "@/lib/crm/pipeline-catalogue-email";
import {
  resolveCatalogueFromEmail,
  resolveCatalogueFromName,
  resolveCatalogueFromForCurrentUser,
} from "@/lib/crm/pipeline-btob-owners";
import { BTOB_CATALOGUE_STAGE_SLUG } from "@/lib/crm/pipeline-shared";
import { updatePipelineDeal } from "@/lib/crm/pipeline-deal-update";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const bodyText = String(body?.body_text ?? body?.bodyText ?? DEFAULT_CATALOGUE_EMAIL_BODY).trim();
  const toEmailOverride = body?.to_email != null ? String(body.to_email).trim() : null;

  const supabaseAuth = await getServerClient();
  const { data: userData } = supabaseAuth
    ? await supabaseAuth.auth.getUser()
    : { data: { user: null } };
  const sessionEmail = userData.user?.email ?? null;
  const sessionFrom = resolveCatalogueFromForCurrentUser(sessionEmail);
  const fromEmail = String(body?.from_email ?? body?.fromEmail ?? "").trim() || sessionFrom.email;
  const fromName = sessionFrom.name;

  const { data: deal, error: fetchError } = await supabase
    .from("crm_pipeline_deals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });
  if (!deal) return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });

  const ownerEmail = deal.contact_owner_email ? String(deal.contact_owner_email) : null;
  const resolvedFrom = fromEmail || resolveCatalogueFromEmail(ownerEmail);
  const resolvedName = fromName || resolveCatalogueFromName(ownerEmail);
  const recipient = toEmailOverride || (deal.email ? String(deal.email).trim() : "");
  const civilityOverride =
    body?.contact_civility != null ? String(body.contact_civility).trim() : null;

  const result = await sendBtobCatalogueEmail({
    email: recipient,
    contact_first_name: deal.contact_first_name ? String(deal.contact_first_name) : null,
    contact_last_name: deal.contact_last_name ? String(deal.contact_last_name) : null,
    contact_civility: civilityOverride || (deal.contact_civility ? String(deal.contact_civility) : null),
    company_name: String(deal.company_name ?? ""),
    fromEmail: resolvedFrom,
    fromName: resolvedName,
    bodyText,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Envoi impossible" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updatePatch: Record<string, unknown> = {
    stage_slug: BTOB_CATALOGUE_STAGE_SLUG,
    catalog_email_sent_at: now,
    updated_at: now,
    ...(toEmailOverride ? { email: toEmailOverride } : {}),
    ...(civilityOverride ? { contact_civility: civilityOverride } : {}),
  };

  const { data: updated, error: updateError } = await updatePipelineDeal(supabase, id, updatePatch);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deal: updated, sent_at: now });
}
