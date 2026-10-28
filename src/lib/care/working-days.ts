const PARIS = "Europe/Paris";

export function parisDateKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function isParisWeekday(isoOrKey: string) {
  const date = isoOrKey.length <= 10 ? new Date(`${isoOrKey}T12:00:00+01:00`) : new Date(isoOrKey);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: PARIS, weekday: "short" }).format(date);
  return weekday !== "Sat" && weekday !== "Sun";
}

export function formatParisTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function nextOpenDays(slotIsos: string[], count = 8) {
  const seen: string[] = [];
  for (const iso of [...slotIsos].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())) {
    const key = parisDateKey(iso);
    if (!seen.includes(key)) seen.push(key);
    if (seen.length >= count) break;
  }
  return seen;
}

export function uniqueSlotsForParisDay(slots: Array<{ starts_at: string; format?: string }>, dayKey: string) {
  const unique = new Map<string, { starts_at: string; format: string }>();
  for (const slot of slots) {
    if (parisDateKey(slot.starts_at) !== dayKey) continue;
    const label = formatParisTime(slot.starts_at);
    if (unique.has(label)) continue;
    unique.set(label, { starts_at: slot.starts_at, format: slot.format === "cabinet" ? "cabinet" : "visio" });
  }
  return [...unique.values()].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
}

export function formatCareDayChip(dateKey: string) {
  const label = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateKey}T12:00:00+01:00`));
  return label.replace(".", "");
}

export function formatCareDateLong(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formatCareCalendarParts(iso: string) {
  const month = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, month: "short" }).format(new Date(iso));
  const day = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, day: "numeric" }).format(new Date(iso));
  const weekday = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS, weekday: "long" }).format(new Date(iso));
  const time = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
  return { month: month.replace(".", ""), day, weekday, time };
}

export function formatCareBookButton(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("fr-FR", {
      timeZone: PARIS,
      weekday: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `Réserver ${parts.weekday} ${parts.day} à ${parts.hour}:${parts.minute}`;
}
