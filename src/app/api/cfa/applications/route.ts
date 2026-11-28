import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  CFA_CHALLENGE_QUESTIONS,
  CFA_SPECIALIZATIONS,
  getCfaSpecializationLabel,
  type CfaApplicationStatus,
} from "@/lib/cfa-applications";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { cfaEmailTemplate } from "@/lib/cfa-emails";
import { cfaCandidaterUrl } from "@/lib/cfa/dossier-url";
import { publicAppUrl } from "@/lib/env";
import { sendAccessCode } from "@/lib/cfa/access-code";
import { grantCfaAssessmentShares } from "@/lib/cfa/assessment-shares";
import { SENSITIVE_KEY_ERROR, mergeSealedCerfa, presentCerfa } from "@/lib/cfa/sensitive";
import { getSession } from "@/lib/auth/session";
import { looksLikeTestCfaEmail } from "@/lib/cfa/admission-draft";
import { isCfaLeadSource } from "@/lib/cfa/lead-sources";
import { recordCfaTouch, upsertCfaPerson } from "@/lib/cfa/upsert-cfa-person";
import { parseUtmAttribution } from "@/lib/cfa/utm-attribution";
import { ensureDisabilityAccommodationRequest } from "@/lib/handicap/create-request";
import { syncCfaApplicationHandicapProfile } from "@/lib/handicap/sync";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CFA_ADMIN_EMAIL = "timmydarcy44@gmail.com";

function clean(value: unknown, max = 4000): string {
  return String(value ?? "").trim().slice(0, max);
}

function isSpecialization(value: string) {
  return CFA_SPECIALIZATIONS.some((item) => item.value === value);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendCfaEmail(payload: Record<string, unknown>): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
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

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "Lien de candidature invalide." }, { status: 400 });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data, error } = await db
    .from("cfa_applications")
    .select("*")
    .eq("resume_token", token)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  if (request.nextUrl.searchParams.get("from") === "mail") {
    const already = await db
      .from("cfa_person_touches")
      .select("id")
      .eq("person_id", data.id)
      .eq("type", "email_opened")
      .gte("created_at", dayStart.toISOString())
      .limit(1);
    if (!already.data?.length) {
      await recordCfaTouch(db, {
        personId: String(data.id),
        type: "email_opened",
        detail: "Clic sur le lien du mail",
      });
    }
  }

  return NextResponse.json({
    application: { ...data, cerfa_data: presentCerfa((data.cerfa_data ?? {}) as Record<string, string>, "owner") },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const firstName = clean(body.firstName, 100);
  const lastName = clean(body.lastName, 100);
  const email = clean(body.email, 240).toLowerCase();
  const phone = clean(body.phone, 40);
  const educationLevel = clean(body.educationLevel, 160);
  const specialization = clean(body.specialization, 60);
  const age = Number(body.age);

  if (
    !firstName ||
    !lastName ||
    !EMAIL_RE.test(email) ||
    !Number.isInteger(age) ||
    age < 15 ||
    age > 99 ||
    !educationLevel ||
    !isSpecialization(specialization)
  ) {
    return NextResponse.json(
      { error: "Complétez tous les champs du profil avec des informations valides." },
      { status: 400 },
    );
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const session = await getSession();
  const withCv = await db.from("profiles").select("id, cv_url").ilike("email", email).maybeSingle();
  const existingProfile = withCv.error
    ? await db.from("profiles").select("id").ilike("email", email).maybeSingle()
    : withCv;
  const matched = existingProfile.data as { id?: string; cv_url?: string | null } | null;
  const emailMatchesSession = Boolean(session?.id && session.email?.toLowerCase() === email);
  const profileId = String(matched?.id ?? "").trim() || (emailMatchesSession ? session!.id : "");
  const canShare = Boolean(session?.id && session.id === profileId);
  const origin = profileId ? "existing_account" : "direct";
  const cvPath = canShare ? String(matched?.cv_url ?? "").trim() || null : null;
  const leadSourceRaw = clean(body.leadSource, 40).toLowerCase();
  const leadSource = isCfaLeadSource(leadSourceRaw) ? leadSourceRaw : "website";
  const cookieStore = await cookies();
  let utm = parseUtmAttribution(body.utm);
  if (!utm) {
    try {
      utm = parseUtmAttribution(JSON.parse(cookieStore.get("byound_school_utm")?.value || "null"));
    } catch {
      utm = null;
    }
  }

  let data: Record<string, unknown> | null = null;
  let error: { message: string; code?: string } | null = null;
  try {
    const upserted = await upsertCfaPerson(db, {
      firstName,
      lastName,
      email,
      phone,
      specialization,
      intendedStage: "candidate",
      candidateStatus: "challenge",
      sourceFamily: "web",
      sourceChannel: "web_preregistration",
      utm,
      contactConsent: true,
      touchType: "preregistration",
      touchDetail: "Pré-inscription site",
      extra: {
        age,
        education_level: educationLevel,
        profile_id: profileId || null,
        origin,
        cv_path: cvPath,
        lead_source: leadSource,
      },
    });
    data = upserted.person;
  } catch (cause) {
    error = { message: cause instanceof Error ? cause.message : "Création impossible" };
  }
  const birthDate = clean(body.birthDate, 12);
  if (!error && data?.id && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    await db.from("cfa_applications").update({ birth_date: birthDate }).eq("id", data.id);
  }

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Une candidature active existe déjà avec cette adresse email." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) return NextResponse.json({ error: "Création impossible." }, { status: 400 });

  const publicUrl = publicAppUrl();
  const resumeUrl = cfaCandidaterUrl(String(data.resume_token ?? ""));
  const allowMail = looksLikeTestCfaEmail(email) || process.env.CFA_BLOCK_LIVE_MAILS !== "1";
  if (canShare && profileId && body.shareTests && typeof body.shareTests === "object") {
    const requested = body.shareTests as Record<string, unknown>;
    await grantCfaAssessmentShares(db, profileId, {
      disc: requested.disc === true,
      idmc: requested.idmc === true,
      soft: requested.soft === true,
    });
  }
  if (profileId) {
    await sendAccessCode(db, {
      email,
      role: "apprenant",
      context: "application_linked",
      firstName,
      lastName,
    });
  }
  await Promise.all([
    profileId || !allowMail
      ? Promise.resolve(true)
      : sendCfaEmail({
          to: email,
          subject: "Votre profil Byound est créé",
          html: cfaEmailTemplate({
            eyebrow: "Votre candidature",
            title: "Votre profil est créé.",
            body: "<p>Vous pouvez reprendre votre challenge et suivre votre candidature à tout moment grâce à votre lien personnel.</p>",
            cta: { label: "Continuer ma candidature", href: resumeUrl },
          }),
        }),
    looksLikeTestCfaEmail(email)
      ? Promise.resolve(true)
      : sendCfaEmail({
          to: CFA_ADMIN_EMAIL,
          reply_to: email,
          subject: `[CFA] Nouveau profil — ${firstName} ${lastName}`,
          html: cfaEmailTemplate({
            eyebrow: "Nouvelle candidature CFA",
            title: `${escapeHtml(firstName)} ${escapeHtml(lastName)}`,
            body: `<p>Un nouveau profil candidat vient d’être créé.</p><p><strong>Spécialisation :</strong> ${escapeHtml(getCfaSpecializationLabel(specialization))}<br><strong>Email :</strong> ${escapeHtml(email)}</p>`,
            cta: { label: "Ouvrir le CRM CFA", href: `${publicUrl}/super/crm/cfa` },
          }),
        }),
  ]);

  return NextResponse.json({
    application: { ...data, cerfa_data: presentCerfa((data.cerfa_data ?? {}) as Record<string, string>, "owner") },
  }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const token = clean(body?.token, 100);
  const action = clean(body?.action, 40);
  if (!token || !action) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: current, error: currentError } = await db
    .from("cfa_applications")
    .select("*")
    .eq("resume_token", token)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 400 });
  if (!current) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });

  const patch: Record<string, unknown> = {};
  let nextStatus = current.status as CfaApplicationStatus;

  if (action === "challenge" && current.status === "challenge") {
    const rawAnswers =
      body.answers && typeof body.answers === "object"
        ? (body.answers as Record<string, unknown>)
        : {};
    const answers = Object.fromEntries(
      CFA_CHALLENGE_QUESTIONS.map((question) => [
        question.id,
        clean(rawAnswers[question.id], 3000),
      ]),
    );
    if (Object.values(answers).some((answer) => answer.length < 20)) {
      return NextResponse.json(
        { error: "Développez chaque réponse en quelques phrases avant de continuer." },
        { status: 400 },
      );
    }
    patch.challenge_answers = answers;
    patch.challenge_completed_at = new Date().toISOString();
    nextStatus = "dossier";
  } else if (action === "dossier" && current.status === "dossier") {
    const schoolBackground = clean(body.schoolBackground, 6000);
    const experiences = clean(body.experiences, 6000);
    const motivationText = clean(body.motivationText, 6000);
    const motivationMediaUrl = clean(body.motivationMediaUrl, 1000);
    const alternanceStatus = clean(body.alternanceStatus, 40);
    if (
      !schoolBackground ||
      (!motivationText && !motivationMediaUrl) ||
      !["company_found", "searching"].includes(alternanceStatus)
    ) {
      return NextResponse.json(
        { error: "Complétez votre parcours, votre motivation et votre situation d’alternance." },
        { status: 400 },
      );
    }
    patch.school_background = schoolBackground;
    patch.experiences = experiences || null;
    patch.motivation_text = motivationText || null;
    patch.motivation_media_url = motivationMediaUrl || null;
    patch.alternance_status = alternanceStatus;
    patch.share_with_companies = Boolean(body.shareWithCompanies);
    if (body.shareWithCompanies) patch.share_with_companies_at = new Date().toISOString();
    nextStatus = "interview";
  } else if (action === "share_companies") {
    patch.share_with_companies = Boolean(body.shareWithCompanies);
    patch.share_with_companies_at = body.shareWithCompanies ? new Date().toISOString() : null;
    nextStatus = current.status;
  } else if (action === "administrative" && current.status === "administrative") {
    const rawCerfa =
      body.cerfaData && typeof body.cerfaData === "object"
        ? (body.cerfaData as Record<string, unknown>)
        : {};
    const requiredFields = [
      "lastName",
      "firstNames",
      "sex",
      "birthDate",
      "birthCity",
      "birthDepartment",
      "nationality",
      "address",
      "phone",
      "email",
      "socialSecurityNumber",
      "priorSituation",
      "lastClass",
      "highestDiploma",
      "rqth",
      "highLevelAthlete",
    ];
    const cerfaData = Object.fromEntries(
      [
        ...requiredFields,
        "specialStatus",
        "accommodationNeeded",
        "accommodationNeeds",
      ].map((field) => [field, clean(rawCerfa[field], 1000)]),
    );
    const documents = (current.administrative_documents ?? {}) as Record<string, string>;
    if (
      requiredFields.some((field) => !cerfaData[field]) ||
      ["identity", "social_security", "diploma"].some((kind) => !documents[kind])
    ) {
      return NextResponse.json(
        { error: "Complétez les informations CERFA et ajoutez les trois justificatifs." },
        { status: 400 },
      );
    }
    const mergedCerfa = mergeSealedCerfa((current.cerfa_data ?? {}) as Record<string, string>, cerfaData);
    if (mergedCerfa.refused.length) {
      return NextResponse.json({ error: SENSITIVE_KEY_ERROR }, { status: 400 });
    }
    patch.cerfa_data = mergedCerfa.cerfa;
    patch.administrative_documents_submitted_at = new Date().toISOString();
  } else if (action === "financing" && current.status === "admitted") {
    const financingPath = clean(body.financingPath, 40);
    if (!["alternance", "byound_start"].includes(financingPath)) {
      return NextResponse.json({ error: "Choisissez une situation." }, { status: 400 });
    }
    patch.financing_path = financingPath;
    patch.alternance_status = financingPath === "alternance" ? "company_found" : "searching";
    patch.career_center_activated_at = new Date().toISOString();
  } else if (
    (action === "save_draft_v2" || action === "submit_v2" || action === "continue_later") &&
    (current.status === "challenge" || current.status === "dossier")
  ) {
    const { applyAdmissionDraftPatch, finalizeAdmissionSubmit, sendContinueLaterEmail } = await import(
      "@/lib/cfa/admission-draft"
    );
    const draftResult = await applyAdmissionDraftPatch(db, current, body);
    if (!draftResult.ok) {
      return NextResponse.json({ error: draftResult.error }, { status: draftResult.status });
    }
    Object.assign(patch, draftResult.patch);
    nextStatus = current.status as CfaApplicationStatus;

    if (action === "submit_v2") {
      const finalize = await finalizeAdmissionSubmit(db, {
        ...current,
        ...draftResult.patch,
      }, body);
      if (!finalize.ok) {
        return NextResponse.json({ error: finalize.error }, { status: finalize.status });
      }
      Object.assign(patch, finalize.patch);
      nextStatus = "interview";
    }

    if (action === "continue_later") {
      await sendContinueLaterEmail({
        email: String(current.email),
        firstName: String(current.first_name),
        resumeToken: token,
        isTest: looksLikeTestCfaEmail(String(current.email)),
      });
    }
  } else if (
    action === "change_specialization" &&
    (current.status === "challenge" || current.status === "dossier")
  ) {
    const specialization = clean(body.specialization, 60);
    if (!isSpecialization(specialization)) {
      return NextResponse.json({ error: "Spécialisation invalide." }, { status: 400 });
    }
    const previous = String(current.specialization);
    if (previous !== specialization) {
      const challengeV2 = (current.challenge_v2 ?? {}) as Record<string, unknown>;
      const responses = Array.isArray(challengeV2.responses) ? challengeV2.responses : [];
      const hidden = {
        ...((challengeV2.hiddenBySpecializationChange as Record<string, unknown>) ?? {}),
        [previous]: responses,
      };
      patch.specialization = specialization;
      patch.challenge_v2 = {
        ...challengeV2,
        responses: [],
        hiddenBySpecializationChange: hidden,
      };
    }
    nextStatus = current.status;
  } else {
    return NextResponse.json(
      { error: "Cette étape n’est pas disponible pour cette candidature." },
      { status: 409 },
    );
  }

  patch.status = nextStatus;
  let { data, error } = await db
    .from("cfa_applications")
    .update(patch)
    .eq("id", current.id)
    .select("*")
    .single();

  if (error && /share_with_companies/i.test(error.message)) {
    delete patch.share_with_companies;
    delete patch.share_with_companies_at;
    const retry = await db.from("cfa_applications").update(patch).eq("id", current.id).select("*").single();
    data = retry.data;
    error = retry.error;
  }
  if (error && /challenge_v2|parcours|prerequisites_flag|jury_scores|schema cache/i.test(error.message)) {
    delete patch.challenge_v2;
    delete patch.parcours;
    delete patch.prerequisites_flag;
    delete patch.jury_scores;
    const retry = await db.from("cfa_applications").update(patch).eq("id", current.id).select("*").single();
    data = retry.data;
    error = retry.error;
  }
  if (error || !data) return NextResponse.json({ error: error?.message || "Enregistrement impossible" }, { status: 400 });

  if (action === "administrative" && data.cerfa_data) {
    const cerfa = (data.cerfa_data ?? {}) as Record<string, string>;
    await syncCfaApplicationHandicapProfile(db, {
      id: String(data.id),
      first_name: data.first_name ? String(data.first_name) : null,
      last_name: data.last_name ? String(data.last_name) : null,
      email: data.email ? String(data.email) : null,
      specialization: data.specialization ? String(data.specialization) : null,
      cerfa_data: cerfa,
    });
    const accommodationNeeded =
      String(cerfa.accommodationNeeded ?? "").trim() === "1" ||
      String(cerfa.accommodationNeeded ?? "").toLowerCase() === "oui";
    if (accommodationNeeded) {
      await ensureDisabilityAccommodationRequest(db, {
        scope: "school",
        cfaApplicationId: String(data.id),
        needsText: String(cerfa.accommodationNeeds ?? "").trim() || null,
        personEmail: data.email ? String(data.email) : null,
      });
    }
  }

  if (action === "dossier") {
    const challengeSummary = CFA_CHALLENGE_QUESTIONS.map((question) => {
      const answer = data.challenge_answers?.[question.id];
      return `<p><strong>${escapeHtml(question.eyebrow)} — ${escapeHtml(question.question)}</strong><br/>${escapeHtml(answer || "—")}</p>`;
    }).join("");

    await Promise.all([
      sendCfaEmail({
        to: String(data.email),
        subject: "Votre dossier Byound est complet",
        html: cfaEmailTemplate({
          eyebrow: "Dossier reçu",
          title: "Votre dossier est bien enregistré.",
          body: "<p>Un membre du comité de projet vous contactera dans les plus brefs délais afin d’organiser votre entretien d’admission.</p><p>À très bientôt,<br>L’équipe Byound</p>",
        }),
      }),
      sendCfaEmail({
        to: CFA_ADMIN_EMAIL,
        reply_to: String(data.email),
        subject: `[CFA] Dossier complet — ${data.first_name} ${data.last_name}`,
        html: cfaEmailTemplate({
          eyebrow: "Dossier CFA complet",
          title: `${escapeHtml(data.first_name)} ${escapeHtml(data.last_name)}`,
          body: `<p>${escapeHtml(data.email)} · ${escapeHtml(data.phone || "Téléphone non renseigné")}<br>Âge : ${escapeHtml(data.age)} · Niveau : ${escapeHtml(data.education_level)}<br>Spécialisation : ${escapeHtml(getCfaSpecializationLabel(data.specialization))}<br>Alternance : ${data.alternance_status === "company_found" ? "Entreprise trouvée" : "En recherche"}</p><h2 style="font-size:18px">Parcours scolaire</h2><p>${escapeHtml(data.school_background)}</p><h2 style="font-size:18px">Expériences</h2><p>${escapeHtml(data.experiences || "—")}</p><h2 style="font-size:18px">Pourquoi Byound ?</h2><p>${escapeHtml(data.motivation_text || "Voir le média joint au dossier")}</p><h2 style="font-size:18px">Byound Challenge</h2>${challengeSummary}`,
          cta: {
            label: "Ouvrir le dossier",
            href: `${publicAppUrl()}/super/crm/cfa`,
          },
        }),
      }),
    ]);
  }

  return NextResponse.json({
    application: { ...data, cerfa_data: presentCerfa((data.cerfa_data ?? {}) as Record<string, string>, "owner") },
  });
}
