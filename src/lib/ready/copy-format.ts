/** Valeurs normalisées pour copier-coller dans les portails OPCO. */

export function copySiret(value: string | null | undefined): string {
  return String(value || "").replace(/\D/g, "").slice(0, 14);
}

export function displaySiret(value: string | null | undefined): string {
  const d = copySiret(value);
  if (d.length !== 14) return d || "—";
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
}

export function copyDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    // déjà JJ/MM/AAAA ?
    const m = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? String(value) : "";
  }
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function copyAmountCents(cents: number | null | undefined): string {
  if (cents == null || Number.isNaN(Number(cents))) return "";
  return (Number(cents) / 100).toFixed(2).replace(".", ",");
}

export function displayAmountCents(cents: number | null | undefined): string {
  const v = copyAmountCents(cents);
  return v ? `${v} €` : "—";
}

export function copyDurationHours(hours: number | null | undefined): string {
  if (hours == null || Number.isNaN(Number(hours))) return "";
  return String(Math.round(Number(hours) * 100) / 100);
}

export function copyIban(iban: string | null | undefined): string {
  return String(iban || "").replace(/\s+/g, "").toUpperCase();
}

export function maskIban(iban: string | null | undefined): string {
  const clean = copyIban(iban);
  if (clean.length < 8) return clean || "—";
  return `${"•".repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const end = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.ceil((end - start) / (24 * 60 * 60 * 1000));
}
