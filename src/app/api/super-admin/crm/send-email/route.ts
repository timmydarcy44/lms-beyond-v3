import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendEmail } from "@/lib/email/resend-client";
import { getCrmUsers } from "@/lib/queries/super-admin";
import { formatCrmRoleLabel } from "@/lib/crm/crm-shared";

type InlineImage = {
  id?: string;
  filename?: string;
  contentBase64?: string;
  href?: string;
};

type Body = {
  subject?: string;
  html?: string;
  segment?: "all" | "role" | "single";
  role?: string;
  email?: string;
  images?: InlineImage[];
};

function safeHref(value: string): string {
  const href = value.trim();
  if (!/^https?:\/\//i.test(href)) return "https://edgebs.fr";
  return href.replace(/"/g, "%22").replace(/[<>]/g, "");
}

export async function POST(req: NextRequest) {
  const allowed = await isSuperAdmin();
  if (!allowed) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const subject = body?.subject?.trim() ?? "";
  let html = body?.html?.trim() ?? "";
  const segment = body?.segment ?? "all";
  const images = Array.isArray(body?.images) ? body.images.slice(0, 6) : [];
  const attachments = images.flatMap((image, index) => {
    const id = String(image.id || `img-${index}`).replace(/[^a-z0-9_-]/gi, "") || `img-${index}`;
    const content = String(image.contentBase64 ?? "").replace(/^data:[^;]+;base64,/, "");
    if (!content) return [];
    const href = safeHref(String(image.href ?? ""));
    const cid = `mail-image-${id}`;
    const block = `<p style="margin:16px 0"><a href="${href}" target="_blank" rel="noreferrer"><img src="cid:${cid}" alt="" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0" /></a></p>`;
    if (html.includes(`{{image:${id}}}`)) html = html.replaceAll(`{{image:${id}}}`, block);
    else html += block;
    return [{ filename: String(image.filename || `${cid}.png`), content, contentId: cid, contentEncoding: "base64" as const }];
  });

  if (!subject || !html) {
    return NextResponse.json({ error: "Objet et contenu HTML requis" }, { status: 400 });
  }

  let recipients: string[] = [];

  if (segment === "single") {
    const email = body?.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email destinataire requis" }, { status: 400 });
    }
    recipients = [email];
  } else {
    const users = await getCrmUsers();
    const filtered =
      segment === "role" && body?.role
        ? users.filter((u) => u.role === body.role)
        : users;
    recipients = [...new Set(filtered.map((u) => u.email).filter(Boolean))];
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: "Aucun destinataire" }, { status: 400 });
  }

  const batchSize = 50;
  let sent = 0;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const result = await sendEmail({
      to: batch,
      subject,
      html,
      replyTo: "contact@edgebs.fr",
      attachments,
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

  const roleLabel =
    segment === "role" && body?.role ? formatCrmRoleLabel(body.role) : null;

  return NextResponse.json({
    ok: true,
    sent,
    total: recipients.length,
    segment,
    roleLabel,
    errors: errors.length > 0 ? errors : undefined,
  });
}
