import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import {
  accompagnementProfileAdminUrl,
  EDGE_ADMIN_EMAIL,
  formatEurosFromCents,
  formatSlotLabel,
  type BookableEdgeOffer,
} from "@/lib/particulier/accompagnement-booking";
import { publicAppUrl } from "@/lib/env";

export async function sendAccompagnementConfirmationEmails(params: {
  reservationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  offer: BookableEdgeOffer;
  amountCents: number;
  selectedSlot: string;
}) {
  const when = formatSlotLabel(params.selectedSlot);
  const price = formatEurosFromCents(params.amountCents);
  const coachingUrl = `${publicAppUrl()}/dashboard/apprenant/coaching`;

  const userHtml = buildEdgeEmailShell({
    title: "Votre réservation EDGE est confirmée",
    preheader: `${params.offer.title} — ${when}`,
    bodyHtml: `<p>Bonjour ${escapeEdgeEmailHtml(params.userName || "")},</p>
      <p>Votre accompagnement EDGE est confirmé.</p>
      <ul style="margin:20px 0;padding-left:20px;text-align:left;">
        <li><strong>${escapeEdgeEmailHtml(params.offer.title)}</strong></li>
        <li>${escapeEdgeEmailHtml(price)}</li>
        <li>${escapeEdgeEmailHtml(when)}</li>
        <li>En visioconférence — le lien vous sera envoyé avant la séance</li>
      </ul>
      <p style="font-size:15px;color:#4A4A4A;">Retrouvez le détail dans votre espace Mon accompagnement.</p>`,
    cta: { label: "Voir mon accompagnement", href: coachingUrl },
    footerNote: "Une question ? Répondez à cet email, nous vous répondrons rapidement.",
  });

  await sendEmail({
    to: params.userEmail,
    subject: "Votre réservation EDGE est confirmée",
    html: userHtml,
    skipBcc: true,
  });

  const adminHtml = buildEdgeEmailShell({
    title: "Nouvelle réservation accompagnement EDGE",
    preheader: `${params.userName} — ${params.offer.title}`,
    bodyHtml: `<ul style="margin:20px 0;padding-left:20px;text-align:left;">
        <li><strong>Nom :</strong> ${escapeEdgeEmailHtml(params.userName || "—")}</li>
        <li><strong>Email :</strong> ${escapeEdgeEmailHtml(params.userEmail)}</li>
        <li><strong>Offre :</strong> ${escapeEdgeEmailHtml(params.offer.title)}</li>
        <li><strong>Prix :</strong> ${escapeEdgeEmailHtml(price)}</li>
        <li><strong>Créneau :</strong> ${escapeEdgeEmailHtml(when)}</li>
        <li><strong>Réservation :</strong> ${escapeEdgeEmailHtml(params.reservationId)}</li>
      </ul>`,
    cta: {
      label: "Voir le profil utilisateur",
      href: accompagnementProfileAdminUrl(params.userId),
    },
  });

  await sendEmail({
    to: EDGE_ADMIN_EMAIL,
    subject: "Nouvelle réservation accompagnement EDGE",
    html: adminHtml,
    skipBcc: true,
  });
}

export async function sendProgrammeRequestEmails(params: {
  requestId: string;
  userId: string;
  userName: string;
  userEmail: string;
  objectif: string;
  besoin: string;
  disponibilite: string;
  message?: string;
}) {
  const userHtml = buildEdgeEmailShell({
    title: "Demande reçue",
    preheader: "Programme Progression EDGE",
    bodyHtml: `<p>Bonjour ${params.userName || ""},</p>
      <p>Nous avons bien reçu votre demande de programme personnalisé.</p>
      <p style="font-size:15px;color:#4A4A4A;">Un expert EDGE vous recontactera sous 48 h ouvrées pour échanger sur votre objectif et vous proposer une formule adaptée.</p>`,
    cta: { label: "Retour à Mon accompagnement", href: `${publicAppUrl()}/dashboard/apprenant/coaching` },
  });

  await sendEmail({
    to: params.userEmail,
    subject: "Votre demande de programme EDGE est enregistrée",
    html: userHtml,
    skipBcc: true,
  });

  const adminHtml = buildEdgeEmailShell({
    title: "Nouvelle demande programme EDGE",
    preheader: params.userEmail,
    bodyHtml: `<ul style="margin:20px 0;padding-left:20px;text-align:left;">
        <li><strong>Nom :</strong> ${escapeEdgeEmailHtml(params.userName || "—")}</li>
        <li><strong>Email :</strong> ${escapeEdgeEmailHtml(params.userEmail)}</li>
        <li><strong>Objectif :</strong> ${escapeEdgeEmailHtml(params.objectif)}</li>
        <li><strong>Besoin :</strong> ${escapeEdgeEmailHtml(params.besoin)}</li>
        <li><strong>Disponibilité :</strong> ${escapeEdgeEmailHtml(params.disponibilite)}</li>
        ${params.message ? `<li><strong>Message :</strong> ${escapeEdgeEmailHtml(params.message)}</li>` : ""}
        <li><strong>Demande :</strong> ${escapeEdgeEmailHtml(params.requestId)}</li>
      </ul>`,
    cta: {
      label: "Voir le profil utilisateur",
      href: accompagnementProfileAdminUrl(params.userId),
    },
  });

  await sendEmail({
    to: EDGE_ADMIN_EMAIL,
    subject: "Nouvelle demande programme accompagnement EDGE",
    html: adminHtml,
    skipBcc: true,
  });
}
