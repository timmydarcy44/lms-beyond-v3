import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import {
  buildAccompagnementIcs,
  getManageReservationUrl,
  parseDurationMinutes,
} from "@/lib/particulier/accompagnement-ics";
import {
  accompagnementProfileAdminUrl,
  EDGE_ADMIN_EMAIL,
  formatEurosFromCents,
  formatSlotLabel,
  type BookableEdgeOffer,
} from "@/lib/particulier/accompagnement-booking";
import { publicAppUrl } from "@/lib/env";

export type AccompagnementReservationEmailData = {
  reservationId: string;
  manageToken: string;
  userId: string;
  userName: string;
  userEmail: string;
  offer: BookableEdgeOffer;
  amountCents: number;
  selectedSlot: string;
  coachName: string;
  durationLabel?: string | null;
  visioUrl?: string | null;
};

function slotDateParts(iso: string) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(d);
  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(d);
  return { date, time };
}

export async function sendAccompagnementConfirmationEmails(data: AccompagnementReservationEmailData) {
  const when = formatSlotLabel(data.selectedSlot);
  const { date, time } = slotDateParts(data.selectedSlot);
  const price = formatEurosFromCents(data.amountCents);
  const manageUrl = getManageReservationUrl(data.manageToken);
  const coachingUrl = `${publicAppUrl()}/dashboard/apprenant/coaching`;
  const visioLine = data.visioUrl
    ? escapeEdgeEmailHtml(data.visioUrl)
    : "Vous recevrez le lien de visioconférence par email avant la séance.";

  const ics = buildAccompagnementIcs({
    reservationId: data.reservationId,
    title: data.offer.title,
    startsAt: data.selectedSlot,
    durationMinutes: parseDurationMinutes(data.durationLabel),
    userEmail: data.userEmail,
    coachName: data.coachName,
    manageToken: data.manageToken,
  });

  const userConfirmationHtml = buildEdgeEmailShell({
    title: "Paiement confirmé",
    preheader: `Votre réservation EDGE — ${date}`,
    bodyHtml: `<p>Bonjour ${escapeEdgeEmailHtml(data.userName)},</p>
      <p style="font-size:18px;font-weight:600;color:#050505;">✓ Votre réservation est enregistrée.</p>
      <table style="margin:28px auto 0;border-collapse:collapse;text-align:left;font-size:15px;">
        <tr><td style="padding:8px 16px 8px 0;color:#8A8A8A;">Date</td><td style="padding:8px 0;font-weight:500;">${escapeEdgeEmailHtml(date)}</td></tr>
        <tr><td style="padding:8px 16px 8px 0;color:#8A8A8A;">Heure</td><td style="padding:8px 0;font-weight:500;">${escapeEdgeEmailHtml(time)}</td></tr>
        <tr><td style="padding:8px 16px 8px 0;color:#8A8A8A;">Accompagnement</td><td style="padding:8px 0;font-weight:500;">${escapeEdgeEmailHtml(data.offer.title)}</td></tr>
        <tr><td style="padding:8px 16px 8px 0;color:#8A8A8A;">Coach</td><td style="padding:8px 0;font-weight:500;">${escapeEdgeEmailHtml(data.coachName)}</td></tr>
        <tr><td style="padding:8px 16px 8px 0;color:#8A8A8A;">Visio</td><td style="padding:8px 0;">${visioLine}</td></tr>
      </table>`,
    cta: { label: "Retourner dans EDGE", href: coachingUrl },
    footerNote: "Un fichier calendrier (.ics) est joint à cet email.",
  });

  await sendEmail({
    to: data.userEmail,
    subject: "Votre réservation EDGE est confirmée",
    html: userConfirmationHtml,
    skipBcc: true,
    attachments: [{ filename: "reservation-edge.ics", content: ics }],
  });

  const userRecapHtml = buildEdgeEmailShell({
    title: "Récapitulatif de votre séance",
    preheader: data.offer.title,
    bodyHtml: `<p>Voici le récapitulatif de votre accompagnement EDGE :</p>
      <ul style="margin:20px 0;padding-left:20px;text-align:left;line-height:1.8;">
        <li><strong>Référence :</strong> ${escapeEdgeEmailHtml(data.reservationId)}</li>
        <li><strong>Prestation :</strong> ${escapeEdgeEmailHtml(data.offer.title)}</li>
        <li><strong>Montant payé :</strong> ${escapeEdgeEmailHtml(price)}</li>
        <li><strong>Créneau :</strong> ${escapeEdgeEmailHtml(when)}</li>
        <li><strong>Coach :</strong> ${escapeEdgeEmailHtml(data.coachName)}</li>
      </ul>
      <p style="font-size:15px;color:#4A4A4A;">Besoin de modifier ou annuler ? Utilisez le lien ci-dessous (jusqu'à 24 h avant la séance).</p>`,
    cta: { label: "Gérer mon rendez-vous", href: manageUrl },
  });

  await sendEmail({
    to: data.userEmail,
    subject: "Récapitulatif — Accompagnement EDGE",
    html: userRecapHtml,
    skipBcc: true,
  });

  const adminHtml = buildEdgeEmailShell({
    title: "Nouvelle réservation accompagnement EDGE",
    preheader: `${data.userName} — ${data.offer.title}`,
    bodyHtml: `<ul style="margin:20px 0;padding-left:20px;text-align:left;line-height:1.8;">
        <li><strong>Nom :</strong> ${escapeEdgeEmailHtml(data.userName)}</li>
        <li><strong>Email :</strong> ${escapeEdgeEmailHtml(data.userEmail)}</li>
        <li><strong>Offre :</strong> ${escapeEdgeEmailHtml(data.offer.title)}</li>
        <li><strong>Prix :</strong> ${escapeEdgeEmailHtml(price)}</li>
        <li><strong>Créneau :</strong> ${escapeEdgeEmailHtml(when)}</li>
        <li><strong>Stripe session :</strong> ${escapeEdgeEmailHtml(data.reservationId)}</li>
      </ul>`,
    cta: { label: "Voir le profil utilisateur", href: accompagnementProfileAdminUrl(data.userId) },
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
    bodyHtml: `<p>Bonjour ${escapeEdgeEmailHtml(params.userName)},</p>
      <p>Nous avons bien reçu votre demande de programme personnalisé.</p>
      <p style="font-size:15px;color:#4A4A4A;">Un expert EDGE vous recontactera sous 48 h ouvrées.</p>`,
    cta: { label: "Retour à Mon accompagnement", href: `${publicAppUrl()}/dashboard/apprenant/coaching` },
  });

  await sendEmail({ to: params.userEmail, subject: "Votre demande de programme EDGE est enregistrée", html: userHtml, skipBcc: true });

  const adminHtml = buildEdgeEmailShell({
    title: "Nouvelle demande programme EDGE",
    preheader: params.userEmail,
    bodyHtml: `<ul style="margin:20px 0;padding-left:20px;text-align:left;">
        <li><strong>Nom :</strong> ${escapeEdgeEmailHtml(params.userName)}</li>
        <li><strong>Email :</strong> ${escapeEdgeEmailHtml(params.userEmail)}</li>
        <li><strong>Objectif :</strong> ${escapeEdgeEmailHtml(params.objectif)}</li>
        <li><strong>Besoin :</strong> ${escapeEdgeEmailHtml(params.besoin)}</li>
        <li><strong>Disponibilité :</strong> ${escapeEdgeEmailHtml(params.disponibilite)}</li>
        ${params.message ? `<li><strong>Message :</strong> ${escapeEdgeEmailHtml(params.message)}</li>` : ""}
      </ul>`,
    cta: { label: "Voir le profil", href: accompagnementProfileAdminUrl(params.userId) },
  });

  await sendEmail({ to: EDGE_ADMIN_EMAIL, subject: "Nouvelle demande programme EDGE", html: adminHtml, skipBcc: true });
}

export async function sendAccompagnementCancellationEmail(params: {
  userEmail: string;
  userName: string;
  offerName: string;
  selectedSlot: string;
}) {
  const html = buildEdgeEmailShell({
    title: "Réservation annulée",
    bodyHtml: `<p>Bonjour ${escapeEdgeEmailHtml(params.userName)},</p>
      <p>Votre réservation <strong>${escapeEdgeEmailHtml(params.offerName)}</strong> du ${escapeEdgeEmailHtml(formatSlotLabel(params.selectedSlot))} a été annulée.</p>
      <p style="font-size:15px;color:#4A4A4A;">Vous pouvez réserver un nouveau créneau depuis Mon accompagnement.</p>`,
    cta: { label: "Mon accompagnement", href: `${publicAppUrl()}/dashboard/apprenant/coaching` },
  });
  await sendEmail({ to: params.userEmail, subject: "Votre réservation EDGE a été annulée", html, skipBcc: true });
}
