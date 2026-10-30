import { foldSeoText } from "@/lib/seo/score";

const TAG_RE = /<[^>]+>/g;

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function innerText(html: string) {
  return decodeEntities(html.replace(TAG_RE, " "));
}

function collect(html: string, tag: string) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const text = innerText(match[1] ?? "");
    if (text) out.push(text);
  }
  return out;
}

export function extractPageText(html: string) {
  return innerText(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " "),
  ).slice(0, 120_000);
}

export function parsePageHeadings(html: string) {
  return {
    h1: collect(html, "h1"),
    h2: collect(html, "h2"),
    h3: collect(html, "h3"),
  };
}

export function questionAppearsInText(question: string, pageText: string) {
  const needle = foldSeoText(question);
  if (!needle || needle.length < 4) return false;
  return foldSeoText(pageText).includes(needle);
}

export function faqVisibility(questions: string[], pageText: string) {
  const items = questions.map((question) => ({
    question,
    visible: questionAppearsInText(question, pageText),
  }));
  const pending = questions.filter((question) => question.trim());
  return {
    items,
    allVisible: pending.length > 0 && items.filter((item) => item.question.trim()).every((item) => item.visible),
  };
}

export function headingStatus(headings: { h1: string[]; h2: string[]; h3?: string[] }) {
  const h1 = headings.h1.length;
  const h2 = headings.h2.length;
  return {
    h1:
      h1 === 1 ? "OK" : h1 === 0 ? "Aucun H1 trouvé" : `Plusieurs H1 (${h1}) : un seul H1 par page.`,
    h2:
      h2 >= 2
        ? "OK"
        : h2 === 1
          ? "Un seul H2 trouvé : ajoutez-en un dans le contenu."
          : "Aucun H2 trouvé : ajoutez-en au moins deux dans le contenu.",
  };
}

export const SEO_HEADINGS_NEVER_FROM_TOOL = [
  "/",
  "/entreprises",
  "/votre-orientation",
  "/formateurs-experts",
  "/login",
  "/dashboard/expert",
  "/signup/expert",
  "/entreprises/connexion",
] as const;

export function seoHeadingsManagedByTool(path: string, catalogKey?: string) {
  if ((SEO_HEADINGS_NEVER_FROM_TOOL as readonly string[]).includes(path)) return false;
  return Boolean(catalogKey);
}
