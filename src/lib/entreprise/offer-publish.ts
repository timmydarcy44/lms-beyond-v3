import { z } from "zod";
import { hasDiffusionChannel, hasRecruitmentSteps } from "@/lib/entreprise/offer-candidature";

export const OFFER_STEPS = [
  { id: 1, title: "Le poste", caption: "Intitulé, contrat, lieu et description" },
  { id: 2, title: "Compétences", caption: "Ce qui compte vraiment pour ce poste" },
  { id: 3, title: "Conditions", caption: "Rémunération, temps de travail, avantages" },
  { id: 4, title: "Candidature et diffusion", caption: "Comment postuler et où publier" },
] as const;

export const offerDraftSchema = z.object({
  mode: z.literal("draft").optional(),
  title: z.string().trim().max(160).optional(),
});

export const CONTRACT_TYPES = ["CDI", "CDD", "Alternance", "Stage", "Intérim", "Freelance"] as const;
export const WORK_MODES = ["Sur site", "Hybride", "Télétravail"] as const;
export const EXPERIENCE_LEVELS = ["Débutant accepté", "1 à 3 ans", "3 ans et plus"] as const;
export const EDUCATION_LEVELS = ["Bac", "Bac+2", "Bac+3", "Bac+5", "Doctorat"] as const;

const optionalText = z.string().trim().max(240);

export const offerPosteSchema = z.object({
  title: z.string().trim().max(160).optional(),
  contract_type: z.string().trim().max(40).optional(),
  description: z.string().trim().max(12000).optional(),
  city: z.string().trim().max(120).optional(),
  work_mode: z.union([z.enum(WORK_MODES), z.literal("")]).optional(),
  contract_duration: optionalText.optional(),
  diploma_prepared: optionalText.optional(),
  alternance_school: optionalText.optional(),
  work_rhythm: optionalText.optional(),
  experience_level: z.string().trim().max(40).optional(),
  education_level: z.string().trim().max(40).optional(),
});

export const offerConditionsSchema = z.object({
  salary_min: z.number().int().min(0).max(100_000_000_00).nullable().optional(),
  salary_max: z.number().int().min(0).max(100_000_000_00).nullable().optional(),
  salary_period: z.enum(["month", "year"]).optional(),
  hours_per_week: z.number().min(0).max(80).nullable().optional(),
  start_label: z.string().trim().max(80).optional(),
  headcount: z.number().int().min(1).max(999).nullable().optional(),
  benefits: z.array(z.object({ code: z.string().trim().max(40), label: z.string().trim().max(80) })).max(20).optional(),
  salary_range: z.string().trim().max(160).optional(),
});

const documentDemand = z.enum(["required", "optional", "hidden"]);

export const offerCandidatureSchema = z.object({
  recruitment_steps: z.array(z.object({
    id: z.string().trim().max(40),
    title: z.string().trim().max(80),
    detail: z.string().trim().max(160),
  })).max(12).optional(),
  requested_documents: z.object({
    cv: documentDemand,
    cover_letter: documentDemand,
    portfolio: documentDemand,
  }).optional(),
  screening_questions: z.array(z.object({
    id: z.string().trim().max(40),
    prompt: z.string().trim().max(240),
    kind: z.enum(["yes_no", "short"]),
    eliminatory: z.boolean(),
  })).max(3).optional(),
  application_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  diffusion: z.object({
    byound: z.boolean(),
    linkedin: z.boolean(),
  }).optional(),
});

export type OfferChecklistInput = {
  title?: string | null;
  contract_type?: string | null;
  description?: string | null;
  city?: string | null;
  salary_range?: string | null;
  work_mode?: string | null;
  required_skills?: number;
  salary_min?: number | null;
  benefits?: Array<{ code: string; label: string }> | null;
  recruitment_steps?: Array<{ title?: string }> | null;
  diffusion?: { byound?: boolean; linkedin?: boolean } | null;
};

export function offerChecklist(input: OfferChecklistInput) {
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim();
  const city = String(input.city ?? "").trim();
  const mode = String(input.work_mode ?? "").trim();
  return [
    { id: "title", label: "Intitulé et contrat", ok: title.length > 0 && title !== "Sans titre" && Boolean(String(input.contract_type ?? "").trim()), step: 1 },
    { id: "description", label: "Description (au moins 300 caractères)", ok: description.length >= 300, step: 1 },
    { id: "place", label: "Lieu et modalité", ok: Boolean(city) && Boolean(mode), step: 1 },
    { id: "skills", label: "Au moins 2 compétences indispensables", ok: Number(input.required_skills ?? 0) >= 2, step: 2 },
    { id: "salary", label: "Rémunération renseignée", ok: Number(input.salary_min ?? 0) > 0, step: 3 },
    { id: "benefits", label: "Au moins un avantage", ok: Array.isArray(input.benefits) && input.benefits.length > 0, step: 3 },
    { id: "steps", label: "Étapes du recrutement", ok: hasRecruitmentSteps(input.recruitment_steps), step: 4 },
    { id: "channels", label: "Au moins un canal de diffusion", ok: hasDiffusionChannel(input.diffusion), step: 4 },
  ];
}

export function offerReadyToPublish(input: OfferChecklistInput) {
  return offerChecklist(input).every((item) => item.ok);
}
