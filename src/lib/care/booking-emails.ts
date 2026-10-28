import { buildCareEmail } from "@/lib/expert/care-email";
import { CARE_FOR_WHOM_LABELS } from "@/lib/care/booking-schema";
import { formatCareDateLong } from "@/lib/care/working-days";
import { sendEmail } from "@/lib/email/resend-client";
import type { CareBookingForWhom } from "@/lib/care/types";

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] ?? char));
}

export async function sendCareBookingEmails(input: {
  clientEmail: string;
  clientFirstName: string;
  practitionerEmail: string | null;
  practitionerName: string;
  serviceName: string;
  startsAt: string;
  format: "cabinet" | "visio";
  forWhom: CareBookingForWhom;
  confirmUrl: string;
  icsUrl: string;
  cancelUrl: string;
  icsContent: string;
  message?: string;
}) {
  const when = formatCareDateLong(input.startsAt);
  const formatLabel = input.format === "visio" ? "Visio" : "Cabinet";
  const forLabel = CARE_FOR_WHOM_LABELS[input.forWhom].title;
  const clientHtml = buildCareEmail({
    greeting: `Bonjour ${input.clientFirstName},`,
    title: "Votre rendez-vous est confirmé",
    bodyHtml: `<p>Rendez-vous avec ${escapeHtml(input.practitionerName)} — ${escapeHtml(input.serviceName)}.</p>
<p><strong>${escapeHtml(when)}</strong> · ${formatLabel} · ${escapeHtml(forLabel)}</p>
<p>Un fichier calendrier est joint. Vous pouvez aussi <a href="${input.icsUrl}">l’ajouter à votre calendrier</a>.</p>
<p>Pour modifier ou annuler : <a href="${input.cancelUrl}">ouvrir votre réservation</a>.</p>`,
    ctaLabel: "Voir ma réservation",
    ctaUrl: input.confirmUrl,
    footer: "Byound Care — ce message ne contient pas de diagnostic.",
  });
  await sendEmail({
    to: input.clientEmail,
    subject: "Votre rendez-vous Byound Care est confirmé",
    html: clientHtml,
    skipBcc: true,
    attachments: [{ filename: "rendez-vous.ics", content: input.icsContent, contentEncoding: "utf8" }],
  });
  if (!input.practitionerEmail) return;
  const practitionerHtml = buildCareEmail({
    greeting: `Bonjour ${input.practitionerName},`,
    title: "Nouveau rendez-vous",
    bodyHtml: `<p>${escapeHtml(input.clientFirstName)} a réservé ${escapeHtml(input.serviceName)}.</p>
<p><strong>${escapeHtml(when)}</strong> · ${formatLabel} · ${escapeHtml(forLabel)}</p>
<p>Le détail du message, s’il y en a un, est dans votre espace praticien.</p>`,
    footer: "Byound Care",
  });
  await sendEmail({
    to: input.practitionerEmail,
    subject: `Nouveau rendez-vous Byound Care — ${when}`,
    html: practitionerHtml,
    skipBcc: true,
  });
}

export async function sendCareCancellationEmails(input: {
  clientEmail: string;
  clientFirstName: string;
  practitionerEmail: string | null;
  practitionerName: string;
  serviceName: string;
  startsAt: string;
  byExpert?: boolean;
}) {
  const when = formatCareDateLong(input.startsAt);
  const clientHtml = buildCareEmail({
    greeting: `Bonjour ${input.clientFirstName},`,
    title: "Rendez-vous annulé",
    bodyHtml: `<p>Votre rendez-vous avec ${escapeHtml(input.practitionerName)} (${escapeHtml(input.serviceName)}) le ${escapeHtml(when)} a été annulé${input.byExpert ? " par votre praticienne" : ""}.</p>`,
  });
  await sendEmail({
    to: input.clientEmail,
    subject: "Votre rendez-vous Byound Care a été annulé",
    html: clientHtml,
    skipBcc: true,
  });
  if (!input.practitionerEmail || input.byExpert) return;
  await sendEmail({
    to: input.practitionerEmail,
    subject: `Rendez-vous annulé — ${when}`,
    html: buildCareEmail({
      greeting: `Bonjour ${input.practitionerName},`,
      title: "Un rendez-vous a été annulé",
      bodyHtml: `<p>${escapeHtml(input.clientFirstName)} a annulé ${escapeHtml(input.serviceName)} prévu le ${escapeHtml(when)}.</p>`,
    }),
    skipBcc: true,
  });
}

export async function sendCareReminderEmail(input: {
  clientEmail: string;
  clientFirstName: string;
  practitionerName: string;
  serviceName: string;
  startsAt: string;
  confirmUrl: string;
}) {
  const when = formatCareDateLong(input.startsAt);
  await sendEmail({
    to: input.clientEmail,
    subject: "Rappel : rendez-vous Byound Care demain",
    html: buildCareEmail({
      greeting: `Bonjour ${input.clientFirstName},`,
      title: "Rendez-vous demain",
      bodyHtml: `<p>Petit rappel : ${escapeHtml(input.serviceName)} avec ${escapeHtml(input.practitionerName)} le ${escapeHtml(when)}.</p>`,
      ctaLabel: "Voir ma réservation",
      ctaUrl: input.confirmUrl,
    }),
    skipBcc: true,
  });
}
