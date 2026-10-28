function icsStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildCareBookingIcs(input: {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string;
  description: string;
}) {
  const uid = `${input.id}@byound.fr`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Byound Care//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(input.startsAt)}`,
    `DTEND:${icsStamp(input.endsAt)}`,
    `SUMMARY:${input.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${input.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${input.location.replace(/\n/g, " ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
