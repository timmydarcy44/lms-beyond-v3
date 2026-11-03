export type ModuleOpenMode = "immediate" | "date" | "enrollment" | "previous";
export type ModuleOpenUnit = "days" | "weeks";

export type ModuleOpenRule = {
  mode: ModuleOpenMode;
  date: string | null;
  amount: number;
  unit: ModuleOpenUnit;
};

export type ScheduleLesson = { id?: string };
export type ScheduleModule = {
  lessons?: ScheduleLesson[];
  openRule?: Partial<ModuleOpenRule> | null;
};

export type ScheduleContext = {
  now: number;
  ready: boolean;
  /** undefined : date d’inscription inconnue. null : pas d’inscription. */
  enrolledAt?: number | null;
  completedAt: Record<string, number>;
  isDone: (lessonId: string) => boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function readModuleOpenRule(raw: unknown): ModuleOpenRule {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const mode: ModuleOpenMode =
    row.mode === "date" || row.mode === "enrollment" || row.mode === "previous" ? row.mode : "immediate";
  const date = typeof row.date === "string" && DATE_RE.test(row.date) ? row.date : null;
  const amountRaw = Number(row.amount);
  const amount = Number.isFinite(amountRaw) ? Math.min(104, Math.max(0, Math.round(amountRaw))) : 1;
  const unit: ModuleOpenUnit = row.unit === "days" ? "days" : "weeks";
  return { mode, date, amount, unit };
}

export function parisDay(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

export function formatOpenDay(ms: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(ms));
}

export function formatOpenDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return formatOpenDay(Date.UTC(year, month - 1, day, 12));
}

function delayWords(amount: number, unit: ModuleOpenUnit): string {
  const count = Math.max(0, Math.round(amount));
  if (count === 0) return "";
  if (unit === "weeks") return count === 1 ? "1 semaine" : `${count} semaines`;
  return count === 1 ? "1 jour" : `${count} jours`;
}

export function moduleOpenChip(rule: ModuleOpenRule): string {
  if (rule.mode === "immediate") return "";
  if (rule.mode === "date") return rule.date ? `Ouvert le ${formatOpenDate(rule.date)}` : "Date à choisir";
  const delay = delayWords(rule.amount, rule.unit);
  if (rule.mode === "enrollment") return delay ? `${delay} après l’inscription` : "Dès l’inscription";
  return delay ? `${delay} après le module précédent` : "À la fin du module précédent";
}

export function moduleOpenPreview(rule: ModuleOpenRule): string {
  if (rule.mode === "immediate") return "Ce module s’ouvre immédiatement.";
  if (rule.mode === "date") {
    return rule.date ? `Ce module s’ouvre le ${formatOpenDate(rule.date)}.` : "Choisis la date d’ouverture.";
  }
  const delay = delayWords(rule.amount, rule.unit);
  if (rule.mode === "enrollment") {
    return delay ? `Ce module s’ouvre ${delay} après l’inscription.` : "Ce module s’ouvre dès l’inscription.";
  }
  return delay
    ? `Ce module s’ouvre ${delay} après la fin du module précédent.`
    : "Ce module s’ouvre à la fin du module précédent.";
}

function addDelay(fromMs: number, amount: number, unit: ModuleOpenUnit): number {
  const days = unit === "weeks" ? amount * 7 : amount;
  return fromMs + days * 86_400_000;
}

function lessonIds(module: ScheduleModule | undefined): string[] {
  return (module?.lessons ?? []).map((lesson) => String(lesson.id ?? "").trim()).filter(Boolean);
}

/** Dernier horodatage de fin, ou 0 si tout est terminé sans date connue. null si le module n’est pas fini. */
export function moduleFinishedAt(module: ScheduleModule | undefined, ctx: ScheduleContext): number | null {
  const ids = lessonIds(module);
  if (!ids.length || !ids.every((id) => ctx.isDone(id))) return null;
  const times = ids.map((id) => ctx.completedAt[id]).filter((value) => Number.isFinite(value));
  if (!times.length) return 0;
  return Math.max(...times);
}

export function scheduleLockForModule(
  modules: ScheduleModule[],
  moduleIndex: number,
  ctx: ScheduleContext,
): string | null {
  if (moduleIndex < 0 || moduleIndex >= modules.length) return null;
  const rule = readModuleOpenRule(modules[moduleIndex]?.openRule);
  if (rule.mode === "immediate") return null;
  if (rule.mode === "previous" && moduleIndex === 0) return null;

  if (rule.mode === "date") {
    if (!rule.date) return "Ce module s’ouvre à une date précise.";
    if (parisDay(ctx.now) >= rule.date) return null;
    return `Ce module s’ouvre le ${formatOpenDate(rule.date)}.`;
  }

  const delay = delayWords(rule.amount, rule.unit);
  if (rule.mode === "enrollment") {
    if (!ctx.ready) {
      return delay ? `Ce module s’ouvre ${delay} après ton inscription.` : "Ce module s’ouvre dès ton inscription.";
    }
    if (ctx.enrolledAt === undefined) return null;
    if (ctx.enrolledAt == null) {
      return delay ? `Ce module s’ouvre ${delay} après ton inscription.` : "Ce module s’ouvre dès ton inscription.";
    }
    const opens = addDelay(ctx.enrolledAt, rule.amount, rule.unit);
    if (ctx.now >= opens) return null;
    return `Ce module s’ouvre le ${formatOpenDay(opens)}.`;
  }

  const finished = ctx.ready ? moduleFinishedAt(modules[moduleIndex - 1], ctx) : null;
  if (!ctx.ready || finished == null) {
    return delay
      ? `Ce module s’ouvre ${delay} après la fin du module précédent.`
      : "Ce module s’ouvre à la fin du module précédent.";
  }
  const opens = addDelay(finished, rule.amount, rule.unit);
  if (ctx.now >= opens) return null;
  return `Ce module s’ouvre le ${formatOpenDay(opens)}.`;
}

export function scheduleLockForLesson(
  modules: ScheduleModule[],
  lessonId: string,
  ctx: ScheduleContext,
): string | null {
  const index = modules.findIndex((module) =>
    (module.lessons ?? []).some((lesson) => String(lesson.id ?? "") === lessonId),
  );
  return scheduleLockForModule(modules, index, ctx);
}
