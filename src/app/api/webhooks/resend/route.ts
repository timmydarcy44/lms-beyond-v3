import { NextRequest, NextResponse } from "next/server";
import { getResendClient } from "@/lib/email/resend-client";
import { getServiceRoleClient } from "@/lib/supabase/server";

type ResendWebhookEvent = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    tags?: Record<string, string> | Array<{ name: string; value: string }>;
  };
};

function tagValue(
  tags: Record<string, string> | Array<{ name: string; value: string }> | undefined,
  key: string,
): string | null {
  if (!tags) return null;
  if (Array.isArray(tags)) {
    const found = tags.find((t) => t.name === key);
    return found?.value?.trim() || null;
  }
  const value = tags[key];
  return typeof value === "string" ? value.trim() || null : null;
}

/**
 * Webhook Resend — enregistre l'ouverture des emails catalogue CRM.
 * Configurer sur resend.com : event `email.opened` → POST /api/webhooks/resend
 * Secret : RESEND_WEBHOOK_SECRET
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("[webhooks/resend] RESEND_WEBHOOK_SECRET manquant");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
  }

  const payload = await req.text();
  const resend = await getResendClient();
  if (!resend?.webhooks?.verify) {
    return NextResponse.json({ error: "Client Resend indisponible" }, { status: 503 });
  }

  let event: ResendWebhookEvent;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    }) as ResendWebhookEvent;
  } catch (error) {
    console.error("[webhooks/resend] signature invalide:", error);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type !== "email.opened") {
    return NextResponse.json({ ok: true, ignored: event.type ?? null });
  }

  const emailId = event.data?.email_id?.trim();
  const dealIdFromTag = tagValue(event.data?.tags, "deal_id");
  if (!emailId && !dealIdFromTag) {
    return NextResponse.json({ ok: true, skipped: "no_email_id" });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const openedAt = event.created_at || new Date().toISOString();
  const patch = { catalog_email_opened_at: openedAt };

  let updated = false;

  if (emailId) {
    const { data, error } = await supabase
      .from("crm_pipeline_deals")
      .update(patch)
      .eq("catalog_email_resend_id", emailId)
      .is("catalog_email_opened_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[webhooks/resend] update by email_id:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    updated = Boolean(data?.id);
  }

  if (!updated && dealIdFromTag) {
    const { data, error } = await supabase
      .from("crm_pipeline_deals")
      .update(patch)
      .eq("id", dealIdFromTag)
      .not("catalog_email_sent_at", "is", null)
      .is("catalog_email_opened_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[webhooks/resend] update by deal_id:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    updated = Boolean(data?.id);
  }

  return NextResponse.json({ ok: true, updated });
}
