/** Grâce « à l'heure » après la référence de ponctualité (minutes). */
export const ATTENDANCE_PUNCTUALITY_GRACE_MINUTES = 5;

export type PunctualityInput = {
  /** Début planifié du créneau. */
  startsAt: string | Date | null | undefined;
  /** Ouverture réelle de l'émargement (launch.opened_at). */
  openedAt: string | Date | null | undefined;
  /** Horodatage de signature. */
  signedAt?: string | Date | null;
  graceMinutes?: number;
};

export type PunctualityResult = {
  punctualityRefAt: Date;
  minutesLate: number;
  minutesAfterScheduledStart: number | null;
  onTime: boolean;
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Référence = max(début créneau, ouverture émargement).
 * Si le formateur lance après l'horaire, la salle n'est pas pénalisée.
 * Si le formateur lance avant, la grâce part du début planifié.
 */
export function computePunctuality(input: PunctualityInput): PunctualityResult {
  const startsAt = toDate(input.startsAt);
  const openedAt = toDate(input.openedAt);
  const signedAt = toDate(input.signedAt) ?? new Date();
  const graceMinutes = input.graceMinutes ?? ATTENDANCE_PUNCTUALITY_GRACE_MINUTES;

  let punctualityRefAt: Date;
  if (startsAt && openedAt) {
    punctualityRefAt = startsAt.getTime() >= openedAt.getTime() ? startsAt : openedAt;
  } else {
    punctualityRefAt = openedAt ?? startsAt ?? signedAt;
  }

  const graceEndMs = punctualityRefAt.getTime() + graceMinutes * 60_000;
  const lateMs = Math.max(0, signedAt.getTime() - graceEndMs);
  const minutesLate = Math.ceil(lateMs / 60_000);

  const minutesAfterScheduledStart = startsAt
    ? Math.max(0, Math.ceil((signedAt.getTime() - startsAt.getTime()) / 60_000))
    : null;

  return {
    punctualityRefAt,
    minutesLate,
    minutesAfterScheduledStart,
    onTime: minutesLate === 0,
  };
}
