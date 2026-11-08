import { NextRequest, NextResponse } from "next/server";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import {
  amountsFromHtCents,
  quoteHtCentsFromCatalog,
} from "@/lib/formation-dossier/catalog-pricing";
import { createFormationDossier } from "@/lib/formation-dossier/create-dossier";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CONTACT_TO = "contact@byound.fr";

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#8A8A8A;vertical-align:top;width:160px;">${escapeEdgeEmailHtml(label)}</td>
    <td style="padding:8px 0;font-size:15px;color:#111111;font-weight:500;">${escapeEdgeEmailHtml(value).replace(/\n/g, "<br/>")}</td>
  </tr>`;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Demande formation depuis byound.fr — sans compte dashboard entreprise. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const companyName = String(body.company_name ?? body.entreprise ?? "").trim();
  const contactName = String(body.contact_name ?? body.nom ?? "").trim();
  const contactEmail = String(body.contact_email ?? body.email ?? "")
    .trim()
    .toLowerCase();
  const contactPhone = String(body.contact_phone ?? body.telephone ?? "").trim();
  const participantsRaw = String(body.participants ?? "1").trim();
  const participants = Math.max(1, Number.parseInt(participantsRaw.replace(/\D/g, ""), 10) || 1);
  const modalityRaw = String(body.modality ?? "intra").trim().toLowerCase();
  const modalityIntraInter = modalityRaw === "inter" ? "inter" : "intra";
  const preferredFormat = String(body.preferred_format ?? "").trim();
  const preferredPeriod = String(body.preferred_period ?? "").trim();
  const preferredLocation = String(body.preferred_location ?? "").trim();
  const fundingRaw = String(body.funding_type ?? "direct").trim().toLowerCase();
  const fundingType = fundingRaw === "opco" ? "opco" : "direct";
  const notes = String(body.notes ?? body.message ?? "").trim();
  const courseId = String(body.training_course_id ?? body.course_id ?? "").trim();
  const courseSlug = String(body.course_slug ?? body.slug ?? "").trim();
  const siret = String(body.siret ?? "").replace(/\D/g, "");

  if (!companyName || !contactName || !contactEmail.includes("@")) {
    return NextResponse.json(
      { error: "Entreprise, contact et e-mail professionnel sont requis." },
      { status: 400 },
    );
  }
  if (!courseId && !courseSlug) {
    return NextResponse.json({ error: "Formation requise." }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  let courseQuery = service
    .from("training_courses")
    .select("id, slug, title, intra_price, inter_price, duration, is_active");
  if (courseId) courseQuery = courseQuery.eq("id", courseId);
  else courseQuery = courseQuery.eq("slug", courseSlug);
  const { data: course } = await courseQuery.maybeSingle();
  if (!course?.id) {
    return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  }
  if (course.is_active === false) {
    return NextResponse.json({ error: "Cette formation n'est plus ouverte aux demandes." }, { status: 400 });
  }

  const ht = quoteHtCentsFromCatalog({
    intraPrice: course.intra_price != null ? Number(course.intra_price) : null,
    interPrice: course.inter_price != null ? Number(course.inter_price) : null,
    modality: modalityIntraInter,
    participants,
  });
  const amounts = amountsFromHtCents(ht);

  // Org existante (SIRET) ou création légère — pas d'accès dashboard requis
  let organizationId: string | null = null;
  if (siret.length === 14) {
    const { data: bySiret } = await service
      .from("organizations")
      .select("id")
      .eq("siret", siret)
      .maybeSingle();
    if (bySiret?.id) organizationId = String(bySiret.id);
  }
  if (!organizationId) {
    const slug = `${slugify(companyName) || "entreprise"}-${Date.now().toString(36)}`;
    const { data: org, error: orgErr } = await service
      .from("organizations")
      .insert({
        name: companyName,
        slug,
        siret: siret.length === 14 ? siret : null,
        status: "onboarding",
        kind: "client",
      })
      .select("id")
      .single();
    if (orgErr || !org?.id) {
      return NextResponse.json(
        { error: orgErr?.message || "Création compte impossible" },
        { status: 400 },
      );
    }
    organizationId = String(org.id);
  }

  const modalityPresence =
    preferredFormat.toLowerCase().includes("distan") || preferredLocation.toLowerCase().includes("distan")
      ? "distanciel"
      : preferredFormat.toLowerCase().includes("blend") || preferredFormat.toLowerCase().includes("hybr")
        ? "hybride"
        : "presentiel";

  const dossier = await createFormationDossier(service, {
    organizationId,
    source: "site_request",
    trainingCourseId: String(course.id),
    courseTitle: String(course.title),
    contactName,
    contactEmail,
    contactPhone: contactPhone || null,
    amountHtCents: amounts?.ht ?? null,
    amountTvaCents: amounts?.tva ?? null,
    amountTtcCents: amounts?.ttc ?? null,
    modalityIntraInter,
    modalityPresence,
    fundingType,
    notes: [
      `Demande site byound.fr · sans dashboard`,
      `Participants: ${participants}`,
      preferredFormat ? `Format: ${preferredFormat}` : null,
      preferredPeriod ? `Période: ${preferredPeriod}` : null,
      preferredLocation ? `Lieu: ${preferredLocation}` : null,
      `Financement: ${fundingType === "opco" ? "OPCO" : "fonds propres"}`,
      amounts ? `Montant catalogue: ${(amounts.ht / 100).toLocaleString("fr-FR")} € HT` : "Montant catalogue à renseigner",
      notes || null,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  const amountLabel = amounts
    ? `${(amounts.ht / 100).toLocaleString("fr-FR")} € HT`
    : "À chiffrer";

  await sendEmail({
    to: CONTACT_TO,
    skipBcc: true,
    replyTo: contactEmail,
    from: EDGE_COCKPIT_FROM,
    subject: `[Byound Site] ${companyName} — ${course.title}`,
    html: buildEdgeEmailShell({
      title: "Demande formation — site web",
      preheader: `${companyName} — ${course.title}`,
      bodyHtml: `
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A4A4A;">
          Une entreprise sans accès dashboard a demandé une formation sur byound.fr.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align:left;">
          ${row("Formation", String(course.title))}
          ${row("Entreprise", companyName)}
          ${row("Contact", contactName)}
          ${row("Email", contactEmail)}
          ${contactPhone ? row("Téléphone", contactPhone) : ""}
          ${row("Participants", String(participants))}
          ${row("Modalité", modalityIntraInter)}
          ${row("Montant catalogue", amountLabel)}
          ${preferredPeriod ? row("Période", preferredPeriod) : ""}
          ${preferredLocation ? row("Lieu", preferredLocation) : ""}
          ${notes ? row("Message", notes) : ""}
          ${row("Dossier", dossier.id)}
        </table>`,
      footerNote: "Visible dans /super → Demandes entrantes",
    }),
    tags: { type: "site-formation-request", dossier_id: dossier.id },
  });

  await sendEmail({
    to: contactEmail,
    skipBcc: true,
    from: EDGE_COCKPIT_FROM,
    replyTo: CONTACT_TO,
    subject: `Demande bien reçue — ${course.title}`,
    html: buildEdgeEmailShell({
      title: "Demande bien reçue",
      preheader: `Votre demande — ${course.title}`,
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
          Bonjour ${escapeEdgeEmailHtml(contactName)},
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
          Nous avons bien reçu votre demande pour
          <strong>${escapeEdgeEmailHtml(String(course.title))}</strong>
          (${escapeEdgeEmailHtml(companyName)}).
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
          Un conseiller Byound revient vers vous rapidement avec un devis personnalisé.
          Aucun accès au dashboard entreprise n’est nécessaire pour cette étape.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align:left;">
          ${row("Formation", String(course.title))}
          ${row("Participants", String(participants))}
          ${row("Estimation catalogue", amountLabel)}
        </table>`,
      footerNote: "Byound — confirmation demande site",
    }),
    tags: { type: "site-formation-request-ack", dossier_id: dossier.id },
  });

  return NextResponse.json({
    success: true,
    dossierId: dossier.id,
    organizationId,
    amountHtCents: amounts?.ht ?? null,
  });
}
