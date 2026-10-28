import { scanOfferAnonymity } from "@/lib/offres/anonymity";

export type SeoTemplateType = "job_offer" | "training" | "article";

export type SeoTemplateRecord = {
  type: SeoTemplateType;
  title_template: string;
  description_template: string;
  jsonld_type: string;
  og_image_url: string;
};

export const SEO_TEMPLATE_VARS: Record<SeoTemplateType, string[]> = {
  job_offer: ["intitulé", "contrat", "ville", "cursus"],
  training: ["formation", "niveau", "rythme"],
  article: ["titre", "chapô"],
};

export const DEFAULT_SEO_TEMPLATE_ROWS: SeoTemplateRecord[] = [
  {
    type: "job_offer",
    title_template: "{intitulé} en {contrat} à {ville} | Byound",
    description_template: "{intitulé} en {contrat} à {ville}. {cursus}.",
    jsonld_type: "JobPosting",
    og_image_url: "",
  },
  {
    type: "training",
    title_template: "{formation} - {niveau} à Caen | Byound School",
    description_template: "{formation} ({niveau}) à Caen, rythme {rythme}.",
    jsonld_type: "Course",
    og_image_url: "",
  },
  {
    type: "article",
    title_template: "{titre} | Blog Byound",
    description_template: "{chapô}",
    jsonld_type: "Article",
    og_image_url: "",
  },
];

const JOB_FORBIDDEN = /\{[^}]*(entreprise|soci[eé]t[eé]|company|employeur|marque|client)[^}]*\}/i;

function foldKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIASES: Record<string, string> = {
  "titre de l article": "titre",
  chapeau: "chapô",
  chapo: "chapô",
  intitule: "intitulé",
};

export function normalizeTemplateVar(name: string) {
  const folded = foldKey(name);
  return ALIASES[folded] ?? folded;
}

export function jobTemplateHasCompanyVar(template: string) {
  return JOB_FORBIDDEN.test(template);
}

export function unknownTemplateVars(type: SeoTemplateType, template: string) {
  const allowed = new Set(SEO_TEMPLATE_VARS[type].map(normalizeTemplateVar));
  const found = [...template.matchAll(/\{([^}]+)\}/g)].map((match) => normalizeTemplateVar(match[1] ?? ""));
  return found.filter((name) => name && !allowed.has(name));
}

export function applySeoTemplate(template: string, vars: Record<string, string>) {
  const lookup = new Map(Object.entries(vars).map(([key, value]) => [normalizeTemplateVar(key), value]));
  return template
    .replace(/\{([^}]+)\}/g, (_, raw: string) => lookup.get(normalizeTemplateVar(raw)) ?? "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

export function clipMetaDescription(value: string, max = 155) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "").trim()}…`;
}

export function twoSentences(value: string, max = 155) {
  const parts = value.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return clipMetaDescription(parts.slice(0, 2).join(" "), max);
}

export function sanitizeJobSeoText(title: string, description: string, companyNames: string[] = []) {
  const scanned = scanOfferAnonymity({ names: companyNames, title, description });
  return {
    title: scanned.rewrite.title ?? title,
    description: scanned.rewrite.description ?? description,
    blocked: scanned.flags.length > 0,
  };
}

export function validateSeoTemplate(type: SeoTemplateType, title: string, description: string) {
  if (type === "job_offer" && (jobTemplateHasCompanyVar(title) || jobTemplateHasCompanyVar(description))) {
    return "Les modèles d'offres ne peuvent pas contenir de variable d'entreprise.";
  }
  const unknown = [...unknownTemplateVars(type, title), ...unknownTemplateVars(type, description)];
  if (unknown.length) return `Variable inconnue : {${unknown[0]}}.`;
  return null;
}

export function fillGeneratedFields(
  template: SeoTemplateRecord,
  vars: Record<string, string>,
  sourceDescription = "",
  companyNames: string[] = [],
) {
  let title = applySeoTemplate(template.title_template, vars);
  let description = /\{/.test(template.description_template)
    ? applySeoTemplate(template.description_template, vars)
    : twoSentences(sourceDescription);
  if (!description) description = twoSentences(sourceDescription || title);
  description = clipMetaDescription(description);
  if (template.type === "job_offer") {
    const cleaned = sanitizeJobSeoText(title, description, companyNames);
    title = cleaned.title;
    description = clipMetaDescription(cleaned.description);
  }
  return { title, description };
}
