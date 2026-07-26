import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { assertJessicaAdmin } from "@/lib/jessica-contentin/assert-jessica-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendJessicaResendEmail } from "@/lib/jessica-contentin/jessica-resend";
import { resolveJessicaQuestionnaire } from "@/lib/queries/jessica-questionnaires";

function publicBaseUrl(req: NextRequest): string {
  const env =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_URL?.trim() ||
    "";
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return "https://edgebs.fr";
}

type Body = {
  questionnaireSlug?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  cabinetPatientId?: string | null;
  profileId?: string | null;
  /** Si true : crée le lien sans envoyer d'email */
  linkOnly?: boolean;
};

export async function POST(req: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Body | null;
  const slug = body?.questionnaireSlug?.trim() ?? "";
  const email = body?.email?.trim().toLowerCase() ?? "";
  if (!slug) return NextResponse.json({ error: "Questionnaire requis" }, { status: 400 });
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Email destinataire requis" }, { status: 400 });
  }

  const def = await resolveJessicaQuestionnaire(slug);
  if (!def) return NextResponse.json({ error: "Questionnaire introuvable" }, { status: 404 });

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponible" }, { status: 500 });

  const token = randomBytes(18).toString("base64url");
  const questionnaireId = "id" in def ? (def as { id?: string }).id : null;

  const { data: invite, error } = await supabase
    .from("jessica_questionnaire_invites")
    .insert({
      token,
      questionnaire_slug: slug,
      questionnaire_id: questionnaireId ?? null,
      recipient_email: email,
      recipient_first_name: body?.firstName?.trim() || null,
      recipient_last_name: body?.lastName?.trim() || null,
      cabinet_patient_id: body?.cabinetPatientId || null,
      profile_id: body?.profileId || null,
      created_by: user.id,
      sent_at: body?.linkOnly ? null : new Date().toISOString(),
    })
    .select("id, token")
    .single();

  if (error) {
    console.error("[jessica-questionnaires/send]", error);
    const hint =
      error.message.includes("does not exist") || error.message.includes("schema cache")
        ? " Table d’invitations absente — exécutez la migration invites sur le projet LMS (zmcefidiiqqppowymoqb), pas Nevo."
        : "";
    return NextResponse.json({ error: error.message + hint }, { status: 500 });
  }

  const link = `${publicBaseUrl(req)}/q/${encodeURIComponent(slug)}/t/${invite.token}`;

  if (body?.linkOnly) {
    return NextResponse.json({ ok: true, link, token: invite.token, inviteId: invite.id });
  }

  const first = body?.firstName?.trim();
  const greeting = first ? `Bonjour ${first},` : "Bonjour,";
  const html = `
    <div style="font-family:Georgia,serif;color:#2F2A25;max-width:560px;margin:0 auto;">
      <p style="margin:0 0 16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;line-height:1.6;">
        Jessica CONTENTIN vous invite à répondre au questionnaire suivant&nbsp;:
        <strong>${escapeHtml(def.title)}</strong>.
      </p>
      <p style="margin:24px 0;">
        <a href="${escapeHtml(link)}"
           style="display:inline-block;background:#8B6F47;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px;">
          Ouvrir le questionnaire
        </a>
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:#8B6F47;">Jessica CONTENTIN — Psychopédagogue</p>
    </div>
  `;

  const result = await sendJessicaResendEmail({
    to: email,
    subject: `Questionnaire — ${def.title}`,
    html,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Envoi email impossible", link, inviteId: invite.id },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    link,
    token: invite.token,
    inviteId: invite.id,
    messageId: result.messageId,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
