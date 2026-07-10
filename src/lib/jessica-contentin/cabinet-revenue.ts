/** Tarif horaire cabinet Jessica Contentin (€/h) */
export const JESSICA_CABINET_HOURLY_RATE = 75;

export const JESSICA_CABINET_YEAR_2026 = {
  start: "2026-01-01T00:00:00+01:00",
  end: "2026-12-31T23:59:59+01:00",
};

export function isCountableCabinetAppointment(status: string, endIso: string, now = new Date()): boolean {
  if (status === "cancelled") return false;
  const end = new Date(endIso);
  return end <= now && ["confirmed", "completed", "pending"].includes(status);
}

export function appointmentDurationHours(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return (end - start) / (1000 * 60 * 60);
}

export function appointmentRevenue(startIso: string, endIso: string, hourlyRate = JESSICA_CABINET_HOURLY_RATE): number {
  return Math.round(appointmentDurationHours(startIso, endIso) * hourlyRate * 100) / 100;
}

export function extractEmailFromAppointmentNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}
