/**
 * Formatage des dates de session pour les documents Byound (convention, devis, annexe).
 * Toujours en Europe/Paris, jamais de décalage UTC.
 *
 * Entrée : créneaux { start, end } en ISO (UTC ou avec offset) ou objets Date.
 */

export type Slot = { start: string | Date; end?: string | Date };

const TZ = "Europe/Paris";
const MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

/** Date « YYYY-MM-DD » lue comme date locale (pas UTC) ; ISO avec heure lue telle quelle. */
function toDate(v: string | Date): Date {
  if (v instanceof Date) return v;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  // Midi UTC = même jour civil à Paris (évite le décalage minuit UTC → veille)
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)) : new Date(v);
}

/**
 * Horloge murale Europe/Paris.
 * - `YYYY-MM-DD` / `YYYY-MM-DDTHH:mm[:ss]` sans Z/offset → heures saisies telles quelles (pas de décalage UTC serveur).
 * - ISO avec Z/offset → converties en Paris.
 */
function wallParts(v: string | Date): {
  y: number;
  m: number;
  d: number;
  weekday: string;
  hh: string;
  mm: string;
  key: string;
  sort: number;
  hasClock: boolean;
} {
  if (typeof v === "string") {
    const trimmed = v.trim();
    const naive = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(trimmed);
    if (naive) {
      const y = Number(naive[1]);
      const m = Number(naive[2]);
      const d = Number(naive[3]);
      const hasClock = Boolean(naive[4]);
      const hh = hasClock ? String(naive[4]) : "12";
      const mm = hasClock ? String(naive[5]) : "00";
      const weekday = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(y, m - 1, d, 12)));
      return {
        y,
        m,
        d,
        weekday,
        hh,
        mm,
        key: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        sort: Date.UTC(y, m - 1, d, hasClock ? Number(hh) : 12, hasClock ? Number(mm) : 0),
        hasClock,
      };
    }
  }
  const d = toDate(v);
  const f = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  const month = String(p.month ?? "1");
  const day = String(p.day ?? "1");
  return {
    y: Number(p.year),
    m: Number(month),
    d: Number(day),
    weekday: String(p.weekday ?? ""),
    hh: String(p.hour ?? "00"),
    mm: String(p.minute ?? "00"),
    key: `${p.year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    sort: d.getTime(),
    hasClock: true,
  };
}

/** Parties de date dans le fuseau Paris (compat). */
function parts(d: Date) {
  const w = wallParts(d);
  return {
    y: w.y,
    m: w.m,
    d: w.d,
    weekday: w.weekday,
    hh: w.hh,
    mm: w.mm,
    key: w.key,
  };
}

const dayNum = (d: number) => (d === 1 ? "1er" : String(d));
const monthLong = (m: number, y: number) =>
  new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
const hour = (hh: string, mm: string) => `${Number(hh)}h${mm}`;

type SessionDay = {
  y: number;
  m: number;
  d: number;
  weekday: string;
  ranges: string[];
  sort: number;
};

/** Jours distincts triés (plusieurs créneaux le même jour = 1 jour). */
export function sessionDays(slots: Slot[]): SessionDay[] {
  const map = new Map<string, SessionDay>();
  for (const s of slots) {
    const a = wallParts(s.start);
    const b = s.end ? wallParts(s.end) : null;
    const e =
      map.get(a.key) ??
      ({
        y: a.y,
        m: a.m,
        d: a.d,
        weekday: a.weekday,
        ranges: [],
        sort: a.sort,
      } satisfies SessionDay);
    // Ignore les bornes « midi » artificielles (date seule sans heure).
    if (a.hasClock && b?.hasClock && !(a.hh === "12" && a.mm === "00" && b.hh === "12" && b.mm === "00")) {
      e.ranges.push(`${hour(a.hh, a.mm)} – ${hour(b.hh, b.mm)}`);
    }
    e.sort = Math.min(e.sort, a.sort);
    map.set(a.key, e);
  }
  return [...map.values()].sort((x, y) => x.sort - y.sort);
}

/**
 * Format court pour les petites cases (couverture, devis) — tient sur 2 lignes.
 *   1 jour            → « 4 déc. 2026 »
 *   2 jours           → « 4 et 5 déc. 2026 »
 *   jours consécutifs → « Du 4 au 6 déc. 2026 »
 *   jours épars       → « 4, 11 et 18 déc. 2026 » (≤ 3), sinon « Du 4 déc. au 15 janv. 2027 · 5 jours »
 */
export function formatDatesShort(slots: Slot[]): string {
  const days = sessionDays(slots);
  if (!days.length) return "";
  const first = days[0];
  const last = days[days.length - 1];
  const md = (x: SessionDay, withYear: boolean) =>
    `${dayNum(x.d)} ${MONTHS_SHORT[x.m - 1]}${withYear ? ` ${x.y}` : ""}`;
  if (days.length === 1) return md(first, true);

  const sameMonth = days.every((x) => x.m === first.m && x.y === first.y);
  const sameYear = days.every((x) => x.y === first.y);
  const consecutive = days.every(
    (x, i) =>
      i === 0 ||
      Date.UTC(x.y, x.m - 1, x.d) - Date.UTC(days[i - 1].y, days[i - 1].m - 1, days[i - 1].d) ===
        86_400_000,
  );

  if (sameMonth) {
    const tail = `${MONTHS_SHORT[first.m - 1]} ${first.y}`;
    if (days.length === 2) return `${dayNum(first.d)} et ${dayNum(last.d)} ${tail}`;
    if (consecutive) return `Du ${dayNum(first.d)} au ${dayNum(last.d)} ${tail}`;
    if (days.length <= 3) {
      return `${days
        .slice(0, -1)
        .map((x) => dayNum(x.d))
        .join(", ")} et ${dayNum(last.d)} ${tail}`;
    }
  }
  if (days.length === 2) return `${md(first, !sameYear)} et ${md(last, true)}`;
  const range = `Du ${md(first, !sameYear)} au ${md(last, true)}`;
  return consecutive ? range : `${range} · ${days.length} jours`;
}

/** Format long, une ligne par jour — champ `dates` (art. 02). « Vendredi 4 décembre 2026 » */
export function formatDatesLong(slots: Slot[]): string {
  return sessionDays(slots)
    .map(
      (x) =>
        `${x.weekday.charAt(0).toUpperCase()}${x.weekday.slice(1)} ${dayNum(x.d)} ${monthLong(x.m, x.y)} ${x.y}`,
    )
    .join("\n");
}

/** Horaires — champ `hours`. Identiques chaque jour : « 9h00 – 12h30 et 13h30 – 17h00 », sinon « Variables selon les jours (voir annexe) ». */
export function formatHours(slots: Slot[]): string {
  const days = sessionDays(slots);
  const sigs = [...new Set(days.map((x) => x.ranges.join(" et ")))];
  if (!sigs.length || !sigs[0]) return "";
  return sigs.length === 1 ? sigs[0] : "Variables selon les jours (voir annexe)";
}

/** Déroulé jour par jour pour l'annexe (AnnexData.schedule). */
export function formatSchedule(slots: Slot[]): { label: string; detail: string }[] {
  return sessionDays(slots).map((x, i) => ({
    label: `Jour ${i + 1} · ${x.weekday} ${dayNum(x.d)} ${monthLong(x.m, x.y)} ${x.y}`,
    detail: x.ranges.join(" / "),
  }));
}

/** Durée totale en heures à partir des créneaux — « 14 heures (2 jours) ». */
export function formatDuration(slots: Slot[]): string {
  let ms = 0;
  for (const s of slots) {
    if (s.end) ms += toDate(s.end).getTime() - toDate(s.start).getTime();
  }
  const h = Math.round((ms / 3_600_000) * 2) / 2;
  const n = sessionDays(slots).length;
  const hs = Number.isInteger(h) ? String(h) : String(h).replace(".", ",");
  return h
    ? `${hs} heure${h > 1 ? "s" : ""} (${n} jour${n > 1 ? "s" : ""})`
    : `${n} jour${n > 1 ? "s" : ""}`;
}

/** Date administrative JJ/MM/AAAA (établie le, signée le, devis émis le). */
export function formatDateAdmin(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Convertit les créneaux dossier (slot_date + starts_at/ends_at) vers Slot[]. */
export function slotsFromDocContext(
  slots: Array<{
    slot_date: string;
    starts_at: string | null;
    ends_at: string | null;
  }>,
): Slot[] {
  return slots.map((s) => {
    if (s.starts_at) {
      return { start: s.starts_at, end: s.ends_at ?? undefined };
    }
    return { start: s.slot_date, end: s.ends_at ?? undefined };
  });
}
