/** Dates / noms FR pour Qualité réclamations v2. */

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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function sentenceCaseName(raw: string | null | undefined): string {
  const s = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!s) return "";
  return s
    .split(" ")
    .map((part) => {
      if (!part) return part;
      if (part === part.toUpperCase() && part.length > 1) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export function formatFrDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const h = `${d.getHours()} h ${pad2(d.getMinutes())}`;
  if (sameDay) return `aujourd'hui à ${h}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isY =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isY) return `hier à ${h}`;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} à ${h}`;
}

export function formatFrDateShort(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** Date calendaire FR avec année (procédures / prochaines revues). */
export function formatFrDateWithYear(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const raw = typeof iso === "string" ? iso.slice(0, 10) : null;
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, day] = raw.split("-").map(Number);
    return `${day} ${MONTHS_SHORT[(m ?? 1) - 1]} ${y}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Compare une date ISO `YYYY-MM-DD` (ou Date) au jour calendaire local.
 * true seulement si la date est strictement avant aujourd’hui.
 */
export function isDateOnlyBeforeToday(iso: string | Date | null | undefined): boolean {
  if (!iso) return false;
  const raw =
    typeof iso === "string"
      ? iso.slice(0, 10)
      : `${iso.getFullYear()}-${String(iso.getMonth() + 1).padStart(2, "0")}-${String(iso.getDate()).padStart(2, "0")}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return raw < today;
}

export function formatRelativeFr(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return formatFrDateShort(d);
}

export function formatDurationHours(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) return "—";
  if (hours < 24) return `${Math.round(hours)} h`;
  const d = Math.round(hours / 24);
  return `${d} j`;
}
