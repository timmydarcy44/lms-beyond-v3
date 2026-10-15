import { NextRequest, NextResponse } from "next/server";

import { CFA_APPLICATION_STATUSES } from "@/lib/cfa-applications";
import { loadCfaApplicationBoard } from "@/lib/cfa/load-cfa-crm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { cfaEmailTemplate } from "@/lib/cfa-emails";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendCandidateEmail(payload: Record<string, unknown>): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL?.trim() || "Byound <noreply@edgebs.fr>",
        ...payload,
      }),
    });
    if (!response.ok) {
      console.error("[CFA email]", response.status, await response.text());
    }
    return response.ok;
  } catch (error) {
    console.error("[CFA email]", error);
    return false;
  }
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const board = await loadCfaApplicationBoard(db);
  if ("error" in board && board.error) return NextResponse.json({ error: board.error }, { status: 400 });
  return NextResponse.json(board);
}

export async function PATCH(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = String(body?.id ?? "").trim();
  const status = String(body?.status ?? "").trim();
  if (
    !id ||
    !CFA_APPLICATION_STATUSES.includes(
      status as (typeof CFA_APPLICATION_STATUSES)[number],
    )
  ) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  if (status === "admitted") {
    const { data: eligibility } = await db
      .from("cfa_applications")
      .select("administrative_documents_submitted_at")
      .eq("id", id)
      .maybeSingle();
    if (!eligibility?.administrative_documents_submitted_at) {
      return NextResponse.json(
        {
          error:
            "Les informations administratives et les justificatifs doivent être déposés avant l’admission. Le paiement des frais peut être encaissé ensuite, y compris par chèque.",
        },
        { status: 409 },
      );
    }
  }

  const patch: Record<string, unknown> = { status };
  const interviewScheduled = body?.interviewAt !== undefined && Boolean(body.interviewAt);
  if (body?.interviewAt !== undefined) {
    const interviewAt = body.interviewAt ? new Date(String(body.interviewAt)) : null;
    if (interviewAt && Number.isNaN(interviewAt.getTime())) {
      return NextResponse.json({ error: "Date d’entretien invalide" }, { status: 400 });
    }
    patch.interview_at = interviewAt?.toISOString() ?? null;
  }
  if (body?.interviewNotes !== undefined) {
    patch.interview_notes = String(body.interviewNotes ?? "").trim() || null;
  }
  if (body?.decisionNotes !== undefined) {
    patch.admission_decision_notes = String(body.decisionNotes ?? "").trim() || null;
  }
  if (status === "admitted") patch.admitted_at = new Date().toISOString();

  const { data, error } = await db
    .from("cfa_applications")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let emailSent: boolean | undefined;

  if (status === "administrative" && data?.email) {
    const publicUrl = (
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://edgebs.fr"
    ).replace(/\/$/, "");
    const resumeUrl = `${publicUrl}/ecole/candidater?resume=${encodeURIComponent(String(data.resume_token))}`;
    emailSent = await sendCandidateEmail({
      to: String(data.email),
      subject: "Finalisez votre inscription Byound",
      html: cfaEmailTemplate({
        eyebrow: "Dernière étape",
        title: "Finalisez votre inscription.",
        body: `<p>Bonjour ${escapeHtml(data.first_name)},</p><p>Complétez les informations nécessaires au CERFA, puis déposez :</p><ul style="padding-left:20px;line-height:1.8"><li>votre pièce d’identité ;</li><li>votre attestation de droits à la Sécurité sociale ou votre carte Vitale ;</li><li>votre relevé de notes du bac, votre attestation de réussite ou votre dernier diplôme.</li></ul><p>Les frais d’inscription sont de <strong>250 €</strong>. Ils seront remboursés à la signature de votre contrat d’alternance, après validation de la période d’essai.</p>`,
        cta: { label: "Finaliser mon inscription", href: resumeUrl },
      }),
    });
  }

  if (interviewScheduled && data?.email && data.interview_at) {
    const appointment = new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    }).format(new Date(data.interview_at));
    const note = data.interview_notes
      ? `<div style="margin-top:24px;padding:18px;border-radius:16px;background:#f3f2ff"><strong>Message de l’équipe :</strong><br/>${escapeHtml(data.interview_notes).replaceAll("\n", "<br/>")}</div>`
      : "";
    emailSent = await sendCandidateEmail({
      to: String(data.email),
      subject: "Votre entretien d’admission Byound",
      html: cfaEmailTemplate({
        eyebrow: "Entretien d’admission",
        title: "Votre entretien est planifié.",
        body: `<p>Bonjour ${escapeHtml(data.first_name)},</p><p>Nous avons rendez-vous le <strong>${escapeHtml(appointment)}</strong>.</p>${note}<div style="margin-top:24px;padding:18px;border-radius:16px;background:#f7f7f8;line-height:1.7"><strong>Adresse</strong><br/>Byound School<br/>134 Rue Elise Déroche<br/>14760 - Bretteville sur Odon</div><p style="margin-top:28px">À très bientôt,<br>L’équipe Byound</p>`,
      }),
    });
  }

  if (status === "admitted" && data?.email) {
    const publicUrl = (
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://edgebs.fr"
    ).replace(/\/$/, "");
    const resumeUrl = `${publicUrl}/ecole/candidater?resume=${encodeURIComponent(String(data.resume_token))}`;
    emailSent = await sendCandidateEmail({
      to: String(data.email),
      subject: "Bienvenue chez Byound. Vous êtes admis.",
      html: cfaEmailTemplate({
        eyebrow: "Décision d’admission",
        title: "Bienvenue chez Byound.<br>Vous êtes admis.",
        body: `<p>Félicitations ${escapeHtml(data.first_name)}. Votre admission est confirmée.</p><p>Votre espace candidat contient désormais toutes vos prochaines étapes.</p>`,
        cta: { label: "Voir mes prochaines étapes", href: resumeUrl },
      }),
    });
  }

  return NextResponse.json({ application: data, emailSent });
}
