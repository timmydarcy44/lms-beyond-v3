import { NextRequest, NextResponse } from "next/server";

import { CFA_APPLICATION_STATUSES } from "@/lib/cfa-applications";
import { loadCfaApplicationBoard } from "@/lib/cfa/load-cfa-crm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { admitCfaApplication, recordCfaAudit } from "@/lib/cfa/admit-application";
import { SENSITIVE_KEY_ERROR, mergeSealedCerfa, revealCerfaField } from "@/lib/cfa/sensitive";
import { cfaEmailTemplate } from "@/lib/cfa-emails";
import { publicAppUrl } from "@/lib/env";

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
        from: process.env.RESEND_FROM_EMAIL?.trim() || "Byound <noreply@byound.fr>",
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
  const board = await loadCfaApplicationBoard(db, "admin");
  if ("error" in board && board.error) return NextResponse.json({ error: board.error }, { status: 400 });
  return NextResponse.json(board);
}

export async function PATCH(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = String(body?.id ?? "").trim();
  if (body?.action === "save_cerfa") {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    if (!id || !body.cerfa || typeof body.cerfa !== "object") {
      return NextResponse.json({ error: "Dossier incomplet" }, { status: 400 });
    }
    const { data: current } = await db.from("cfa_applications").select("cerfa_data").eq("id", id).maybeSingle();
    const previous = (current?.cerfa_data ?? {}) as Record<string, string>;
    const merged = mergeSealedCerfa(previous, body.cerfa as Record<string, unknown>);
    const { error } = await db.from("cfa_applications").update({ cerfa_data: merged.cerfa }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (merged.refused.length) return NextResponse.json({ error: SENSITIVE_KEY_ERROR }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body?.action === "mark_fee") {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    if (!id) return NextResponse.json({ error: "Dossier incomplet" }, { status: 400 });
    const method = String(body.method ?? "");
    const methods = new Set(["cheque", "transfer", "card", "cash", "covered"]);
    if (!methods.has(method)) {
      return NextResponse.json({ error: "Choisissez un moyen de paiement." }, { status: 400 });
    }
    const current = await db.from("cfa_applications").select("cerfa_data").eq("id", id).maybeSingle();
    const cerfa = { ...((current.data?.cerfa_data ?? {}) as Record<string, string>), _fee_method: method };
    const { error } = await db
      .from("cfa_applications")
      .update({ registration_fee_paid_at: new Date().toISOString(), cerfa_data: cerfa })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body?.action === "audit_reveal") {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const field = String(body.field ?? "");
    if (!id || (field !== "socialSecurityNumber" && field !== "rqth")) {
      return NextResponse.json({ error: "Champ inconnu" }, { status: 400 });
    }
    const actor = await getServerClient();
    const actorUser = actor ? await actor.auth.getUser() : null;
    await recordCfaAudit(db, {
      actorId: actorUser?.data.user?.id ?? null,
      applicationId: id,
      action: field === "rqth" ? "reveal_rqth" : "reveal_nss",
    });
    const stored = await db.from("cfa_applications").select("cerfa_data").eq("id", id).maybeSingle();
    const value = revealCerfaField((stored.data?.cerfa_data ?? {}) as Record<string, string>, field);
    return NextResponse.json({ ok: true, value });
  }
  if (body?.action === "review_document") {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const kind = String(body.kind ?? "").trim();
    const review = String(body.review ?? "");
    if (!id || !kind || !["received", "validated", "refused"].includes(review)) {
      return NextResponse.json({ error: "Revue invalide" }, { status: 400 });
    }
    const current = await db.from("cfa_applications").select("private_files").eq("id", id).maybeSingle();
    const files = { ...((current.data?.private_files ?? {}) as Record<string, Record<string, unknown>>) };
    files[kind] = {
      ...(files[kind] ?? {}),
      review_status: review,
      review_note: review === "refused" ? String(body.note ?? "").trim().slice(0, 400) : null,
    };
    const { error } = await db.from("cfa_applications").update({ private_files: files }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const actor = await getServerClient();
    const actorUser = actor ? await actor.auth.getUser() : null;
    await recordCfaAudit(db, {
      actorId: actorUser?.data.user?.id ?? null,
      applicationId: id,
      action: "review_document",
      newValue: `${kind}:${review}`,
    });
    return NextResponse.json({ ok: true });
  }
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

  const previous = await db.from("cfa_applications").select("status").eq("id", id).maybeSingle();
  const previousStatus = String((previous.data as { status?: string } | null)?.status ?? "");

  if (status === "contract") {
    const placement = await db
      .from("apprentice_placements")
      .select("id, tutor_id")
      .eq("apprentice_id", id)
      .eq("status", "active")
      .maybeSingle();
    if (placement.error && /apprentice_placements|schema cache/i.test(placement.error.message)) {
      return NextResponse.json({ error: "Appliquez d'abord la migration des placements." }, { status: 409 });
    }
    const placed = placement.data as { tutor_id?: string | null } | null;
    if (!placed?.tutor_id) {
      return NextResponse.json({ error: "Rattachez d'abord une entreprise et un tuteur." }, { status: 409 });
    }
  }

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

  const actor = await getServerClient();
  const actorUser = actor ? await actor.auth.getUser() : null;
  if (previousStatus && previousStatus !== status) {
    await recordCfaAudit(db, {
      actorId: actorUser?.data.user?.id ?? null,
      applicationId: id,
      action: "status",
      oldValue: previousStatus,
      newValue: status,
    });
  }

  let emailSent: boolean | undefined;

  if (status === "admitted" && data) {
    const admitted = await admitCfaApplication(db, data);
    emailSent = admitted.ok;
    if (!admitted.ok) {
      return NextResponse.json({ application: data, emailSent: false, error: admitted.error }, { status: 502 });
    }
    await recordCfaAudit(db, {
      actorId: actorUser?.data.user?.id ?? null,
      applicationId: id,
      action: "account_link",
      oldValue: null,
      newValue: "admitted",
    });
  }

  if (status === "administrative" && data?.email) {
    const publicUrl = publicAppUrl();
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

  return NextResponse.json({ application: data, emailSent });
}
