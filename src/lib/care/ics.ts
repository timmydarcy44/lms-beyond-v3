const SUMMARY = "Rendez-vous Byound Care";

function icsStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildCareBookingIcs(input: {
  id: string;
  startsAt: Date;
  endsAt: Date;
  location: string;
  method?: "REQUEST" | "CANCEL";
  sequence?: number;
}) {
  const method = input.method ?? "REQUEST";
  const sequence = input.sequence ?? (method === "CANCEL" ? 1 : 0);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Byound Care//FR",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${input.id}@byound.fr`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(input.startsAt)}`,
    `DTEND:${icsStamp(input.endsAt)}`,
    `SEQUENCE:${sequence}`,
    `STATUS:${method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
    "SUMMARY:Rendez-vous Byound Care",
    "DESCRIPTION:Rendez-vous Byound Care",
    `LOCATION:${escapeIcs(input.location)}`,
    "ORGANIZER:mailto:rdv@byound.fr",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function buildCalendarLinks(input: { startsAt: Date; endsAt: Date; location: string; icsUrl: string }) {
  const text = encodeURIComponent(SUMMARY);
  const details = encodeURIComponent(SUMMARY);
  const location = encodeURIComponent(input.location);
  const dates = `${icsStamp(input.startsAt)}/${icsStamp(input.endsAt)}`;
  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${text}&startdt=${encodeURIComponent(input.startsAt.toISOString())}&enddt=${encodeURIComponent(input.endsAt.toISOString())}&location=${location}&body=${details}`,
    ics: input.icsUrl,
  };
}

export const CARE_CALENDAR_SUMMARY = SUMMARY;
