import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendEmail } from "@/lib/email/resend-client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: { to?: string; subject?: string; body?: string; from?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const to = String(body?.to ?? "").trim();
  const subject = String(body?.subject ?? "").trim();
  const textBody = String(body?.body ?? "").trim();

  if (!to || !subject || !textBody) {
    return NextResponse.json({ error: "to, subject et body sont requis" }, { status: 400 });
  }

  const html = `<div style="font-family: sans-serif; max-width: 600px; line-height: 1.5;">${textBody.replace(/\n/g, "<br>")}</div>`;

  const result = await sendEmail({
    to,
    subject,
    html,
    from: body?.from?.trim() || undefined,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Envoi impossible" },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
}
