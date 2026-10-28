export type CareSessionFormat = "cabinet" | "visio";
export type CareRuleFormat = CareSessionFormat | "both";

export type CareAvailabilityRule = {
  weekday: number;
  startTime: string;
  endTime: string;
  format: CareRuleFormat;
};

export type CareAvailabilityException = {
  date: string;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
};

export type CareConfirmedInterval = {
  startsAt: Date;
  endsAt: Date;
};

export type CareFreeSlot = {
  startsAt: Date;
  endsAt: Date;
  format: CareSessionFormat;
};

const PARIS = "Europe/Paris";
const LEAD_MS = 12 * 60 * 60 * 1000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parisParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
    weekday: get("weekday"),
  };
}

function civilMinutes(dateYmd: string, timeHm: string) {
  const [year, month, day] = dateYmd.split("-").map(Number);
  const [hour, minute] = timeHm.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) / 60_000;
}

/** Interprète une heure murale Europe/Paris comme instant UTC. */
export function parisWallToUtc(dateYmd: string, timeHm: string): Date {
  const [year, month, day] = dateYmd.split("-").map(Number);
  const [hour, minute] = timeHm.split(":").map(Number);
  let guess = new Date(Date.UTC(year, month - 1, day, hour - 1, minute, 0));
  for (let i = 0; i < 4; i += 1) {
    const shown = parisParts(guess);
    const delta = civilMinutes(dateYmd, timeHm) - civilMinutes(shown.date, shown.time);
    if (delta === 0) return guess;
    guess = new Date(guess.getTime() + delta * 60_000);
  }
  return guess;
}

export function addDaysYmd(dateYmd: string, days: number) {
  const [year, month, day] = dateYmd.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

export function weekdayFromYmd(dateYmd: string) {
  const noon = parisWallToUtc(dateYmd, "12:00");
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: PARIS, weekday: "short" }).format(noon);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd.slice(0, 3)] ?? 0;
}

function eachParisDate(from: Date, to: Date) {
  const start = parisParts(from).date;
  const end = parisParts(to).date;
  const dates: string[] = [];
  for (let cursor = start; cursor <= end; cursor = addDaysYmd(cursor, 1)) dates.push(cursor);
  return dates;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function expandFormats(ruleFormat: CareRuleFormat, serviceFormats: CareSessionFormat[]) {
  const fromRule: CareSessionFormat[] = ruleFormat === "both" ? ["cabinet", "visio"] : [ruleFormat];
  return fromRule.filter((item) => serviceFormats.includes(item));
}

type Window = { start: Date; end: Date; format: CareSessionFormat };

function exceptionRange(dateYmd: string, item: CareAvailabilityException) {
  const start = parisWallToUtc(dateYmd, item.startTime || "00:00");
  const end = parisWallToUtc(dateYmd, item.endTime || "23:59");
  return { start, end: item.endTime ? end : parisWallToUtc(addDaysYmd(dateYmd, 1), "00:00") };
}

function applyExceptions(windows: Window[], dateYmd: string, exceptions: CareAvailabilityException[]) {
  const dayItems = exceptions.filter((item) => item.date === dateYmd);
  let next = windows;
  for (const item of dayItems.filter((row) => row.isClosed)) {
    const range = exceptionRange(dateYmd, item);
    const sliced: Window[] = [];
    for (const win of next) {
      if (!overlaps(win.start, win.end, range.start, range.end)) {
        sliced.push(win);
        continue;
      }
      if (win.start < range.start) sliced.push({ ...win, end: range.start });
      if (win.end > range.end) sliced.push({ ...win, start: range.end });
    }
    next = sliced;
  }
  for (const item of dayItems.filter((row) => !row.isClosed)) {
    const range = exceptionRange(dateYmd, item);
    const formats = [...new Set(next.map((win) => win.format))];
    const useFormats = formats.length ? formats : (["visio"] as CareSessionFormat[]);
    for (const format of useFormats) next.push({ start: range.start, end: range.end, format });
  }
  return next.filter((win) => win.end > win.start);
}

export function buildAvailableSlots(input: {
  rules: CareAvailabilityRule[];
  exceptions?: CareAvailabilityException[];
  bookings?: CareConfirmedInterval[];
  serviceFormats: CareSessionFormat[];
  durationMin: number;
  from: Date;
  to: Date;
  now?: Date;
}): CareFreeSlot[] {
  const durationMs = input.durationMin * 60_000;
  if (durationMs <= 0 || input.to <= input.from) return [];
  const now = input.now ?? new Date();
  const earliest = new Date(now.getTime() + LEAD_MS);
  const bookings = input.bookings ?? [];
  const exceptions = input.exceptions ?? [];
  const slots: CareFreeSlot[] = [];

  for (const dateYmd of eachParisDate(input.from, input.to)) {
    const weekday = weekdayFromYmd(dateYmd);
    let windows: Window[] = [];
    for (const rule of input.rules.filter((item) => item.weekday === weekday)) {
      const start = parisWallToUtc(dateYmd, rule.startTime);
      const end = parisWallToUtc(dateYmd, rule.endTime);
      for (const format of expandFormats(rule.format, input.serviceFormats)) {
        windows.push({ start, end, format });
      }
    }
    windows = applyExceptions(windows, dateYmd, exceptions);
    for (const win of windows) {
      for (let cursor = win.start.getTime(); cursor + durationMs <= win.end.getTime(); cursor += durationMs) {
        const startsAt = new Date(cursor);
        const endsAt = new Date(cursor + durationMs);
        if (startsAt < input.from || endsAt > input.to || startsAt < earliest) continue;
        if (bookings.some((booking) => overlaps(startsAt, endsAt, booking.startsAt, booking.endsAt))) continue;
        slots.push({ startsAt, endsAt, format: win.format });
      }
    }
  }
  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.format.localeCompare(b.format));
}
