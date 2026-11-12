import type { TrainingProgramSection } from "@/lib/training-courses/cms-types";

export type HalfDayPart = "matin" | "apres_midi";

export type SessionSlot = {
  day: number;
  part: HalfDayPart;
  label: string;
  sectionIndexes: number[];
  sections: TrainingProgramSection[];
};

export type DurationEstimate = {
  raw: string;
  /** Jours calendaires de formation (min 1). */
  days: number;
  /** Demi-journées = Matinée/Après-midi (jours × 2). */
  halfDays: number;
  /** Heures estimées (7h/jour par défaut). */
  hours: number;
};

export type DensityTargets = {
  minSections: number;
  maxSections: number;
  minChaptersPerSection: number;
  minSubchaptersPerChapter: number;
  minChaptersTotal: number;
  minSubchaptersTotal: number;
};

/** Parse "2 jours", "14 h", "14 heures", "1,5 jour", etc. */
export function parseFormationDuration(raw: string | null | undefined): DurationEstimate {
  const text = String(raw ?? "").trim().toLowerCase().replace(",", ".");
  if (!text) {
    return { raw: "2 jours", days: 2, halfDays: 4, hours: 14 };
  }

  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*h(?:eures?)?\b/);
  if (hoursMatch) {
    const hours = Math.max(3.5, Number(hoursMatch[1]));
    const days = Math.max(1, Math.round(hours / 7));
    return { raw: text, days, halfDays: days * 2, hours };
  }

  const daysMatch = text.match(/(\d+(?:\.\d+)?)\s*jours?\b/);
  if (daysMatch) {
    const daysFloat = Math.max(0.5, Number(daysMatch[1]));
    const days = Math.max(1, Math.ceil(daysFloat));
    return { raw: text, days, halfDays: days * 2, hours: daysFloat * 7 };
  }

  // Fallback numérique seul → jours
  const num = Number(text.replace(/[^\d.]/g, ""));
  if (Number.isFinite(num) && num > 0) {
    if (num >= 6) {
      // probablement des heures
      const hours = num;
      const days = Math.max(1, Math.round(hours / 7));
      return { raw: text, days, halfDays: days * 2, hours };
    }
    const days = Math.max(1, Math.ceil(num));
    return { raw: text, days, halfDays: days * 2, hours: days * 7 };
  }

  return { raw: text || "2 jours", days: 2, halfDays: 4, hours: 14 };
}

/**
 * Densité pédagogique attendue pour une durée donnée.
 * Ex. 14 h / 2 j → ~6–8 sections, 3+ chapitres, 3–4 sous-chapitres.
 */
export function densityTargetsForDuration(duration: DurationEstimate): DensityTargets {
  const days = duration.days;
  const minSections = Math.max(4, days * 3); // 1j=4, 2j=6, 3j=9
  const maxSections = Math.max(minSections + 2, days * 4); // 1j=6, 2j=8, 3j=12
  const minChaptersPerSection = 3;
  const minSubchaptersPerChapter = days >= 2 ? 4 : 3;
  return {
    minSections,
    maxSections,
    minChaptersPerSection,
    minSubchaptersPerChapter,
    minChaptersTotal: minSections * minChaptersPerSection,
    minSubchaptersTotal: minSections * minChaptersPerSection * minSubchaptersPerChapter,
  };
}

export function slotLabel(day: number, part: HalfDayPart): string {
  return part === "matin" ? `Matinée ${day}` : `Après-midi ${day}`;
}

/**
 * Répartit les sections sur Matinée 1 / Après-midi 1 / Matinée 2…
 * Ex. 6 sections sur 2 jours (4 demi-journées) :
 * Matinée 1 → S1+S2, Après-midi 1 → S3, Matinée 2 → S4+S5, Après-midi 2 → S6
 */
export function buildSessionPlan(
  sections: TrainingProgramSection[],
  durationRaw: string | null | undefined,
): SessionSlot[] {
  const duration = parseFormationDuration(durationRaw);
  const halfDays = Math.max(1, duration.halfDays);
  const n = sections.length;
  if (n === 0) {
    return Array.from({ length: halfDays }, (_, i) => {
      const day = Math.floor(i / 2) + 1;
      const part: HalfDayPart = i % 2 === 0 ? "matin" : "apres_midi";
      return {
        day,
        part,
        label: slotLabel(day, part),
        sectionIndexes: [],
        sections: [],
      };
    });
  }

  const base = Math.floor(n / halfDays);
  let remainder = n % halfDays;
  const slots: SessionSlot[] = [];
  let cursor = 0;

  for (let i = 0; i < halfDays; i += 1) {
    const day = Math.floor(i / 2) + 1;
    const part: HalfDayPart = i % 2 === 0 ? "matin" : "apres_midi";
    // Les premières demi-journées reçoivent +1 section si reste.
    const count = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    const sectionIndexes = Array.from({ length: count }, (_, k) => cursor + k).filter(
      (idx) => idx < n,
    );
    cursor += count;
    slots.push({
      day,
      part,
      label: slotLabel(day, part),
      sectionIndexes,
      sections: sectionIndexes.map((idx) => sections[idx]!).filter(Boolean),
    });
  }

  // Si des sections restent (arrondi), les coller sur le dernier créneau.
  if (cursor < n && slots.length) {
    const last = slots[slots.length - 1]!;
    for (let idx = cursor; idx < n; idx += 1) {
      last.sectionIndexes.push(idx);
      last.sections.push(sections[idx]!);
    }
  }

  return slots;
}

export function describeDensityForPrompt(duration: DurationEstimate, targets: DensityTargets): string {
  const slots = Array.from({ length: duration.halfDays }, (_, i) => {
    const day = Math.floor(i / 2) + 1;
    const part: HalfDayPart = i % 2 === 0 ? "matin" : "apres_midi";
    return slotLabel(day, part);
  }).join(", ");

  return [
    `Durée estimée : ${duration.hours} h ≈ ${duration.days} jour(s) = ${duration.halfDays} demi-journées (${slots}).`,
    `Densité OBLIGATOIRE : ${targets.minSections} à ${targets.maxSections} SECTIONS,`,
    `chaque section ≥ ${targets.minChaptersPerSection} CHAPITRES,`,
    `chaque chapitre ≥ ${targets.minSubchaptersPerChapter} SOUS-CHAPITRES.`,
    `Minimum global : ${targets.minChaptersTotal} chapitres et ${targets.minSubchaptersTotal} sous-chapitres.`,
    `Pense le programme pour qu'il se découpe naturellement en ${slots} (plusieurs sections par demi-journée si besoin).`,
    `Une demi-journée ≈ 3h30 : prévoir assez de matière (mise en situation, cas, quiz, debrief).`,
  ].join(" ");
}
