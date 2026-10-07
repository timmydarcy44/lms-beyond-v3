import { NextRequest, NextResponse } from "next/server";

import {
  CFA_CHALLENGE_QUESTIONS,
  CFA_SPECIALIZATIONS,
  getCfaSpecializationLabel,
  type CfaApplicationStatus,
} from "@/lib/cfa-applications";
import { getServiceRoleClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      { error: "Complète tous les champs du profil avec des informations valides." },
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

  const notifyTo = process.env.CONTACT_EMAIL?.trim();
  const resendKey = process.env.RESEND_API_KEY;
  const publicUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://edgebs.fr"
  ).replace(/\/$/, "");
  const resumeUrl = `${publicUrl}/ecole/candidater?resume=${encodeURIComponent(String(data.resume_token))}`;
  if (notifyTo && resendKey) {
    void fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL?.trim() || "Byound <noreply@edgebs.fr>",
        to: notifyTo,
        reply_to: email,
        subject: `[CFA] Nouvelle candidature — ${firstName} ${lastName}`,
        html: `<p><strong>${firstName} ${lastName}</strong> vient de créer son profil candidat.</p><p>Spécialisation : ${specialization}<br>Email : ${email}</p>`,
      }),
    }).catch(() => null);
  }
  if (resendKey) {
    void fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL?.trim() || "Byound <noreply@edgebs.fr>",
        to: email,
        bcc: "timmydarcy44@gmail.com",
        subject: "Ton profil est créé",
        html: `<div style="background:#070b1f;color:#fff;padding:40px;font-family:Arial,sans-serif"><p style="color:#8c86ff;text-transform:uppercase;letter-spacing:.16em">Byound School</p><h1>Ton profil est créé.</h1><p>Tu peux reprendre ton challenge et suivre ta candidature à tout moment avec ce lien personnel.</p><p><a href="${resumeUrl}" style="display:inline-block;margin-top:16px;background:#fff;color:#070b1f;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:700">Continuer ma candidature</a></p></div>`,
      }),
    }).catch(() => null);
  }

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
        { error: "Développe chaque réponse en quelques phrases avant de continuer." },
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
        { error: "Complète ton parcours, ta motivation et ta situation d’alternance." },
        { status: 400 },
      );
    }
    patch.school_background = schoolBackground;
    patch.experiences = experiences || null;
    patch.motivation_text = motivationText || null;
    patch.motivation_media_url = motivationMediaUrl || null;
    patch.alternance_status = alternanceStatus;
    nextStatus = "interview";
  } else if (action === "financing" && current.status === "admitted") {
    const financingPath = clean(body.financingPath, 40);
    if (!["alternance", "byound_start"].includes(financingPath)) {
      return NextResponse.json({ error: "Choisis une situation." }, { status: 400 });
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

  if (action === "dossier" && process.env.RESEND_API_KEY) {
    const resendHeaders = {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    };
    const from = process.env.RESEND_FROM_EMAIL?.trim() || "Byound <noreply@edgebs.fr>";
    const challengeSummary = CFA_CHALLENGE_QUESTIONS.map((question) => {
      const answer = data.challenge_answers?.[question.id];
      return `<p><strong>${escapeHtml(question.eyebrow)} — ${escapeHtml(question.question)}</strong><br/>${escapeHtml(answer || "—")}</p>`;
    }).join("");

    void fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: resendHeaders,
      body: JSON.stringify({
        from,
        to: String(data.email),
        subject: "Ton dossier Byound est complet",
        html: `<div style="background:#070b1f;color:#fff;padding:40px;font-family:Arial,sans-serif"><p style="color:#8c86ff;text-transform:uppercase;letter-spacing:.16em">Byound School</p><h1>Ton dossier est bien enregistré.</h1><p>Un membre du comité de projet va te contacter dans les plus brefs délais afin d’organiser ton entretien d’admission.</p><p>À très vite,<br/>L’équipe Byound</p></div>`,
      }),
    }).catch(() => null);

    void fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: resendHeaders,
      body: JSON.stringify({
        from,
        to: "timmydarcy44@gmail.com",
        reply_to: String(data.email),
        subject: `[CFA] Dossier complet — ${data.first_name} ${data.last_name}`,
        html: `<div style="font-family:Arial,sans-serif;color:#111"><h1>Nouveau dossier CFA complet</h1><p><strong>${escapeHtml(data.first_name)} ${escapeHtml(data.last_name)}</strong><br/>${escapeHtml(data.email)} · ${escapeHtml(data.phone || "Téléphone non renseigné")}<br/>Âge : ${escapeHtml(data.age)} · Niveau : ${escapeHtml(data.education_level)}<br/>Spécialisation : ${escapeHtml(getCfaSpecializationLabel(data.specialization))}<br/>Alternance : ${data.alternance_status === "company_found" ? "Entreprise trouvée" : "En recherche"}</p><h2>Parcours scolaire</h2><p>${escapeHtml(data.school_background)}</p><h2>Expériences</h2><p>${escapeHtml(data.experiences || "—")}</p><h2>Pourquoi Byound ?</h2><p>${escapeHtml(data.motivation_text || "Voir le média joint au dossier")}</p><h2>Byound Challenge</h2>${challengeSummary}<p><a href="${(process.env.NEXT_PUBLIC_APP_URL || "https://edgebs.fr").replace(/\/$/, "")}/super/crm/cfa">Ouvrir le dossier dans le CRM CFA</a></p></div>`,
      }),
    }).catch(() => null);
  }

  return NextResponse.json({ application: data });
}
