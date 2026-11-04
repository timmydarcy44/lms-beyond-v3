import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendEmail } from "@/lib/email/resend-client";
import { getCrmUsers } from "@/lib/queries/super-admin";
import { formatCrmRoleLabel } from "@/lib/crm/crm-shared";
import { edgeEmailBrand } from "@/lib/emails/edge-email-shell";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

type InlineImage = {
  id?: string;
  filename?: string;
  contentBase64?: string;
  href?: string;
};

type Body = {
  subject?: string;
  title?: string;
  html?: string;
  segment?: "all" | "role" | "single";
  role?: string;
  email?: string;
  images?: InlineImage[];
  expertId?: string;
  test?: boolean;
  templateLabel?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildCampaignEmail(title: string, bodyHtml: string): string {
  const heading = title
    ? `<h1 style="margin:0 0 28px;font-size:32px;font-weight:700;letter-spacing:-0.03em;line-height:1.15;color:#0b0b0c;">${escapeHtml(title)}</h1>`
    : "";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title || "Byound")}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(title)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
    <tr><td style="padding:48px 24px 64px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;margin:0 auto;">
        <tr><td>
          ${edgeEmailBrand("light")}
          ${heading}
          ${bodyHtml}
          <p style="margin:40px 0 0;padding-top:24px;border-top:1px solid #ececec;font-size:13px;line-height:1.5;color:#6b6f7a;">
            Byound · <a href="https://www.byound.fr" style="color:#0b0b0c;text-decoration:none;">www.byound.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function safeHref(value: string): string {
  const href = value.trim();
  if (!/^https?:\/\//i.test(href)) return "https://www.byound.fr";
  return href.replace(/"/g, "%22").replace(/[<>]/g, "");
}

export async function POST(req: NextRequest) {
  const allowed = await isSuperAdmin();
  if (!allowed) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const subject = body?.subject?.trim() ?? "";
  const title = body?.title?.trim() ?? "";
  let html = body?.html?.trim() ?? "";
  const segment = body?.segment ?? "all";
  const images = Array.isArray(body?.images) ? body.images.slice(0, 6) : [];
  const imageBlocks = new Map<string, string>();
  const imageLinks = new Map<string, string>();
  const attachments = images.flatMap((image, index) => {
    const id = String(image.id || `img-${index}`).replace(/[^a-z0-9_-]/gi, "") || `img-${index}`;
    const content = String(image.contentBase64 ?? "").replace(/^data:[^;]+;base64,/, "");
    if (!content) return [];
    const href = safeHref(String(image.href ?? ""));
    const cid = `mail-image-${id}`;
    imageLinks.set(id, href);
    imageBlocks.set(
      id,
      `<p style="margin:20px 0"><a href="${href}" target="_blank" rel="noreferrer"><img src="cid:${cid}" alt="" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:12px" /></a></p>`,
    );
    return [{ filename: String(image.filename || `${cid}.png`), content, contentId: cid, contentEncoding: "base64" as const }];
  });

  if (!subject || !title || !html) {
    return NextResponse.json({ error: "Objet, titre et message requis" }, { status: 400 });
  }

  const bodyHtml = html
    .split(/(\{\{image:[^}]+\}\})/g)
    .map((part) => {
      const marker = part.match(/^\{\{image:([^}]+)\}\}$/);
      if (marker) return imageBlocks.get(marker[1] ?? "") ?? "";
      const text = part.trim();
      if (!text) return "";
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1a1a1a;">${escapeHtml(text).replaceAll("\n", "<br/>")}</p>`;
    })
    .join("");
  const unusedImages = [...imageBlocks.entries()].filter(([id]) => !html.includes(`{{image:${id}}}`));
  const htmlDocument = buildCampaignEmail(title, `${bodyHtml}${unusedImages.map(([, block]) => block).join("")}`);
  const text = [
    "Byound",
    title,
    html.replace(/\{\{image:([^}]+)\}\}/g, (_, id: string) => imageLinks.get(id) ?? ""),
    "https://www.byound.fr",
  ].join("\n\n");

  const expertId = body?.expertId?.trim() ?? "";
  const testSend = body?.test === true;
  let expertEmail = "";
  let recipients: string[] = [];

  if (expertId) {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const expert = await db.from("experts").select("id,email").eq("id", expertId).maybeSingle();
    expertEmail = String(expert.data?.email ?? "").trim().toLowerCase();
    if (expert.error || !expertEmail) {
      return NextResponse.json({ error: "Expert introuvable" }, { status: 404 });
    }
    const auth = await getServerClient();
    const user = auth ? (await auth.auth.getUser()).data.user : null;
    const staffEmail = user?.email?.trim().toLowerCase() ?? "";
    if (testSend) {
      if (!staffEmail) return NextResponse.json({ error: "Aucune adresse pour l'envoi test." }, { status: 400 });
      if (staffEmail === expertEmail) {
        return NextResponse.json({ error: "L'envoi test ne part pas vers l'expert." }, { status: 400 });
      }
      recipients = [staffEmail];
    } else {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recent = await db
        .from("expert_emails")
        .select("id", { count: "exact", head: true })
        .eq("expert_id", expertId)
        .gte("created_at", since);
      if (!recent.error && (recent.count ?? 0) >= 6) {
        return NextResponse.json({ error: "Trop d'envois pour cet expert cette heure." }, { status: 429 });
      }
      recipients = [expertEmail];
    }
  } else if (segment === "single") {
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

  let sent = 0;
  const errors: string[] = [];
  let resendId: string | undefined;

  for (const recipient of recipients) {
    const result = await sendEmail({
      to: recipient,
      subject,
      html: htmlDocument,
      text,
      replyTo: "contact@byound.fr",
      attachments,
      headers: { "List-Unsubscribe": "<mailto:contact@byound.fr>" },
      tags: expertId && !testSend ? { expert_email: expertId } : undefined,
    });
    if (result.success) {
      sent += 1;
      resendId = result.messageId;
    } else errors.push(result.error ?? "Erreur inconnue");
  }

  if (sent === 0) {
    return NextResponse.json(
      { error: errors[0] ?? "Envoi impossible", recipients: recipients.length },
      { status: 502 },
    );
  }

  const roleLabel =
    segment === "role" && body?.role ? formatCrmRoleLabel(body.role) : null;

  let history = false;
  if (expertId && !testSend && sent > 0) {
    const db = getServiceRoleClient();
    const auth = await getServerClient();
    const user = auth ? (await auth.auth.getUser()).data.user : null;
    const label = body?.templateLabel?.trim() || subject;
    if (db) {
      const inserted = await db.from("expert_emails").insert({
        expert_id: expertId,
        sender_user_id: user?.id ?? null,
        sender_email: user?.email ?? null,
        subject,
        html: htmlDocument,
        resend_id: resendId ?? null,
        status: "envoyé",
        template_label: body?.templateLabel?.trim() || null,
      });
      history = !inserted.error;
      const current = await db.from("experts").select("references").eq("id", expertId).maybeSingle();
      const references = Array.isArray(current.data?.references) ? [...current.data.references] : [];
      references.push({
        _type: "edge_review_note",
        action: "internal_note",
        message: `E-mail envoyé : ${label}`,
        at: new Date().toISOString(),
      });
      await db.from("experts").update({ references }).eq("id", expertId);
      revalidatePath(`/super/experts/${expertId}`);
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    total: recipients.length,
    segment: expertId ? "single" : segment,
    roleLabel,
    test: testSend,
    history,
    errors: errors.length > 0 ? errors : undefined,
  });
}
