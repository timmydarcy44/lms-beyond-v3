/** Tarif horaire cabinet Jessica Contentin (€/h) */
export const JESSICA_CABINET_HOURLY_RATE = 75;

/** Durée moyenne estimée par RDV quand seul le décompte Doctolib est disponible */
export const JESSICA_DEFAULT_APPOINTMENT_HOURS = 1;

export const JESSICA_CABINET_YEAR_2026 = {
  start: "2026-01-01T00:00:00+01:00",
  end: "2026-12-31T23:59:59+01:00",
};

export type PatientCabinetRevenueLike = {
  totalRevenue: number;
  year2026Revenue: number;
  appointmentHours: number;
  appointmentCount: number;
};

export function isCountableCabinetAppointment(status: string, endIso: string, now = new Date()): boolean {
  if (status === "cancelled") return false;
  const end = new Date(endIso);
  if (Number.isNaN(end.getTime())) return false;
  return end <= now && ["confirmed", "completed", "pending"].includes(status);
}

export function appointmentDurationHours(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return (end - start) / (1000 * 60 * 60);
}

export function appointmentRevenue(startIso: string, endIso: string, hourlyRate = JESSICA_CABINET_HOURLY_RATE): number {
  const hours = appointmentDurationHours(startIso, endIso);
  if (hours <= 0) return 0;
  return Math.round(hours * hourlyRate * 100) / 100;
}

/** Estime le CA cabinet à partir du décompte Doctolib (1h / RDV par défaut). */
export function estimateCabinetRevenueFromPastCount(
  pastAppointmentsCount: number,
  lastAppointmentAt?: string | null,
): PatientCabinetRevenueLike {
  const count = Math.max(0, pastAppointmentsCount || 0);
  if (count === 0) {
    return { totalRevenue: 0, year2026Revenue: 0, appointmentHours: 0, appointmentCount: 0 };
  }

  const hours = count * JESSICA_DEFAULT_APPOINTMENT_HOURS;
  const revenue = Math.round(hours * JESSICA_CABINET_HOURLY_RATE * 100) / 100;

  const yearStart = new Date(JESSICA_CABINET_YEAR_2026.start);
  const yearEnd = new Date(JESSICA_CABINET_YEAR_2026.end);
  let year2026Revenue = 0;
  if (lastAppointmentAt) {
    const last = new Date(lastAppointmentAt);
    if (!Number.isNaN(last.getTime()) && last >= yearStart && last <= yearEnd) {
      year2026Revenue = revenue;
    }
  }

  return {
    totalRevenue: revenue,
    year2026Revenue,
    appointmentHours: hours,
    appointmentCount: count,
  };
}

export function resolvePatientCabinetRevenue(
  measured: PatientCabinetRevenueLike,
  pastAppointmentsCount: number,
  lastAppointmentAt?: string | null,
): PatientCabinetRevenueLike {
  const safeMeasured: PatientCabinetRevenueLike = {
    totalRevenue: Math.max(0, measured.totalRevenue),
    year2026Revenue: Math.max(0, measured.year2026Revenue),
    appointmentHours: Math.max(0, measured.appointmentHours),
    appointmentCount: measured.appointmentCount,
  };

  if (safeMeasured.appointmentCount > 0 && safeMeasured.totalRevenue > 0) {
    return safeMeasured;
  }

  return estimateCabinetRevenueFromPastCount(pastAppointmentsCount, lastAppointmentAt);
}

export function extractEmailFromAppointmentNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}
