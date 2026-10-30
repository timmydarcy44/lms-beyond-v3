import type { CareBookingRecord } from "@/lib/care/load-booking";
import { formatPersonName } from "@/lib/care/person-name";
import { formatCareDuration, isCarePlaceholderText } from "@/lib/care/profile-format";
import { formatParisTime, parisDateKey } from "@/lib/care/working-days";

const PARIS = "Europe/Paris";

function part(date: Date, options: Intl.DateTimeFormatOptions, type: Intl.DateTimeFormatPartTypes) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, ...options })
    .formatToParts(date)
    .find((item) => item.type === type)?.value ?? "";
}

export function parisDateLine(now = new Date()) {
  const weekday = part(now, { weekday: "long" }, "weekday");
  const day = part(now, { day: "numeric" }, "day");
  const month = part(now, { month: "long" }, "month");
  return `${weekday.charAt(0).toLocaleUpperCase("fr-FR")}${weekday.slice(1)} ${day} ${month}`;
}

export function parisMonthTitle(iso: string) {
  const month = part(new Date(iso), { month: "long" }, "month");
  const year = part(new Date(iso), { year: "numeric" }, "year");
  return `${month.charAt(0).toLocaleUpperCase("fr-FR")}${month.slice(1)} ${year}`;
}

export function parisDayLabel(iso: string) {
  const day = part(new Date(iso), { day: "numeric" }, "day");
  const month = part(new Date(iso), { month: "short" }, "month").replace(".", "");
  return `${day} ${month}.`;
}

export function parisLongDate(iso: string) {
  const day = part(new Date(iso), { day: "numeric" }, "day");
  const month = part(new Date(iso), { month: "long" }, "month");
  return `${day} ${month}`;
}

export function parisGreeting(firstName: string, now = new Date()) {
  const hour = Number(part(now, { hour: "numeric", hourCycle: "h23" }, "hour"));
  const hello = hour < 18 ? "Bonjour" : "Bonsoir";
  const name = formatPersonName(firstName);
  return name ? `${hello} ${name}` : hello;
}

export function daysUntilParis(iso: string, now = new Date()) {
  const start = Date.parse(`${parisDateKey(now.toISOString())}T12:00:00Z`);
  const target = Date.parse(`${parisDateKey(iso)}T12:00:00Z`);
  return Math.round((target - start) / 86_400_000);
}

export function relativeWhenLabel(iso: string, now = new Date()) {
  const days = daysUntilParis(iso, now);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "demain";
  return `dans ${days} jours`;
}

export function appointmentHeadline(iso: string) {
  const date = new Date(iso);
  const weekday = part(date, { weekday: "short" }, "weekday").replace(".", "");
  const day = part(date, { day: "numeric" }, "day");
  const month = part(date, { month: "short" }, "month").replace(".", "");
  return {
    dateLabel: `${weekday.charAt(0).toLocaleUpperCase("fr-FR")}${weekday.slice(1)}. ${day} ${month}.`,
    time: formatParisTime(iso),
  };
}

export function bookingPlace(booking: Pick<CareBookingRecord, "format" | "practitioner_address">) {
  if (booking.format === "visio") return "En visio";
  const address = booking.practitioner_address?.replace(/\s+/g, " ").trim() ?? "";
  if (!address || isCarePlaceholderText(address)) return null;
  return address;
}

export function bookingSubtitle(booking: CareBookingRecord) {
  const service = isCarePlaceholderText(booking.service_name) ? "" : booking.service_name.trim();
  const duration = booking.duration_min > 0 ? formatCareDuration(booking.duration_min) : "";
  const place = bookingPlace(booking) ?? "";
  return [service, duration, place].filter(Boolean).join(" · ");
}

export function publicPractitionerLine(title: string, city: string | null) {
  const job = isCarePlaceholderText(title) ? "" : title.trim();
  const where = city?.trim() && !isCarePlaceholderText(city) ? city.trim() : "";
  return [job, where].filter(Boolean).join(" · ");
}

export function visioWindowOpen(startsAt: string, durationMin: number, now = Date.now()) {
  const start = new Date(startsAt).getTime();
  const end = start + Math.max(durationMin, 30) * 60 * 1000;
  return now >= start - 15 * 60 * 1000 && now <= end;
}
