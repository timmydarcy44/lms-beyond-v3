import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { CancellationEmail } from "../../../emails/care/CancellationEmail";
import { ConfirmationEmail } from "../../../emails/care/ConfirmationEmail";
import { DocumentEmail } from "../../../emails/care/DocumentEmail";
import { MovedEmail } from "../../../emails/care/MovedEmail";
import { NoticeEmail } from "../../../emails/care/NoticeEmail";
import { ReminderEmail } from "../../../emails/care/ReminderEmail";
import { sendEmail } from "@/lib/email/resend-client";
import { CARE_PUBLIC_ORIGIN } from "@/lib/care/host";
import { buildCalendarLinks, buildCareBookingIcs } from "@/lib/care/ics";
import {
  agendaUrl,
  appointmentCard,
  cancellationIntro,
  confirmationInfo,
  formatSlotLabel,
  formatSlotWithTime,
  locationText,
  mailInputFromBooking,
  manageUrl,
  mapsUrlFor,
  rebookUrl,
  reminderInfo,
  shortPlace,
  type CareMailInput,
} from "@/lib/care/mail-copy";
import type { CareBookingRecord } from "@/lib/care/load-booking";
import { formatPersonName } from "@/lib/care/person-name";

export const CARE_FROM = "Byound Care <rdv@byound.fr>";
const CARE_CONTACT = "contact@byound.fr";

async function deliver(input: {
  to: string;
  replyTo?: string | null;
  subject: string;
  tag: string;
  node: ReactElement;
  ics?: { filename: string; content: string };
}) {
  const html = await render(input.node);
  const text = await render(input.node, { plainText: true });
  return sendEmail({
    from: CARE_FROM,
    to: input.to,
    replyTo: input.replyTo?.includes("@") ? input.replyTo : CARE_CONTACT,
    subject: input.subject,
    html,
    text,
    skipBcc: true,
    tags: { type: input.tag },
    attachments: input.ics
      ? [{ filename: input.ics.filename, content: input.ics.content, contentEncoding: "utf8" as const }]
      : undefined,
  });
}

function icsFor(input: CareMailInput, method: "REQUEST" | "CANCEL", sequence = method === "CANCEL" ? 1 : 0) {
  return buildCareBookingIcs({
    id: input.id,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    location: locationText(input),
    method,
    sequence,
  });
}

export async function sendCareBookingEmails(booking: CareBookingRecord) {
  const input = mailInputFromBooking(booking);
  const when = formatSlotWithTime(input.startsAt);
  const card = appointmentCard(input, "default");
  const client = await deliver({
    to: input.clientEmail,
    replyTo: input.practitionerEmail,
    subject: `Rendez-vous confirmé · ${when}`,
    tag: "care_confirmation",
    node: (
      <ConfirmationEmail
        preheader={`Avec ${input.practitionerName}, ${shortPlace(input)}. Ajoutez-le à votre agenda.`}
        firstName={input.clientFirstName}
        card={card}
        agendaUrl={agendaUrl(input)}
        manageUrl={manageUrl(input)}
        infoItems={confirmationInfo(input)}
      />
    ),
    ics: { filename: "rendez-vous.ics", content: icsFor(input, "REQUEST", 0) },
  });
  if (!input.practitionerEmail) return client;
  await deliver({
    to: input.practitionerEmail,
    replyTo: CARE_CONTACT,
    subject: `Nouveau rendez-vous Byound Care — ${when}`,
    tag: "care_confirmation_expert",
    node: (
      <NoticeEmail
        preheader={`${input.clientFirstName} a réservé un rendez-vous.`}
        firstName={input.practitionerName.split(" ")[0] || ""}
        title="Nouveau rendez-vous"
        intro={`${input.clientFirstName} a réservé ${input.serviceName || "un rendez-vous"}.`}
        card={card}
        buttonLabel="Voir l'agenda"
        buttonUrl={`${CARE_PUBLIC_ORIGIN}/dashboard/expert/care/rendez-vous`}
      />
    ),
  });
  return client;
}

export async function sendCareReminderEmail(booking: CareBookingRecord) {
  const input = mailInputFromBooking(booking);
  const time = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(input.startsAt));
  const maps = input.place === "cabinet" ? mapsUrlFor(input.address, input.city) : null;
  const primaryUrl = input.place === "visio" ? manageUrl(input) : maps || manageUrl(input);
  return deliver({
    to: input.clientEmail,
    replyTo: input.practitionerEmail,
    subject: `Demain à ${time} · votre rendez-vous Byound Care`,
    tag: "care_reminder",
    node: (
      <ReminderEmail
        preheader={`${shortPlace(input)}, avec ${input.practitionerName}. Itinéraire dans l'email.`}
        firstName={input.clientFirstName}
        card={appointmentCard(input, "reminder")}
        primaryLabel={input.place === "visio" ? "Rejoindre la visio" : "Voir l'itinéraire"}
        primaryUrl={primaryUrl}
        manageUrl={manageUrl(input)}
        infoItems={reminderInfo(input)}
      />
    ),
  });
}

export async function sendCareCancellationEmails(booking: CareBookingRecord, by: "client" | "expert") {
  const input = mailInputFromBooking(booking);
  const when = formatSlotLabel(input.startsAt);
  const client = await deliver({
    to: input.clientEmail,
    replyTo: input.practitionerEmail,
    subject: `Rendez-vous annulé · ${when}`,
    tag: "care_cancellation",
    node: (
      <CancellationEmail
        preheader="Votre créneau a bien été libéré. Reprenez rendez-vous quand vous voulez."
        firstName={input.clientFirstName}
        intro={cancellationIntro(input, by)}
        card={appointmentCard(input, "cancelled")}
        rebookUrl={rebookUrl(input.practitionerSlug)}
      />
    ),
    ics: { filename: "rendez-vous-annule.ics", content: icsFor(input, "CANCEL", 1) },
  });
  if (by === "expert" || !input.practitionerEmail) return client;
  await deliver({
    to: input.practitionerEmail,
    replyTo: CARE_CONTACT,
    subject: `Rendez-vous annulé — ${when}`,
    tag: "care_cancellation_expert",
    node: (
      <NoticeEmail
        preheader={`${input.clientFirstName} a annulé le rendez-vous.`}
        firstName={input.practitionerName.split(" ")[0] || ""}
        title="Un rendez-vous a été annulé"
        intro={`${input.clientFirstName} a annulé le rendez-vous du ${when}.`}
        card={appointmentCard(input, "cancelled")}
        buttonLabel="Voir l'agenda"
        buttonUrl={`${CARE_PUBLIC_ORIGIN}/dashboard/expert/care/rendez-vous`}
        badge="cancelled"
      />
    ),
  });
  return client;
}

export async function sendCareMovedEmail(booking: CareBookingRecord, previousStartsAt: string, previousEndsAt: string) {
  const input = mailInputFromBooking(booking);
  const when = formatSlotWithTime(input.startsAt);
  const previous = `${formatSlotLabel(previousStartsAt)} · ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(previousStartsAt))} – ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(previousEndsAt))}`;
  return deliver({
    to: input.clientEmail,
    replyTo: input.practitionerEmail,
    subject: `Rendez-vous déplacé · ${when}`,
    tag: "care_moved",
    node: (
      <MovedEmail
        preheader={`Nouveau créneau : ${when}.`}
        firstName={input.clientFirstName}
        previousSlot={previous}
        card={appointmentCard(input, "default")}
        agendaUrl={agendaUrl(input)}
        manageUrl={manageUrl(input)}
        infoItems={confirmationInfo(input)}
      />
    ),
    ics: { filename: "rendez-vous.ics", content: icsFor(input, "REQUEST", 2) },
  });
}

export async function sendCareDocumentEmail(input: { to: string; firstName: string; practitionerName: string; replyTo?: string | null }) {
  const practitioner = formatPersonName(input.practitionerName) || "Votre praticien";
  const firstName = formatPersonName(input.firstName);
  const intro = `${practitioner} a ajouté un document dans votre espace Byound Care.`;
  return deliver({
    to: input.to,
    replyTo: input.replyTo,
    subject: "Un nouveau document est disponible dans votre espace",
    tag: "care_document",
    node: (
      <DocumentEmail
        preheader={intro}
        firstName={firstName}
        intro={intro}
        spaceUrl={`${CARE_PUBLIC_ORIGIN}/dashboard/patient/documents`}
      />
    ),
  });
}

export async function sendCareManualConfirmation(input: CareMailInput) {
  const links = buildCalendarLinks({
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    location: locationText(input),
    icsUrl: input.accessToken ? `${CARE_PUBLIC_ORIGIN}/api/care/ics/${input.id}?token=${encodeURIComponent(input.accessToken)}` : "",
  });
  return deliver({
    to: input.clientEmail,
    replyTo: input.practitionerEmail,
    subject: `Rendez-vous confirmé · ${formatSlotWithTime(input.startsAt)}`,
    tag: "care_confirmation",
    node: (
      <ConfirmationEmail
        preheader={`Avec ${input.practitionerName}, ${shortPlace(input)}. Ajoutez-le à votre agenda.`}
        firstName={input.clientFirstName}
        card={appointmentCard(input, "default")}
        agendaUrl={input.accessToken ? agendaUrl(input) : links.google}
        manageUrl={input.accessToken ? manageUrl(input) : `${CARE_PUBLIC_ORIGIN}/dashboard/patient`}
        infoItems={confirmationInfo(input)}
      />
    ),
    ics: { filename: "rendez-vous.ics", content: icsFor(input, "REQUEST", 0) },
  });
}
