import { NextRequest, NextResponse } from "next/server";

import { loadCfaApplicationBoard } from "@/lib/cfa/load-cfa-crm";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { looksLikeTestCfaEmail } from "@/lib/cfa/admission-draft";
import { admitCfaApplication, recordCfaAudit } from "@/lib/cfa/admit-application";
import { findCfaPersonByEmail, recordCfaTouch, upsertCfaPerson } from "@/lib/cfa/upsert-cfa-person";
import {
  createManualApplicationSchema,
  markFeeSchema,
  parseInput,
  revealFieldSchema,
  reviewDocumentSchema,
  saveCerfaSchema,
  saveLeadSourceSchema,
  statusSchema,
} from "@/lib/cfa/fiche-input";
import { SENSITIVE_KEY_ERROR, mergeSealedCerfa, revealCerfaField } from "@/lib/cfa/sensitive";
import { cfaEmailTemplate } from "@/lib/cfa-emails";
import { publicAppUrl } from "@/lib/env";
import { syncCfaApplicationHandicapProfile } from "@/lib/handicap/sync";

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

function ageFromBirthDate(birthDate: string): number | null {
  const born = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  if (
    today.getMonth() < born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())
  ) {
    age -= 1;
  }
  if (!Number.isInteger(age) || age < 15 || age > 99) return null;
  return age;
}

/** Création manuelle d’un contact (Futurs candidats) ou d’un candidat (Admissions). */
export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = parseInput(createManualApplicationSchema, body, "Complétez le profil.");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.data;

  if (input.sourceChannel === "prescriber" && !input.prescriberType) {
    return NextResponse.json({ error: "Indiquez le type de prescripteur." }, { status: 400 });
  }
  if (input.sourceChannel === "jpo" && !input.sourceDetail?.trim()) {
    return NextResponse.json({ error: "Indiquez la JPO." }, { status: 400 });
  }
  if (input.sourceChannel === "direct_meeting" && !input.sourceDetail?.trim()) {
    return NextResponse.json({ error: "Indiquez le lieu de la rencontre." }, { status: 400 });
  }
  if (input.sourceChannel === "phone" && !input.sourceDetail?.trim()) {
    return NextResponse.json({ error: "Précisez si l’appel est entrant ou sortant." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const duplicate = await findCfaPersonByEmail(db, input.email);
  if (duplicate && duplicate.status !== "rejected") {
    const stage = duplicate.status === "prospect" ? "prospect" : "candidate";
    return NextResponse.json(
      {
        error: "Un dossier existe déjà avec cette adresse e-mail.",
        duplicate: true,
        application: duplicate,
        stage,
      },
      { status: 409 },
    );
  }

  const actor = await getServerClient();
  const actorUser = actor ? await actor.auth.getUser() : null;
  const actorId = actorUser?.data.user?.id ?? null;
  const extra: Record<string, unknown> = { challenge_answers: {} };
  if (input.birthDate) {
    extra.birth_date = input.birthDate;
    extra.age = ageFromBirthDate(input.birthDate);
  }
  if (input.educationLevel) extra.education_level = input.educationLevel;
  extra.lead_source =
    input.sourceChannel === "jpo"
      ? "jpo"
      : input.sourceChannel === "phone"
        ? "phone"
        : input.sourceChannel === "prescriber"
          ? "partner"
          : "other";

  const profile = await db.from("profiles").select("id").ilike("email", input.email).maybeSingle();
  const profileId = String((profile.data as { id?: string } | null)?.id ?? "").trim() || null;
  extra.profile_id = profileId;
  extra.origin = profileId ? "existing_account" : "direct";

  let result;
  try {
    result = await upsertCfaPerson(db, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      specialization: input.specialization,
      intendedStage: input.placement,
      candidateStatus: "profile",
      sourceFamily: "human",
      sourceChannel: input.sourceChannel,
      sourceDetail: input.sourceDetail,
      prescriberType: input.prescriberType,
      prescriberOrg: input.prescriberOrg,
      prescriberContact: input.prescriberContact,
      createdBy: actorId,
      contactConsent: true,
      touchType: input.placement === "prospect" ? "created" : "created",
      touchDetail: "Saisie manuelle",
      extra,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Création impossible" },
      { status: 400 },
    );
  }

  const data = result.person;
  await recordCfaAudit(db, {
    actorId,
    applicationId: String(data.id),
    action: "create_manual",
    oldValue: null,
    newValue: input.sourceChannel,
  });

  let emailSent = false;
  const canMail = looksLikeTestCfaEmail(input.email) || process.env.CFA_BLOCK_LIVE_MAILS !== "1";
  if (input.placement === "candidate" && input.notifyCandidate !== false && canMail) {
    const resumeUrl = `${publicAppUrl()}/ecole/candidater?resume=${encodeURIComponent(String(data.resume_token))}`;
    emailSent = await sendCandidateEmail({
      to: input.email,
      subject: "Votre dossier d’admission Byound School",
      html: cfaEmailTemplate({
        eyebrow: "Admission",
        title: "Votre dossier est ouvert.",
        body: `<p>Bonjour ${escapeHtml(input.firstName)},</p><p>L’équipe Byound School a ouvert votre dossier d’admission. Vous pouvez le consulter et compléter les prochaines étapes via votre lien personnel.</p>`,
        cta: { label: "Ouvrir mon dossier", href: resumeUrl },
      }),
    });
    if (emailSent) {
      await recordCfaTouch(db, { personId: String(data.id), type: "email_sent", detail: "Lien de dossier", createdBy: actorId });
    }
  }

  return NextResponse.json({ application: data, emailSent }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const action = body && typeof body === "object" && "action" in body ? String((body as { action?: unknown }).action ?? "") : "";
  const rawId =
    body && typeof body === "object" && "id" in body ? String((body as { id?: unknown }).id ?? "").trim() : "";

  if (action === "save_jury_scores" && rawId) {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const scores = (body as { scores?: Record<string, unknown> }).scores ?? {};
    const actor = await getServerClient();
    const actorUser = actor ? await actor.auth.getUser() : null;
    const payload = {
      ...scores,
      evaluatorId: actorUser?.data.user?.id ?? null,
      evaluatorName: actorUser?.data.user?.email ?? null,
      evaluatedAt: new Date().toISOString(),
    };
    const { error } = await db.from("cfa_applications").update({ jury_scores: payload }).eq("id", rawId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, jury_scores: payload });
  }

  if (action === "mark_interview_realized" && rawId) {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const realizedAt = new Date().toISOString();
    const { error } = await db
      .from("cfa_applications")
      .update({ interview_realized_at: realizedAt, status: "interview" })
      .eq("id", rawId);
    if (error && /interview_realized_at|schema cache/i.test(error.message)) {
      return NextResponse.json(
        { error: "Appliquez la migration interview_realized_at (20261119120000)." },
        { status: 400 },
      );
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, interview_realized_at: realizedAt });
  }

  const schema = action === "save_cerfa"
    ? saveCerfaSchema
    : action === "mark_fee"
      ? markFeeSchema
      : action === "audit_reveal"
        ? revealFieldSchema
        : action === "review_document"
          ? reviewDocumentSchema
          : action === "save_lead_source"
            ? saveLeadSourceSchema
            : action
              ? null
              : statusSchema;
  if (!schema) return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  const parsed = parseInput(schema, body, action ? "Requête invalide." : "Statut invalide.");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.data;
  const id = input.id;

  if ("action" in input && input.action === "save_lead_source") {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const { data: previous } = await db
      .from("cfa_applications")
      .select("lead_source")
      .eq("id", id)
      .maybeSingle();
    const { error } = await db
      .from("cfa_applications")
      .update({ lead_source: input.leadSource })
      .eq("id", id);
    if (error && /lead_source|schema cache/i.test(error.message)) {
      return NextResponse.json(
        { error: "Appliquez la migration lead_source (20261120180000)." },
        { status: 400 },
      );
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const actor = await getServerClient();
    const actorUser = actor ? await actor.auth.getUser() : null;
    await recordCfaAudit(db, {
      actorId: actorUser?.data.user?.id ?? null,
      applicationId: id,
      action: "lead_source",
      oldValue: String((previous as { lead_source?: string | null } | null)?.lead_source ?? ""),
      newValue: input.leadSource,
    });
    return NextResponse.json({ ok: true, lead_source: input.leadSource });
  }
  if (input.action === "save_cerfa") {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const { data: current } = await db
      .from("cfa_applications")
      .select("id, first_name, last_name, email, specialization, cerfa_data")
      .eq("id", id)
      .maybeSingle();
    const previous = (current?.cerfa_data ?? {}) as Record<string, string>;
    const merged = mergeSealedCerfa(previous, input.cerfa);
    const { error } = await db.from("cfa_applications").update({ cerfa_data: merged.cerfa }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (merged.refused.length) return NextResponse.json({ error: SENSITIVE_KEY_ERROR }, { status: 400 });
    if (current) {
      await syncCfaApplicationHandicapProfile(db, {
        id: String(current.id),
        first_name: current.first_name ? String(current.first_name) : null,
        last_name: current.last_name ? String(current.last_name) : null,
        email: current.email ? String(current.email) : null,
        specialization: current.specialization ? String(current.specialization) : null,
        cerfa_data: merged.cerfa,
      });
    }
    return NextResponse.json({ ok: true });
  }
  if (input.action === "mark_fee") {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const current = await db
      .from("cfa_applications")
      .select("cerfa_data, financing_path")
      .eq("id", id)
      .maybeSingle();
    const financing = String(current.data?.financing_path ?? "alternance");
    if (financing === "alternance") {
      return NextResponse.json(
        {
          error:
            "Frais d’inscription désactivés pour l’apprentissage tant que la validation métier n’est pas faite.",
        },
        { status: 409 },
      );
    }
    const feeSettings = await db
      .from("admission_fee_settings")
      .select("fees_applicable")
      .eq("financing_path", financing)
      .maybeSingle();
    if (feeSettings.data && feeSettings.data.fees_applicable === false) {
      return NextResponse.json(
        { error: "Frais d’inscription non applicables pour ce parcours." },
        { status: 409 },
      );
    }
    const method = input.method;
    const cerfa = { ...((current.data?.cerfa_data ?? {}) as Record<string, string>), _fee_method: method };
    const { error } = await db
      .from("cfa_applications")
      .update({ registration_fee_paid_at: new Date().toISOString(), cerfa_data: cerfa })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (input.action === "audit_reveal") {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const field = input.field;
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
  if (input.action === "review_document") {
    const db = getServiceRoleClient();
    if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    const kind = input.kind;
    const review = input.review;
    const current = await db.from("cfa_applications").select("private_files").eq("id", id).maybeSingle();
    const files = { ...((current.data?.private_files ?? {}) as Record<string, Record<string, unknown>>) };
    files[kind] = {
      ...(files[kind] ?? {}),
      review_status: review,
      review_note: review === "refused" ? String(input.note ?? "").trim().slice(0, 400) : null,
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
  if (input.action) return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  const status = input.status;

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  let previous = await db
    .from("cfa_applications")
    .select("status, interview_realized_at, interview_at")
    .eq("id", id)
    .maybeSingle();
  if (previous.error && /interview_realized_at|schema cache/i.test(previous.error.message)) {
    previous = await db.from("cfa_applications").select("status, interview_at").eq("id", id).maybeSingle();
  }
  const previousStatus = String((previous.data as { status?: string } | null)?.status ?? "");
  const interviewRealizedAt = (previous.data as { interview_realized_at?: string | null } | null)
    ?.interview_realized_at;
  const interviewRealizedColumnReady = !previous.error;

  if (status === "review" && interviewRealizedColumnReady && !interviewRealizedAt) {
    return NextResponse.json(
      {
        error:
          "Passez d’abord l’entretien en « réalisé » avant l’étape Décision.",
      },
      { status: 409 },
    );
  }

  if (status === "contract") {
    if (previousStatus !== "admitted" && previousStatus !== "contract") {
      return NextResponse.json({ error: "Passez d'abord au statut Admis." }, { status: 400 });
    }
    const placement = await db
      .from("apprentice_placements")
      .select("id, tutor_id")
      .eq("apprentice_id", id)
      .eq("status", "active")
      .maybeSingle();
    if (placement.error && /apprentice_placements|schema cache/i.test(placement.error.message)) {
      return NextResponse.json({ error: "Appliquez d'abord la migration des placements." }, { status: 400 });
    }
    const placed = placement.data as { tutor_id?: string | null } | null;
    if (!placed?.tutor_id) {
      return NextResponse.json({ error: "Rattachez d'abord une entreprise et un tuteur." }, { status: 400 });
    }
  }

  if (status === "admitted") {
    const { data: eligibility } = await db
      .from("cfa_applications")
      .select("administrative_documents_submitted_at")
      .eq("id", id)
      .maybeSingle();
    const docsReady = Boolean(eligibility?.administrative_documents_submitted_at);
    const forceAdmit = "forceAdmit" in input && input.forceAdmit === true;
    if (!docsReady && !forceAdmit) {
      return NextResponse.json(
        {
          error:
            "Les informations administratives et les justificatifs ne sont pas encore déposés. Confirmez l’admission forcée si vous voulez créer le compte maintenant.",
          needsForceAdmit: true,
        },
        { status: 409 },
      );
    }
  }

  const patch: Record<string, unknown> = { status };
  const interviewScheduled = input.interviewAt !== undefined && Boolean(input.interviewAt);
  if (input.interviewAt !== undefined) {
    patch.interview_at = input.interviewAt ? new Date(input.interviewAt).toISOString() : null;
  }
  if (input.interviewNotes !== undefined) {
    patch.interview_notes = input.interviewNotes.trim() || null;
  }
  if (input.decisionNotes !== undefined) {
    patch.admission_decision_notes = input.decisionNotes.trim() || null;
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
        body: `<p>Bonjour ${escapeHtml(data.first_name)},</p><p>Votre candidature est acceptée. Finalisez votre inscription en complétant les éléments manquants (numéro de sécurité sociale, état civil, adresse…) puis en déposant :</p><ul style="padding-left:20px;line-height:1.8"><li>votre pièce d’identité ;</li><li>votre attestation de droits à la Sécurité sociale ou votre carte Vitale ;</li><li>votre relevé de notes du bac, votre attestation de réussite ou votre dernier diplôme.</li></ul><p>Les frais d’inscription sont de <strong>250 €</strong>. Ils seront remboursés à la signature de votre contrat d’alternance, après validation de la période d’essai.</p>`,
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

export async function DELETE(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const url = new URL(request.url);
  let id = url.searchParams.get("id")?.trim() ?? "";
  if (!id) {
    const body = await request.json().catch(() => null);
    id = body && typeof body === "object" && "id" in body ? String((body as { id?: unknown }).id ?? "").trim() : "";
  }
  if (!id) return NextResponse.json({ error: "Dossier manquant." }, { status: 400 });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const existing = await db
    .from("cfa_applications")
    .select("id, email, first_name, last_name")
    .eq("id", id)
    .maybeSingle();
  if (!existing.data) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  const actor = await getServerClient();
  const actorUser = actor ? await actor.auth.getUser() : null;
  await recordCfaAudit(db, {
    actorId: actorUser?.data.user?.id ?? null,
    applicationId: id,
    action: "delete_application",
    oldValue: String(existing.data.email ?? ""),
    newValue: `${existing.data.first_name ?? ""} ${existing.data.last_name ?? ""}`.trim(),
  });
  await db.from("cfa_audit_events").delete().eq("application_id", id);

  const { error } = await db.from("cfa_applications").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
