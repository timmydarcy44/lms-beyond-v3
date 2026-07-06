import { publicAppUrl } from "@/lib/env";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatIcsUtc(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

export function buildAccompagnementIcs(params: {
  reservationId: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  userEmail: string;
  coachName: string;
  manageToken: string;
}): string {
  const start = new Date(params.startsAt);
  const end = new Date(start.getTime() + params.durationMinutes * 60 * 1000);
  const uid = `edge-accompagnement-${params.reservationId}@edgebs.fr`;
  const manageUrl = `${publicAppUrl()}/dashboard/accompagnement/gérer/${params.manageToken}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EDGE Lab//Accompagnement//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${params.title} — EDGE`,
    `DESCRIPTION:Accompagnement EDGE avec ${params.coachName}. Gérer : ${manageUrl}`,
    "LOCATION:Visioconférence (lien envoyé par email)",
    `ORGANIZER;CN=EDGE:mailto:contact@edgebs.fr`,
    `ATTENDEE;CN=Participant;RSVP=TRUE:mailto:${params.userEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

export function parseDurationMinutes(durationLabel?: string | null): number {
  if (!durationLabel) return 60;
  const match = durationLabel.match(/(\d+)/);
  return match ? Number(match[1]) : 60;
}

export function getManageReservationUrl(manageToken: string): string {
  return `${publicAppUrl()}/dashboard/accompagnement/gerer/${manageToken}`;
}
