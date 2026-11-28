import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { looksLikeTestCfaEmail } from "@/lib/cfa/admission-draft";
import {
  CFA_SPECIALIZATIONS,
  getCfaSpecializationLabel,
  type CfaSpecialization,
} from "@/lib/cfa-applications";
import { cfaDarkEmailTemplate } from "@/lib/cfa-emails";
import { recordCfaTouch, upsertCfaPerson } from "@/lib/cfa/upsert-cfa-person";
import { parseUtmAttribution } from "@/lib/cfa/utm-attribution";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { getServiceRoleClient } from "@/lib/supabase/server";

function isSpecialization(value: string): value is CfaSpecialization {
  return CFA_SPECIALIZATIONS.some((item) => item.value === value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const firstName = String(body?.firstName ?? "").trim();
  const lastName = String(body?.lastName ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phone = String(body?.phone ?? "").trim();
  const specialization = String(body?.specialization ?? "").trim();
  const contactConsent = body?.contactConsent === true;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Indiquez votre nom et votre prénom." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Indiquez une adresse mail valide." }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "Indiquez un numéro de téléphone." }, { status: 400 });
  }
  if (!isSpecialization(specialization)) {
    return NextResponse.json({ error: "Cursus introuvable." }, { status: 400 });
  }
  if (!contactConsent) {
    return NextResponse.json(
      { error: "Merci d’accepter d’être recontacté·e par Byound." },
      { status: 400 },
    );
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: program, error: programError } = await db
    .from("byound_school_programs")
    .select("program_pdf_url")
    .eq("specialization", specialization)
    .maybeSingle();

  const downloadUrl = String(program?.program_pdf_url ?? "").trim();
  if (programError || !downloadUrl) {
    return NextResponse.json(
      { error: "Le programme n’est pas encore disponible au téléchargement." },
      { status: 404 },
    );
  }

  const cookieStore = await cookies();
  const utm = parseUtmAttribution(
    (() => {
      try {
        return JSON.parse(cookieStore.get("byound_school_utm")?.value || "null");
      } catch {
        return body?.utm ?? null;
      }
    })(),
  ) ?? parseUtmAttribution(body?.utm);

  try {
    const upserted = await upsertCfaPerson(db, {
      firstName,
      lastName,
      email,
      phone,
      specialization,
      intendedStage: "prospect",
      sourceFamily: "web",
      sourceChannel: "web_brochure",
      brochureId: specialization,
      utm,
      contactConsent: true,
      followUpHours: 48,
      touchType: "brochure_download",
      touchDetail: "Téléchargement de plaquette",
    });
    if (looksLikeTestCfaEmail(email) || process.env.CFA_BLOCK_LIVE_MAILS !== "1") {
      const cursus = getCfaSpecializationLabel(specialization);
      const html = cfaDarkEmailTemplate({
        eyebrow: "Byound",
        title: "Merci pour votre téléchargement.",
        body: `<p style="margin:0 0 14px">Bonjour ${escapeHtml(firstName)},</p><p style="margin:0">Vous venez de télécharger la fiche du cursus <strong style="color:#ffffff">${escapeHtml(cursus)}</strong>. L’équipe Byound reste à votre disposition pour échanger sur cette formation.</p>`,
      });
      const sent = await sendEmail({
        to: email,
        subject: `Votre fiche ${cursus}`,
        html,
        from: EDGE_COCKPIT_FROM,
        skipBcc: true,
      });
      if (sent.success) {
        await recordCfaTouch(db, {
          personId: upserted.person.id,
          type: "email_sent",
          detail: "Bienvenue plaquette",
        });
        await recordCfaTouch(db, {
          personId: upserted.person.id,
          type: "follow_up",
          detail: "Rappel conseillé sous 48 h",
        });
      }
    }
  } catch (error) {
    console.error("[program-brochure] lead upsert failed", error);
  }

  return NextResponse.json({ downloadUrl });
}
