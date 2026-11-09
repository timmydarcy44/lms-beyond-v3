/**
 * Format monétaire FR partagé page publique + PDF.
 * Remplace U+202F / U+00A0 (Intl fr-FR) par une espace ASCII pour Helvetica/WinAnsi.
 */

const SPACE_LIKE = /[\u202f\u00a0\u2009\u2007\u2008\u200a]/g;

export function normalizeMoneyText(text: string): string {
  return String(text || "")
    .replace(SPACE_LIKE, " ")
    .replace(/\u2212/g, "-")
    .replace(/[–—]/g, "-")
    .trim();
}

/** Centimes → « 2 490,00 € » (espaces ASCII, jamais U+202F). */
export function formatEuro(cents: number): string {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "—";
  return normalizeMoneyText(
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(n / 100),
  );
}

/** Alias historique — même comportement que formatEuro. */
export function formatEuroFromCents(cents: number): string {
  return formatEuro(cents);
}

export function formatEuroOrDash(cents: number | null | undefined): string {
  if (cents == null || Number.isNaN(Number(cents))) return "—";
  return formatEuro(Number(cents));
}
