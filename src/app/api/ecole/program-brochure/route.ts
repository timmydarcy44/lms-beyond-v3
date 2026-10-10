import { NextRequest, NextResponse } from "next/server";

import {
  CFA_SPECIALIZATIONS,
  getCfaSpecializationLabel,
  type CfaSpecialization,
} from "@/lib/cfa-applications";
import { cfaDarkEmailTemplate } from "@/lib/cfa-emails";
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

  const { error } = await db.from("cfa_applications").insert({
    status: "brochure",
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    specialization,
  });

  if (error && error.code !== "23505") {
    const statusBlocked = error.message.includes("cfa_applications_status_check");
    return NextResponse.json(
      {
        error: statusBlocked
          ? "Appliquez la migration 20261010220000_cfa_brochure_and_hero.sql pour enregistrer ce téléchargement."
          : "Enregistrement impossible.",
      },
      { status: 400 },
    );
  }

  const cursus = getCfaSpecializationLabel(specialization);
  const html = cfaDarkEmailTemplate({
    eyebrow: "Byound School",
    title: "Merci pour votre téléchargement.",
    body: `<p style="margin:0 0 14px">Bonjour ${escapeHtml(firstName)},</p><p style="margin:0">Vous venez de télécharger la fiche du cursus <strong style="color:#ffffff">${escapeHtml(cursus)}</strong>. L’équipe Byound School reste à votre disposition pour échanger sur cette formation.</p>`,
  });
  await sendEmail({
    to: email,
    subject: `Votre fiche ${cursus}`,
    html,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
    bcc: "timmydarcy44@gmail.com",
  });

  return NextResponse.json({ downloadUrl });
}
