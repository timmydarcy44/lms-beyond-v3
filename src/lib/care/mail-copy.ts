import { formatPersonName, personInitials } from "@/lib/care/person-name";
import type { CareBookingRecord } from "@/lib/care/load-booking";
import { CARE_PUBLIC_ORIGIN, careAbsoluteUrl } from "@/lib/care/host";
import type { AppointmentCardModel } from "../../../emails/care/theme";

const PARIS = "Europe/Paris";

export type CarePlaceKind = "cabinet" | "visio" | "domicile";

export type CareMailInput = {
  id: string;
  accessToken: string;
  startsAt: string;
  endsAt: string;
  place: CarePlaceKind;
  serviceName: string;
  durationMin: number;
  clientFirstName: string;
  clientEmail: string;
  practitionerName: string;
  practitionerTitle: string;
  practitionerEmail: string | null;
  practitionerAvatarUrl: string | null;
  practitionerSlug: string;
  address: string | null;
  city: string | null;
  cancellationHours: number;
  noFee: boolean;
};

export function placeKindFromFormat(format: string): CarePlaceKind {
  if (format === "visio") return "visio";
  if (format === "domicile" || format === "home") return "domicile";
  return "cabinet";
}

export function mailInputFromBooking(booking: CareBookingRecord): CareMailInput {
  return {
    id: booking.id,
    accessToken: booking.access_token,
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
    place: placeKindFromFormat(booking.format),
    serviceName: booking.service_name,
    durationMin: booking.duration_min,
    clientFirstName: formatPersonName(booking.client_first_name) || booking.client_first_name.trim(),
    clientEmail: booking.client_email,
    practitionerName: formatPersonName(booking.practitioner_name) || booking.practitioner_name.trim(),
    practitionerTitle: booking.practitioner_title,
    practitionerEmail: booking.practitioner_email,
    practitionerAvatarUrl: booking.practitioner_avatar_url,
    practitionerSlug: booking.practitioner_slug,
    address: booking.practitioner_address,
    city: booking.practitioner_city,
    cancellationHours: booking.cancellation_hours,
    noFee: booking.payment_method === "on_site" || !booking.payment_method,
  };
}

export function practitionerRoleLabel(title: string) {
  const value = title.toLocaleLowerCase("fr-FR");
  if (/(praticienne|professeure|formatrice|certifiée|psychopédagogue|éducatrice)/.test(value)) {
    return "Votre praticienne";
  }
  return "Votre praticien";
}

export function formatDurationShort(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!rest) return hours === 1 ? "1 h" : `${hours} h`;
  return `${hours} h ${rest}`;
}

export function formatDurationLong(minutes: number) {
  if (minutes === 60) return "1 heure";
  if (minutes > 0 && minutes < 60) return `${minutes} minutes`;
  if (minutes > 60 && minutes % 60 === 0) return `${minutes / 60} heures`;
  const short = formatDurationShort(minutes);
  return short || "la durée prévue";
}

function parts(date: Date) {
  const weekday = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, weekday: "long" }).format(date);
  const weekdayShort = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, weekday: "short" }).format(date);
  const day = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, month: "short" }).format(date).replace(".", "");
  const monthLong = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, month: "long" }).format(date);
  const time = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return { weekday, weekdayShort, day, month, monthLong, time };
}

export function formatSlotLabel(iso: string) {
  const date = new Date(iso);
  const part = parts(date);
  return `${part.weekday} ${part.day} ${part.monthLong}`;
}

export function formatSlotWithTime(iso: string) {
  const date = new Date(iso);
  const part = parts(date);
  return `${part.weekday} ${part.day} ${part.monthLong} à ${part.time}`;
}

export function cancellationRuleLabel(hours: number) {
  const value = Math.max(0, Math.round(hours));
  if (value <= 0) return "Annulation possible jusqu'au début du rendez-vous.";
  return `Modification ou annulation gratuite jusqu'à ${value} h avant.`;
}

export function cancellationDeadlineLabel(startsAt: string, hours: number, now = new Date()) {
  const until = new Date(new Date(startsAt).getTime() - Math.max(0, hours) * 3_600_000);
  if (until.getTime() <= now.getTime()) return "Le délai d'annulation gratuite est passé.";
  return `Annulation encore possible jusqu'au ${formatSlotWithTime(until.toISOString())}.`;
}

export function mapsUrlFor(address: string | null, city: string | null) {
  const query = [address, city].map((item) => item?.trim()).filter(Boolean).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function shortPlace(input: Pick<CareMailInput, "place" | "city">) {
  if (input.place === "visio") return "en visio";
  if (input.place === "domicile") return "à votre domicile";
  return input.city?.trim() ? `au cabinet à ${input.city.trim()}` : "au cabinet";
}

export function manageUrl(input: Pick<CareMailInput, "id" | "accessToken">) {
  return careAbsoluteUrl(`/care/reservation/${input.id}?token=${encodeURIComponent(input.accessToken)}`);
}

export function agendaUrl(input: Pick<CareMailInput, "accessToken">) {
  return `${CARE_PUBLIC_ORIGIN}/rdv/${encodeURIComponent(input.accessToken)}/agenda`;
}

export function rebookUrl(slug: string) {
  return slug ? `${CARE_PUBLIC_ORIGIN}/praticiens/${slug}` : `${CARE_PUBLIC_ORIGIN}/praticiens`;
}

export function locationText(input: Pick<CareMailInput, "place" | "address" | "city">) {
  if (input.place === "visio") return "En visio";
  if (input.place === "domicile") return "À votre domicile";
  return [input.address, input.city].map((item) => item?.trim()).filter(Boolean).join(", ") || "Cabinet";
}

export function appointmentCard(input: CareMailInput, variant: AppointmentCardModel["variant"]): AppointmentCardModel {
  const start = new Date(input.startsAt);
  const end = new Date(input.endsAt);
  const part = parts(start);
  const endTime = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(end);
  const name = input.practitionerName || "Votre praticien";
  const [firstName, ...rest] = name.split(" ");
  const initials = personInitials(firstName, rest.join(" "));
  const weekday = `${part.weekdayShort.replace(".", "").slice(0, 3).toLocaleUpperCase("fr-FR")}.`;
  const duration = formatDurationShort(input.durationMin);
  const service = input.serviceName.trim() || "Rendez-vous";
  const address = [input.address, input.city]
    .map((item) => item?.trim() ?? "")
    .filter((item, index, list) => Boolean(item) && list.indexOf(item) === index);
  if (input.place === "visio") {
    return {
      variant,
      weekday,
      day: part.day,
      month: `${part.month}.`,
      timeRange: `${part.time} – ${endTime}`,
      serviceLine: duration ? `${service} · ${duration}` : service,
      practitionerName: name,
      practitionerRole: practitionerRoleLabel(input.practitionerTitle),
      initials,
      avatarUrl: input.practitionerAvatarUrl,
      placeTitle: "En visio",
      placeDetail: "Le lien sera actif 15 min avant",
      mapsUrl: null,
    };
  }
  if (input.place === "domicile") {
    return {
      variant,
      weekday,
      day: part.day,
      month: `${part.month}.`,
      timeRange: `${part.time} – ${endTime}`,
      serviceLine: duration ? `${service} · ${duration}` : service,
      practitionerName: name,
      practitionerRole: practitionerRoleLabel(input.practitionerTitle),
      initials,
      avatarUrl: input.practitionerAvatarUrl,
      placeTitle: "À votre domicile",
      placeDetail: null,
      mapsUrl: null,
    };
  }
  return {
    variant,
    weekday,
    day: part.day,
    month: `${part.month}.`,
    timeRange: `${part.time} – ${endTime}`,
    serviceLine: duration ? `${service} · ${duration}` : service,
    practitionerName: name,
    practitionerRole: practitionerRoleLabel(input.practitionerTitle),
      initials,
    avatarUrl: input.practitionerAvatarUrl,
    placeTitle: `Cabinet de ${name}`,
    placeDetail: address.join(", ") || null,
    mapsUrl: mapsUrlFor(input.address, input.city),
  };
}

export function confirmationInfo(input: CareMailInput) {
  const items: string[] = [];
  if (input.place === "cabinet") items.push("Arrivez 5 minutes avant l'heure.");
  items.push(cancellationRuleLabel(input.cancellationHours));
  items.push("Une question ? Répondez simplement à cet email.");
  return items;
}

export function reminderInfo(input: CareMailInput, now = new Date()) {
  return [`Durée : ${formatDurationLong(input.durationMin)}.`, cancellationDeadlineLabel(input.startsAt, input.cancellationHours, now)];
}

export function cancellationIntro(input: CareMailInput, by: "client" | "expert") {
  const first = input.practitionerName.split(" ")[0] || "Votre praticien";
  const base = by === "expert" ? `${first} a dû annuler ce rendez-vous. Toutes nos excuses.` : "C'est noté, le créneau ci-dessous a été libéré.";
  return input.noFee ? `${base} Aucun frais.` : base;
}

export function parisHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: PARIS, hour: "2-digit", hourCycle: "h23" }).format(date),
  );
}

export function parisTomorrowKey(now = new Date()) {
  const key = new Intl.DateTimeFormat("en-CA", { timeZone: PARIS, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [year, month, day] = key.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}
