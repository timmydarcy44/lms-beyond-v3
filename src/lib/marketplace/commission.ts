const DEFAULT_RATE = 0.15;

export function getBeyondCommissionRate(): number {
  const raw = process.env.BEYOND_COMMISSION_RATE?.trim();
  if (!raw) return DEFAULT_RATE;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return DEFAULT_RATE;
  return n;
}

export function splitSessionAmount(montantTotalCents: number) {
  const rate = getBeyondCommissionRate();
  const commissionBeyond = Math.round(montantTotalCents * rate);
  const montantPraticien = montantTotalCents - commissionBeyond;
  return { commissionBeyond, montantPraticien, rate };
}

export function formatEurosFromCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
