import { NextRequest, NextResponse } from "next/server";

import {
  CFA_CHALLENGE_QUESTIONS,
  CFA_SPECIALIZATIONS,
  getCfaSpecializationLabel,
  type CfaApplicationStatus,
} from "@/lib/cfa-applications";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { cfaEmailTemplate } from "@/lib/cfa-emails";

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

  return NextResponse.json({ application: data });
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

  const { data, error } = await db
    .from("cfa_applications")
    .insert({
      status: "challenge",
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      age,
      education_level: educationLevel,
      specialization,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Une candidature active existe déjà avec cette adresse email." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const publicUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://edgebs.fr"
  ).replace(/\/$/, "");
  const resumeUrl = `${publicUrl}/ecole/candidater?resume=${encodeURIComponent(String(data.resume_token))}`;
  await Promise.all([
    sendCfaEmail({
      to: email,
      subject: "Votre profil Byound est créé",
      html: cfaEmailTemplate({
        eyebrow: "Votre candidature",
        title: "Votre profil est créé.",
        body: "<p>Vous pouvez reprendre votre challenge et suivre votre candidature à tout moment grâce à votre lien personnel.</p>",
        cta: { label: "Continuer ma candidature", href: resumeUrl },
      }),
    }),
    sendCfaEmail({
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

  return NextResponse.json({ application: data }, { status: 201 });
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
    nextStatus = "interview";
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
      [...requiredFields, "specialStatus"].map((field) => [field, clean(rawCerfa[field], 1000)]),
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
    patch.cerfa_data = cerfaData;
    patch.administrative_documents_submitted_at = new Date().toISOString();
  } else if (action === "financing" && current.status === "admitted") {
    const financingPath = clean(body.financingPath, 40);
    if (!["alternance", "byound_start"].includes(financingPath)) {
      return NextResponse.json({ error: "Choisissez une situation." }, { status: 400 });
    }
    patch.financing_path = financingPath;
    patch.alternance_status = financingPath === "alternance" ? "company_found" : "searching";
    patch.career_center_activated_at = new Date().toISOString();
  } else {
    return NextResponse.json(
      { error: "Cette étape n’est pas disponible pour cette candidature." },
      { status: 409 },
    );
  }

  patch.status = nextStatus;
  const { data, error } = await db
    .from("cfa_applications")
    .update(patch)
    .eq("id", current.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

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
            href: `${(process.env.NEXT_PUBLIC_APP_URL || "https://edgebs.fr").replace(/\/$/, "")}/super/crm/cfa`,
          },
        }),
      }),
    ]);
  }

  return NextResponse.json({ application: data });
}
