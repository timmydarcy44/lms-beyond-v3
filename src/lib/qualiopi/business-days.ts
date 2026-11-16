/** Jours ouvrés France (week-ends + jours fériés fixes / variables approximés). */

function easterSunday(year: number): Date {
  // Meeus/Jones/Butcher
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysUtc(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export function frenchHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  const set = new Set<string>([
    `${year}-01-01`,
    `${year}-05-01`,
    `${year}-05-08`,
    `${year}-07-14`,
    `${year}-08-15`,
    `${year}-11-01`,
    `${year}-11-11`,
    `${year}-12-25`,
    ymd(addDaysUtc(easter, 1)), // Lundi de Pâques
    ymd(addDaysUtc(easter, 39)), // Ascension
    ymd(addDaysUtc(easter, 50)), // Lundi de Pentecôte
  ]);
  return set;
}

export function isFrenchBusinessDay(date: Date): boolean {
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  const year = date.getUTCFullYear();
  return !frenchHolidays(year).has(ymd(date));
}

/** Ajoute `n` jours ouvrés FR à partir de `from` (exclu le jour de départ si hors ouvré, on avance). */
export function addFrenchBusinessDays(from: Date | string, n: number): Date {
  let cur = new Date(from);
  if (Number.isNaN(cur.getTime())) cur = new Date();
  // Normalise à minuit UTC
  cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()));
  let left = Math.max(0, Math.floor(n));
  while (left > 0) {
    cur = addDaysUtc(cur, 1);
    if (isFrenchBusinessDay(cur)) left -= 1;
  }
  return cur;
}

export function frenchBusinessDaysBetween(from: Date | string, to: Date | string): number {
  let a = new Date(from);
  let b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  a = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()));
  b = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
  if (b < a) return 0;
  let n = 0;
  let cur = a;
  while (cur < b) {
    cur = addDaysUtc(cur, 1);
    if (isFrenchBusinessDay(cur)) n += 1;
  }
  return n;
}
