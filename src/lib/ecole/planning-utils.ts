/** Helpers métier planning école EDGE */

export function hoursBetween(startsAt: string | Date, endsAt: string | Date): number {
  const a = new Date(startsAt).getTime();
  const b = new Date(endsAt).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round(((b - a) / 3_600_000) * 100) / 100;
}

export function remainingHours(total: number, planned: number): number {
  return Math.round((Number(total) - Number(planned)) * 100) / 100;
}

export type SlotConflictKind = "instructor" | "class" | "room" | "range" | "overbook";

export type SlotConflict = {
  kind: SlotConflictKind;
  message: string;
};

export type PlanningSlotRow = {
  id?: string;
  instructor_id?: string | null;
  class_id: string;
  room_id?: string | null;
  module_id: string;
  starts_at: string;
  ends_at: string;
  duration_hours: number;
  status?: string;
};

export function detectSlotConflicts(params: {
  candidate: PlanningSlotRow;
  existing: PlanningSlotRow[];
  instructorName?: string | null;
  moduleTotalHours?: number | null;
  modulePlannedHoursExcludingCandidate?: number | null;
}): SlotConflict[] {
  const { candidate, existing, instructorName, moduleTotalHours, modulePlannedHoursExcludingCandidate } =
    params;
  const conflicts: SlotConflict[] = [];
  const start = new Date(candidate.starts_at).getTime();
  const end = new Date(candidate.ends_at).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    conflicts.push({ kind: "range", message: "Créneau incohérent : l’heure de fin doit être après le début." });
    return conflicts;
  }

  const overlaps = (o: PlanningSlotRow) => {
    if (o.status === "cancelled") return false;
    if (candidate.id && o.id === candidate.id) return false;
    const os = new Date(o.starts_at).getTime();
    const oe = new Date(o.ends_at).getTime();
    return start < oe && end > os;
  };

  for (const o of existing) {
    if (!overlaps(o)) continue;
    if (candidate.instructor_id && o.instructor_id && candidate.instructor_id === o.instructor_id) {
      const who = instructorName?.trim() || "Ce formateur";
      const day = new Date(o.starts_at).toLocaleDateString("fr-FR", { weekday: "long" });
      const from = new Date(o.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      const to = new Date(o.ends_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      conflicts.push({
        kind: "instructor",
        message: `${who} est déjà affecté à un cours le ${day} de ${from} à ${to}.`,
      });
    }
    if (candidate.class_id === o.class_id) {
      conflicts.push({
        kind: "class",
        message: "Cette classe a déjà un cours sur ce créneau.",
      });
    }
    if (candidate.room_id && o.room_id && candidate.room_id === o.room_id) {
      conflicts.push({
        kind: "room",
        message: "Cette salle est déjà réservée sur ce créneau.",
      });
    }
  }

  if (
    moduleTotalHours != null &&
    modulePlannedHoursExcludingCandidate != null &&
    Number(moduleTotalHours) > 0
  ) {
    const nextPlanned = Number(modulePlannedHoursExcludingCandidate) + Number(candidate.duration_hours);
    if (nextPlanned > Number(moduleTotalHours) + 0.001) {
      conflicts.push({
        kind: "overbook",
        message: `Le volume planifié (${nextPlanned} h) dépasserait le volume pédagogique prévu (${moduleTotalHours} h).`,
      });
    }
  }

  return conflicts;
}

export function formatWeekRangeLabel(anchor: Date): string {
  const start = new Date(anchor);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return `${start.toLocaleDateString("fr-FR", opts)} — ${end.toLocaleDateString("fr-FR", opts)}`;
}
