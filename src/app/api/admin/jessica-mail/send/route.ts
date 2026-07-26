import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { assertJessicaAdmin } from "@/lib/jessica-contentin/assert-jessica-admin";
import { sendJessicaResendEmail } from "@/lib/jessica-contentin/jessica-resend";
import { getJessicaCrmContacts } from "@/lib/queries/jessica-crm-contacts";

type Body = {
  subject?: string;
  message?: string;
  segment?: "all" | "single";
  email?: string;
  imageUrl?: string | null;
  imageLink?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildNewsletterHtml(params: {
  message: string;
  imageUrl?: string | null;
  imageLink?: string | null;
}): string {
  const paragraphs = params.message
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(b).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  let imageBlock = "";
  if (params.imageUrl) {
    const img = `<img src="${escapeHtml(params.imageUrl)}" alt="" style="display:block;width:100%;max-width:560px;height:auto;border-radius:12px;" />`;
    imageBlock = params.imageLink
      ? `<p style="margin:0 0 24px;"><a href="${escapeHtml(params.imageLink)}" target="_blank" rel="noopener noreferrer">${img}</a></p>`
      : `<p style="margin:0 0 24px;">${img}</p>`;
  }

  return `
    <div style="font-family:Georgia,serif;color:#2F2A25;max-width:560px;margin:0 auto;">
      ${imageBlock}
      ${paragraphs}
      <p style="margin:32px 0 0;font-size:13px;color:#8B6F47;">Jessica CONTENTIN — Psychopédagogue</p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Body | null;
  const subject = body?.subject?.trim() ?? "";
  const message = body?.message?.trim() ?? "";
  const segment = body?.segment ?? "single";
  const imageUrl = body?.imageUrl?.trim() || null;
  const imageLink = body?.imageLink?.trim() || null;

  if (!subject || !message) {
    return NextResponse.json({ error: "Objet et message requis" }, { status: 400 });
  }

  let recipients: string[] = [];
  if (segment === "single") {
    const email = body?.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email destinataire requis" }, { status: 400 });
    }
    recipients = [email];
  } else {
    const contacts = await getJessicaCrmContacts();
    recipients = [
      ...new Set(
        contacts
          .map((c) => c.email?.trim().toLowerCase())
          .filter((e): e is string => Boolean(e && e.includes("@"))),
      ),
    ];
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: "Aucun destinataire" }, { status: 400 });
  }

  const html = buildNewsletterHtml({ message, imageUrl, imageLink });
  const batchSize = 40;
  let sent = 0;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const result = await sendJessicaResendEmail({
      to: batch,
      subject,
      html,
    });
    if (result.success) {
      sent += batch.length;
    } else {
      errors.push(result.error ?? "Erreur inconnue");
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      { error: errors[0] ?? "Envoi impossible", recipients: recipients.length },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    sent,
    total: recipients.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
