import { NextResponse } from "next/server";

import { resolveResendFromEmail } from "@/lib/email/resend-from";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!firstName || !lastName || !email || !phone || !message) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const notifyTo = process.env.CONTACT_EMAIL?.trim() || "contact@edgebs.fr";

    if (resendKey && notifyTo) {
      const from = resolveResendFromEmail();
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: notifyTo,
          reply_to: email,
          subject: `[Clément Lepley] Contact — ${firstName} ${lastName}`,
          html: `<p><strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong></p>
<p>Email : ${escapeHtml(email)}<br/>Tél. : ${escapeHtml(phone)}</p>
<p>${escapeHtml(message)}</p>`,
        }),
      });

      if (!res.ok) {
        console.error("[clement-lepley/contact] Resend error:", await res.text());
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[clement-lepley/contact]", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
