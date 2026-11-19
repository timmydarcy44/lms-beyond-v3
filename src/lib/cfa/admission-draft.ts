import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DIPLOMAS_MEETING_BAC,
  isResponseComplete,
  usefulTextLength,
  type ChallengeResponse,
  type ChallengeV2State,
  type ParcoursState,
} from "@/lib/cfa/admission-challenge";
import { DELAI_DECISION, DELAI_REFERENTE_HANDICAP } from "@/lib/cfa/admission-delays";
import { cfaEmailTemplate } from "@/lib/cfa-emails";
import { getCfaSpecializationLabel } from "@/lib/cfa-applications";
import { publicAppUrl } from "@/lib/env";
import { ensureDisabilityAccommodationRequest } from "@/lib/handicap/create-request";
import { looksLikeTestAccount } from "@/lib/control/test-account";

function clean(value: unknown, max = 4000): string {
  return String(value ?? "").trim().slice(0, max);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function looksLikeTestCfaEmail(email: string): boolean {
  return looksLikeTestAccount({ email }) || /(?:\+test|test\+|@example\.com$)/i.test(email);
}

async function sendCfaEmail(payload: Record<string, unknown>, allow: boolean): Promise<boolean> {
  if (!allow) return false;
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
    return response.ok;
  } catch {
    return false;
  }
}

export async function applyAdmissionDraftPatch(
  _db: SupabaseClient,
  current: Record<string, unknown>,
  body: Record<string, unknown>,
): Promise<{ ok: true; patch: Record<string, unknown> } | { ok: false; error: string; status: number }> {
  const challengeRaw = body.challengeV2;
  const parcoursRaw = body.parcours;
  const alternanceStatus = clean(body.alternanceStatus, 40);
  const shareWithCompanies = Boolean(body.shareWithCompanies);

  const patch: Record<string, unknown> = {};

  if (challengeRaw && typeof challengeRaw === "object") {
    const challenge = challengeRaw as ChallengeV2State;
    const responses = Array.isArray(challenge.responses) ? challenge.responses : [];
    patch.challenge_v2 = {
      responses: responses.map((r) => ({
        questionId: clean(r.questionId, 80),
        versionId: clean(r.versionId, 80),
        slug: clean(r.slug, 80),
        label: clean(r.label, 120),
        prompt: clean(r.prompt, 2000),
        format: ["text", "audio", "video"].includes(String(r.format)) ? r.format : "text",
        text: clean(r.text, 800),
        mediaPath: clean(r.mediaPath, 500) || undefined,
        mediaDurationSec: Number(r.mediaDurationSec) || undefined,
        updatedAt: new Date().toISOString(),
      })),
      hiddenBySpecializationChange: challenge.hiddenBySpecializationChange ?? {},
    };
    // Miroir legacy soft : conserver challenge_answers texte pour anciens écrans
    const legacy: Record<string, string> = {
      ...((current.challenge_answers as Record<string, string>) ?? {}),
    };
    for (const r of (patch.challenge_v2 as ChallengeV2State).responses) {
      if (r.format === "text" && r.text) legacy[r.slug] = r.text;
    }
    patch.challenge_answers = legacy;
  }

  if (parcoursRaw && typeof parcoursRaw === "object") {
    const parcours = parcoursRaw as ParcoursState;
    patch.parcours = {
      diploma: clean(parcours.diploma, 40),
      diplomaYear: clean(parcours.diplomaYear, 4),
      school: clean(parcours.school, 200),
      situation: clean(parcours.situation, 40),
      experiences: Array.isArray(parcours.experiences) ? parcours.experiences.slice(0, 12) : [],
      experiencesDetail: clean(parcours.experiencesDetail, 500),
      companyName: clean(parcours.companyName, 160),
    };
    // Miroir legacy pour jury « ancien formulaire »
    const diplomaLabel = clean(parcours.diploma, 40);
    const year = clean(parcours.diplomaYear, 4);
    const school = clean(parcours.school, 200);
    patch.school_background = [diplomaLabel, year, school].filter(Boolean).join(" · ") || current.school_background;
    patch.experiences =
      Array.isArray(parcours.experiences) && parcours.experiences.length
        ? parcours.experiences.join(", ")
        : current.experiences;
  }

  if (["company_found", "searching", ""].includes(alternanceStatus)) {
    if (alternanceStatus) patch.alternance_status = alternanceStatus;
  }
  patch.share_with_companies = shareWithCompanies;
  if (shareWithCompanies) patch.share_with_companies_at = new Date().toISOString();

  const diploma = String((patch.parcours as ParcoursState | undefined)?.diploma ?? "");
  if (diploma && !DIPLOMAS_MEETING_BAC.includes(diploma as (typeof DIPLOMAS_MEETING_BAC)[number])) {
    patch.prerequisites_flag = "to_verify";
  } else if (diploma) {
    patch.prerequisites_flag = null;
  }

  return { ok: true, patch };
}

export async function finalizeAdmissionSubmit(
  db: SupabaseClient,
  current: Record<string, unknown>,
  body: Record<string, unknown>,
): Promise<{ ok: true; patch: Record<string, unknown> } | { ok: false; error: string; status: number }> {
  const challenge = (current.challenge_v2 ?? body.challengeV2 ?? {}) as ChallengeV2State;
  const responses = (challenge.responses ?? []) as ChallengeResponse[];
  if (responses.length < 3 || responses.some((r) => !isResponseComplete(r))) {
    return { ok: false, error: "Complète les trois questions avant d’envoyer.", status: 400 };
  }
  const parcours = (current.parcours ?? body.parcours ?? {}) as ParcoursState;
  if (!parcours.diploma || !parcours.situation) {
    return { ok: false, error: "Indique ton diplôme et ta situation.", status: 400 };
  }
  const alternance = clean(current.alternance_status ?? body.alternanceStatus, 40);
  if (!["company_found", "searching"].includes(alternance)) {
    return { ok: false, error: "Indique où tu en es avec l’entreprise.", status: 400 };
  }

  // Accessibilité — jamais dans cfa_applications
  const accessibility = (body.accessibility ?? {}) as Record<string, unknown>;
  const needsAccommodation =
    accessibility.needsAccommodation === true
      ? true
      : accessibility.needsAccommodation === false
        ? false
        : null;
  const rqthRaw = clean(accessibility.rqth, 20);
  const rqth = ["yes", "no", "prefer_not"].includes(rqthRaw) ? rqthRaw : null;
  const needsDetail = clean(accessibility.needsDetail, 2000);

  let disabilityCaseId: string | null = null;
  if (needsAccommodation === true || rqth === "yes") {
    const created = await ensureDisabilityAccommodationRequest(db, {
      scope: "school",
      cfaApplicationId: String(current.id),
      needsText: needsDetail || (rqth === "yes" ? "RQTH déclarée à l’admission" : null),
      personEmail: String(current.email),
    });
    disabilityCaseId = created?.caseId ?? null;

    const isTest = looksLikeTestCfaEmail(String(current.email));
    if (!isTest && current.email) {
      await sendCfaEmail(
        {
          to: String(current.email),
          subject: "Ta demande a bien été transmise à notre référente handicap",
          html: cfaEmailTemplate({
            eyebrow: "Accessibilité",
            title: "Ta demande est bien transmise.",
            body: `<p>Notre référente handicap te contactera sous ${escapeHtml(DELAI_REFERENTE_HANDICAP)}.</p>`,
          }),
        },
        true,
      );
    }
  }

  const accessUpsert = await db.from("admission_accessibility").upsert(
    {
      application_id: current.id,
      needs_accommodation: needsAccommodation,
      needs_detail: needsDetail || null,
      rqth,
      disability_case_id: disabilityCaseId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "application_id" },
  );
  if (accessUpsert.error) {
    console.error(
      "[admission] admission_accessibility missing or RLS — appliquer la migration 20261118160000",
      accessUpsert.error.message,
    );
  }

  const isTest = looksLikeTestCfaEmail(String(current.email));
  const publicUrl = publicAppUrl();
  await sendCfaEmail(
    {
      to: String(current.email),
      subject: "Candidature bien reçue",
      html: cfaEmailTemplate({
        eyebrow: "Candidature reçue",
        title: "Candidature bien reçue.",
        body: `<p>Filière : <strong>${escapeHtml(getCfaSpecializationLabel(String(current.specialization)))}</strong><br>Date : ${escapeHtml(new Date().toLocaleDateString("fr-FR"))}</p><p>On revient vers toi sous ${escapeHtml(DELAI_DECISION)} pour te proposer un entretien.</p>`,
      }),
    },
    !isTest,
  );

  await sendCfaEmail(
    {
      to: "timmydarcy44@gmail.com",
      reply_to: String(current.email),
      subject: `[CFA] Candidature v2 — ${current.first_name} ${current.last_name}`,
      html: cfaEmailTemplate({
        eyebrow: "Candidature Challenge + parcours",
        title: `${escapeHtml(current.first_name)} ${escapeHtml(current.last_name)}`,
        body: `<p>${escapeHtml(current.email)} · ${escapeHtml(getCfaSpecializationLabel(String(current.specialization)))}</p><p>Aucune donnée d’accessibilité dans cet e-mail.</p>`,
        cta: { label: "Ouvrir Admissions", href: `${publicUrl}/super/crm/cfa` },
      }),
    },
    true,
  );

  return {
    ok: true,
    patch: {
      challenge_completed_at: new Date().toISOString(),
      // Ne jamais écrire accessibilité ici
    },
  };
}

export async function sendContinueLaterEmail(input: {
  email: string;
  firstName: string;
  resumeToken: string;
  isTest: boolean;
}) {
  const resumeUrl = `${publicAppUrl()}/ecole/candidater?resume=${encodeURIComponent(input.resumeToken)}`;
  await sendCfaEmail(
    {
      to: input.email,
      subject: "Reprends ta candidature Byound School",
      html: cfaEmailTemplate({
        eyebrow: "Continuer plus tard",
        title: "On t’a envoyé un lien pour reprendre où tu en étais.",
        body: `<p>Bonjour ${escapeHtml(input.firstName)},</p><p>Ton lien de reprise est valable 30 jours.</p>`,
        cta: { label: "Reprendre ma candidature", href: resumeUrl },
      }),
    },
    !input.isTest,
  );
}

/** Exporte utile pour validation locale. */
export function draftTextOk(text: string) {
  return usefulTextLength(text) >= 20;
}
