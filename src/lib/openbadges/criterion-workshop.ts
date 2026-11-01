import { sentenceCount, wordCount } from "@/lib/openbadges/badge-quality";

const FORBIDDEN = /^(comprendre|connaitre|connaître|participer|savoir|etre|être)$/i;

export const SHORT_PRESENTATION_MESSAGE = "Décrivez un peu plus ce que le badge atteste pour obtenir de meilleurs critères.";

/** Bouton de proposition : caché tant que le nom et l'attestation manquent, sauf si une formation est liée. */
export function proposeButtonState(input: {
  name: string;
  description: string;
  courseId?: string | null;
  keptCount: number;
}): "hidden" | "short" | "propose" | "more" {
  if (!input.courseId) {
    if (!input.name.trim() || !input.description.trim()) return "hidden";
    if (presentationIsShort(input.description)) return "short";
  }
  return input.keptCount > 0 ? "more" : "propose";
}

export type WorkshopCriterion = {
  label: string;
  expectedOutcome: string;
  source: string;
  competency?: string;
};

export function presentationIsShort(text: string): boolean {
  return sentenceCount(text) < 2;
}

export function formatSectionSource(index: number, title: string): string {
  const clean = title.replace(/\s·\s*\d+(?:[.,]\d+)?\s*h\s*$/i, "").trim();
  return `Section ${index} · ${clean}`;
}

function share(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

/** Rattache chaque critère à une section réelle ou à une phrase réelle de la présentation. */
export function bindCriterionSource(
  source: string,
  context: { sections?: Array<{ index: number; title: string }>; presentation?: string },
): string {
  const raw = source.trim();
  const sections = context.sections ?? [];
  if (sections.length) {
    const numbered = raw.match(/section\s+(\d+)/i);
    if (numbered) {
      const found = sections.find((section) => section.index === Number(numbered[1]));
      if (found) return formatSectionSource(found.index, found.title);
    }
    const found = sections.find((section) => share(raw, section.title) >= 0.5);
    return found ? formatSectionSource(found.index, found.title) : "";
  }
  const presentation = context.presentation?.trim() ?? "";
  if (!presentation) return raw;
  const sentences = presentation.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 12);
  const direct = sentences.find((sentence) => {
    const left = sentence.toLowerCase();
    const right = raw.toLowerCase();
    return left.includes(right.slice(0, 40)) || right.includes(left.slice(0, 40));
  });
  if (direct) return direct;
  const ranked = sentences.map((sentence) => ({ sentence, score: share(raw, sentence) })).sort((a, b) => b.score - a.score);
  return ranked[0] && ranked[0].score >= 0.34 ? ranked[0].sentence : "";
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 4),
  );
}

function overlaps(left: string, right: string): boolean {
  const a = tokens(left);
  const b = tokens(right);
  if (a.size === 0 || b.size === 0) return false;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size) >= 0.6;
}

function oneVerb(label: string): boolean {
  const head = label.split(/[,:;]/)[0] ?? label;
  return !/^\S+\s+et\s+/i.test(head.trim());
}

/** Garde 4 à 6 critères observables, à un seul verbe, sans chevauchement, avec un attendu discriminant. */
export function workshopCriteria(items: WorkshopCriterion[], locked: WorkshopCriterion[] = []): { kept: WorkshopCriterion[]; issues: string[] } {
  const issues: string[] = [];
  const kept: WorkshopCriterion[] = [...locked];
  const fresh: WorkshopCriterion[] = [];
  for (const item of items) {
    const label = item.label.trim();
    const expectedOutcome = item.expectedOutcome.trim();
    const source = item.source.trim();
    const competency = item.competency?.trim() ?? "";
    const first = label.split(/\s+/)[0]?.normalize("NFD").replace(/\p{M}/gu, "") ?? "";
    if (!label || FORBIDDEN.test(label.split(/\s+/)[0] ?? "") || FORBIDDEN.test(first)) {
      issues.push(`« ${label || "Critère"} » ne commence pas par un verbe observable.`);
      continue;
    }
    if (!oneVerb(label)) {
      issues.push(`« ${label} » contient deux actions. Un seul verbe.`);
      continue;
    }
    if (/\bau moins\b|\d+/i.test(label)) {
      issues.push(`« ${label} » publie un seuil. Le seuil reste dans l'attendu.`);
      continue;
    }
    if (wordCount(expectedOutcome) < 15 || !/\bau moins\b/i.test(expectedOutcome)) {
      issues.push(`L'attendu de « ${label} » ne dit pas ce que l'expert doit voir.`);
      continue;
    }
    if (!source) {
      issues.push(`« ${label} » n'a pas de source.`);
      continue;
    }
    if (kept.some((previous) => overlaps(previous.label, label))) {
      issues.push(`« ${label} » recoupe un critère déjà retenu.`);
      continue;
    }
    const accepted = { label, expectedOutcome, source, competency };
    kept.push(accepted);
    fresh.push(accepted);
    if (kept.length === 6) break;
  }
  if (kept.length < 4) issues.push(`${kept.length} critères solides, il en faut 4 à 6.`);
  return { kept: fresh, issues };
}
