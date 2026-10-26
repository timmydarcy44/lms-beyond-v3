export const ANONYMITY_MESSAGE =
  "Pour rester sur Byound, les offres publiques ne mentionnent pas l'entreprise ni de moyen de contact direct.";

export type AnonymityFlag = {
  field: string;
  excerpt: string;
};

export type AnonymityQuestion = { id: string; prompt: string };

export type AnonymityRewrite = {
  title?: string;
  description?: string;
  requirements?: string;
  diploma_prepared?: string;
  city?: string;
  screening_questions?: AnonymityQuestion[];
};

const LEGAL = /\b(sasu|sas|sarl|eurl|sa|sci|scop|eirl|ei)\b/gi;

const CONTACT =
  /envoyez votre cv|envoyez un cv|contactez|écrivez[-\s]nous|ecrivez[-\s]nous|appelez|joignez[-\s]nous|adressez votre|candidature à envoyer|candidature a envoyer/i;

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const URL = /https?:\/\/|www\.[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE = /(?:(?:\+|00)33[\s.]?(?:\(0\)[\s.]?)?|0)[1-9](?:[\s.]?\d{2}){4}/;
const SIRET = /\b\d{3}[\s.]?\d{3}[\s.]?\d{3}[\s.]?\d{5}\b/;
const SOCIAL = /(^|[^\w])@[a-z0-9_.]{2,}/i;
const ADDRESS = /\b(?:rue|avenue|boulevard|bd|impasse|allée|allee|chemin|place)\b[^.\n]{0,40}\d|\b\d{1,4}\s+(?:rue|avenue|boulevard|impasse|allée|allee|chemin)\b/i;

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function cleanName(value: string) {
  return value.replace(LEGAL, " ").replace(/[«»"']/g, " ").replace(/\s{2,}/g, " ").trim();
}

export function companyNameVariants(names: string[]) {
  const seen = new Set<string>();
  const variants: string[] = [];
  for (const raw of names) {
    for (const candidate of [raw, cleanName(raw)]) {
      const name = candidate.trim();
      const key = fold(name);
      if (key.length < 4 || seen.has(key)) continue;
      seen.add(key);
      variants.push(name);
    }
  }
  return variants.sort((a, b) => b.length - a.length);
}

function accentPattern(value: string) {
  const letters: Record<string, string> = {
    a: "[aàâä]",
    e: "[eéèêë]",
    i: "[iîï]",
    o: "[oôö]",
    u: "[uùûü]",
    c: "[cç]",
  };
  return fold(value)
    .split("")
    .map((char) => letters[char] ?? char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("");
}

function replaceNames(value: string, variants: string[]) {
  let next = value;
  for (const variant of variants) {
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${accentPattern(variant)})(?=$|[^\\p{L}\\p{N}])`, "giu");
    next = next.replace(pattern, "$1notre entreprise");
  }
  return next;
}

function excerptAround(value: string, index: number) {
  const start = Math.max(0, index - 24);
  const end = Math.min(value.length, index + 48);
  const slice = value.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${slice}${end < value.length ? "…" : ""}`;
}

function findHit(value: string, variants: string[]) {
  const folded = fold(value);
  for (const variant of variants) {
    const at = folded.indexOf(fold(variant));
    if (at >= 0) return excerptAround(value, at);
  }
  const rules = [CONTACT, EMAIL, URL, PHONE, SIRET, SOCIAL, ADDRESS];
  for (const rule of rules) {
    const match = rule.exec(value);
    if (match?.index != null) return excerptAround(value, match.index);
  }
  return "";
}

function scanField(field: string, value: string, variants: string[], flags: AnonymityFlag[]) {
  const text = value.trim();
  if (!text) return;
  const excerpt = findHit(text, variants);
  if (excerpt) flags.push({ field, excerpt });
}

export function scanOfferAnonymity(input: {
  names: string[];
  title?: string | null;
  description?: string | null;
  requirements?: string | null;
  diploma?: string | null;
  city?: string | null;
  benefits?: string[];
  questions?: AnonymityQuestion[];
}): { flags: AnonymityFlag[]; rewrite: AnonymityRewrite } {
  const variants = companyNameVariants(input.names);
  const flags: AnonymityFlag[] = [];
  const title = String(input.title ?? "");
  const description = String(input.description ?? "");
  const requirements = String(input.requirements ?? "");
  const diploma = String(input.diploma ?? "");
  const city = String(input.city ?? "");
  const questions = input.questions ?? [];

  scanField("title", title, variants, flags);
  scanField("description", description, variants, flags);
  scanField("requirements", requirements, variants, flags);
  scanField("diploma_prepared", diploma, variants, flags);
  scanField("city", city, variants, flags);
  scanField("benefits", (input.benefits ?? []).join(" · "), variants, flags);
  for (const question of questions) scanField("screening_questions", question.prompt, variants, flags);

  const rewrite: AnonymityRewrite = {};
  if (flags.some((flag) => flag.field === "title")) rewrite.title = replaceNames(title, variants);
  if (flags.some((flag) => flag.field === "description")) rewrite.description = replaceNames(description, variants);
  if (flags.some((flag) => flag.field === "requirements")) rewrite.requirements = replaceNames(requirements, variants);
  if (flags.some((flag) => flag.field === "diploma_prepared")) rewrite.diploma_prepared = replaceNames(diploma, variants);
  if (flags.some((flag) => flag.field === "city")) rewrite.city = replaceNames(city, variants);
  const rewrittenQuestions = questions
    .map((question) => ({ ...question, prompt: replaceNames(question.prompt, variants) }))
    .filter((question, index) => question.prompt !== questions[index]?.prompt);
  if (rewrittenQuestions.length) rewrite.screening_questions = rewrittenQuestions;
  return { flags, rewrite };
}

export function publicSlug(title: string, city: string, id: string) {
  const base = fold(`${title} ${city}`)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  const short = id.replace(/-/g, "").slice(0, 4).toLowerCase();
  return `${base || "offre"}-${short}`;
}
