import type { OfferDiffusion, RecruitmentStep, RequestedDocuments, ScreeningQuestion } from "@/lib/entreprise/offer-candidature";
import { parseLegacySalary, readLegacyBenefits, type OfferBenefit, type SalaryPeriod } from "@/lib/entreprise/offer-conditions";
import type { OfferChecklistInput } from "@/lib/entreprise/offer-publish";
import { WORK_MODES } from "@/lib/entreprise/offer-publish";

export type OfferPoste = OfferChecklistInput & {
  status?: string | null;
  contract_duration?: string | null;
  diploma_prepared?: string | null;
  alternance_school?: string | null;
  work_rhythm?: string | null;
  experience_level?: string | null;
  education_level?: string | null;
  requirements?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_period?: SalaryPeriod | null;
  hours_per_week?: number | null;
  start_label?: string | null;
  headcount?: number | null;
  benefits?: OfferBenefit[] | null;
  recruitment_steps?: RecruitmentStep[] | null;
  requested_documents?: RequestedDocuments | null;
  screening_questions?: ScreeningQuestion[] | null;
  application_deadline?: string | null;
  diffusion?: OfferDiffusion | null;
};

export function foldRequirementsIntoDescription(description: string, requirements: string) {
  const extra = requirements.trim();
  const base = description.trim();
  if (!extra || base.includes(extra)) return base;
  return [base, extra].filter(Boolean).join("\n\n");
}

export function readLegacyWorkMode(description: string) {
  const match = description.match(/Modalité\s*:\s*([^\n]+)/i) ?? description.match(/Télétravail\s*:\s*([^\n]+)/i);
  const raw = match?.[1]?.trim().toLowerCase() ?? "";
  if (!raw) return "";
  if (raw.includes("hybrid")) return "Hybride";
  if (raw.includes("télé") || raw.includes("tele") || raw.includes("remote") || raw.includes("distance")) return "Télétravail";
  if (raw.includes("site") || raw.includes("présent")) return "Sur site";
  const exact = WORK_MODES.find((mode) => mode.toLowerCase() === raw);
  return exact ?? "";
}

export function descriptionWithoutLegacyMode(description: string) {
  return description
    .replace(/\n*Modalité\s*:\s*[^\n]+/i, "")
    .replace(/\n*Télétravail\s*:\s*[^\n]+/i, "")
    .trim();
}

export function preparePosteDraft(row: OfferPoste): { draft: OfferPoste; folded: boolean } {
  const requirements = String(row.requirements ?? "");
  const merged = foldRequirementsIntoDescription(String(row.description ?? ""), requirements);
  const folded = merged !== String(row.description ?? "").trim();
  const legacyMode = String(row.work_mode ?? "").trim() || readLegacyWorkMode(String(row.description ?? ""));
  return {
    folded: folded || Boolean(legacyMode && !row.work_mode),
    draft: {
      ...row,
      description: legacyMode ? descriptionWithoutLegacyMode(merged) : merged,
      work_mode: legacyMode || row.work_mode || "",
      requirements: folded ? "" : requirements,
    },
  };
}

function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function prepareConditions(row: OfferPoste): { draft: OfferPoste; folded: boolean } {
  let folded = false;
  const draft: OfferPoste = {
    ...row,
    salary_min: numeric(row.salary_min),
    salary_max: numeric(row.salary_max),
    hours_per_week: numeric(row.hours_per_week),
    headcount: numeric(row.headcount),
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
  };
  if ((draft.salary_min == null || draft.salary_min <= 0) && String(row.salary_range ?? "").trim()) {
    const parsed = parseLegacySalary(String(row.salary_range));
    if (parsed.min) {
      draft.salary_min = parsed.min;
      draft.salary_max = parsed.max;
      draft.salary_period = parsed.period;
      folded = true;
    }
  }
  if (!draft.salary_period) draft.salary_period = "month";
  if (!draft.benefits?.length) {
    const legacy = readLegacyBenefits(String(draft.description ?? ""));
    if (legacy.benefits.length) {
      draft.benefits = legacy.benefits;
      draft.description = legacy.description;
      folded = true;
    }
  }
  return { draft, folded };
}
