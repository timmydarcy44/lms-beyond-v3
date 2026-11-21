/** Helpers Mon planning — calendrier d'alternance + rythme. */

export type AlternanceWeekType = "school" | "company" | "holiday" | "exam";

export const WEEK_TYPE_LABELS: Record<AlternanceWeekType, string> = {
  school: "École",
  company: "Entreprise",
  holiday: "Vacances",
  exam: "Examens",
};

export const WEEK_TYPE_COLORS: Record<AlternanceWeekType, string> = {
  school: "#6E5BFF",
  company: "#5EDCC3",
  holiday: "#2A3150",
  exam: "#F2CF6B",
};

export function isAlternanceWeekType(value: unknown): value is AlternanceWeekType {
  return value === "school" || value === "company" || value === "holiday" || value === "exam";
}

/** Lundi ISO de la semaine contenant `d` (local). */
export function startOfIsoWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 0, 0, 0, 0);
}

export function formatFrDayShort(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }).replace(/\.$/, "");
}

export function formatFrDayLong(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
}

export function formatFrMonth(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "short" }).replace(/\.$/, "");
}

export function formatTimeFr(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "numeric", minute: "2-digit" }).replace(":", " h ");
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfIsoWeek(b).getTime() - startOfIsoWeek(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Liste des lundis inclus entre startsOn et endsOn. */
export function listWeekStarts(startsOn: string, endsOn: string): string[] {
  const start = startOfIsoWeek(parseIsoDate(startsOn));
  const end = parseIsoDate(endsOn);
  const out: string[] = [];
  for (let cur = start; cur <= end; cur = addDays(cur, 7)) {
    out.push(toIsoDate(cur));
  }
  return out;
}

/**
 * Déduit un rythme régulier (ex. « 1 semaine à l'école, 3 semaines en entreprise »).
 * Ignore holiday/exam. Retourne null si irrégulier ou insuffisant.
 */
export function inferAlternanceRhythm(
  weeks: Array<{ week_starts_on: string; week_type: AlternanceWeekType }>,
): string | null {
  const core = weeks
    .filter((w) => w.week_type === "school" || w.week_type === "company")
    .sort((a, b) => a.week_starts_on.localeCompare(b.week_starts_on));
  if (core.length < 4) return null;

  const pattern: AlternanceWeekType[] = [];
  for (const w of core) {
    if (pattern.length === 0) {
      pattern.push(w.week_type);
      continue;
    }
    const expected = pattern[pattern.length % pattern.length];
    // Build candidate period length 2..8 by detecting first repeat of initial type after mix
    void expected;
    pattern.push(w.week_type);
    if (pattern.length >= 8) break;
  }

  // Search shortest period that tiles the sequence
  const seq = core.map((w) => w.week_type);
  for (let period = 2; period <= Math.min(8, Math.floor(seq.length / 2)); period++) {
    const unit = seq.slice(0, period);
    let ok = true;
    for (let i = 0; i < seq.length; i++) {
      if (seq[i] !== unit[i % period]) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const school = unit.filter((t) => t === "school").length;
    const company = unit.filter((t) => t === "company").length;
    if (school === 0 || company === 0) continue;
    const schoolLabel = school === 1 ? "1 semaine à l'école" : `${school} semaines à l'école`;
    const companyLabel =
      company === 1 ? "1 semaine en entreprise" : `${company} semaines en entreprise`;
    return `${schoolLabel}, ${companyLabel}`;
  }
  return null;
}

export function yearLabelFromDates(startsOn: string | null, endsOn: string | null): string | null {
  if (!startsOn || !endsOn) return null;
  const a = parseIsoDate(startsOn).getFullYear();
  const b = parseIsoDate(endsOn).getFullYear();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a === b ? String(a) : `${a}-${b}`;
}

export function fillPatternWeeks(params: {
  fromWeekStartsOn: string;
  untilEndsOn: string;
  schoolWeeks: number;
  companyWeeks: number;
}): Array<{ week_starts_on: string; week_type: AlternanceWeekType }> {
  const school = Math.max(0, Math.floor(params.schoolWeeks));
  const company = Math.max(0, Math.floor(params.companyWeeks));
  if (school + company === 0) return [];
  const weeks = listWeekStarts(params.fromWeekStartsOn, params.untilEndsOn);
  const cycle = school + company;
  return weeks.map((week_starts_on, i) => {
    const pos = i % cycle;
    return {
      week_starts_on,
      week_type: (pos < school ? "school" : "company") as AlternanceWeekType,
    };
  });
}

export type UpcomingKind = "evaluation" | "booklet" | "holiday" | "exam" | "school" | "company";

export function sessionBadge(eventType: string | null | undefined): {
  label: string;
  color: string;
  bar: string;
} {
  if (eventType === "evaluation" || eventType === "exam") {
    return { label: "Évaluation", color: "#F2CF6B", bar: "#F2CF6B" };
  }
  if (eventType === "project") {
    return { label: "Projet", color: "#6E5BFF", bar: "#6E5BFF" };
  }
  if (eventType === "referent") {
    return { label: "Référent", color: "#C9C2FF", bar: "#6E5BFF" };
  }
  return { label: "École", color: "#6E5BFF", bar: "#6E5BFF" };
}
