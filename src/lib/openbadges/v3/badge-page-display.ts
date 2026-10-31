import { formatPersonName } from "@/lib/care/person-name";

export { formatPersonName };

export function formatBadgeLongDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function formatBadgeCardDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    .format(date)
    .replaceAll("/", ".");
}

export function truncateBadgeId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function criteriaShareOneDate(dates: Array<string | null>) {
  const present = dates.filter((date): date is string => Boolean(date));
  if (present.length === 0 || present.length !== dates.length) return null;
  const days = new Set(present.map((date) => date.slice(0, 10)));
  return days.size === 1 ? present[0] : null;
}

export function stripRemoteUrls(value: string) {
  return value.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
}
