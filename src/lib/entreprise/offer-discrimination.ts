export type DiscriminationReason = "âge" | "sexe" | "situation familiale" | "origine" | "santé";
export type DiscriminationField = "title" | "description" | "question";

export type DiscriminationFinding = {
  id: string;
  field: DiscriminationField;
  questionId?: string;
  passage: string;
  reason: DiscriminationReason;
  rewrite: string;
};

const TITLE_FORMS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bcommerciaux\b/i, label: "commerciaux·ales" },
  { pattern: /\bcommerciales\b/i, label: "commerciaux·ales" },
  { pattern: /\bcommercial\b/i, label: "Commercial·e" },
  { pattern: /\bvendeuses?\b/i, label: "Vendeur·euse" },
  { pattern: /\bvendeur\b/i, label: "Vendeur·euse" },
  { pattern: /\bassistantes?\b/i, label: "Assistant·e" },
  { pattern: /\bassistant\b/i, label: "Assistant·e" },
  { pattern: /\bchargées?\b/i, label: "Chargé·e" },
  { pattern: /\bchargé\b/i, label: "Chargé·e" },
  { pattern: /\bdirectrices?\b/i, label: "Directeur·rice" },
  { pattern: /\bdirecteur\b/i, label: "Directeur·rice" },
  { pattern: /\bdéveloppeuses?\b/i, label: "Développeur·euse" },
  { pattern: /\bdeveloppeuses?\b/i, label: "Développeur·euse" },
  { pattern: /\bdéveloppeur\b/i, label: "Développeur·euse" },
  { pattern: /\bdeveloppeur\b/i, label: "Développeur·euse" },
  { pattern: /\btechniciennes?\b/i, label: "Technicien·ne" },
  { pattern: /\btechnicien\b/i, label: "Technicien·ne" },
  { pattern: /\binfirmières?\b/i, label: "Infirmier·ère" },
  { pattern: /\binfirmier\b/i, label: "Infirmier·ère" },
];

const LEXICON: Array<{ pattern: RegExp; reason: DiscriminationReason }> = [
  { pattern: /\bjeunes?\b/i, reason: "âge" },
  { pattern: /\bmoins de \d{1,2}\s*ans\b/i, reason: "âge" },
  { pattern: /\bplus de \d{1,2}\s*ans\b/i, reason: "âge" },
  { pattern: /\bentre \d{1,2}\s*et\s*\d{1,2}\s*ans\b/i, reason: "âge" },
  { pattern: /\bâge[eé]?s?\s+de\s+\d/i, reason: "âge" },
  { pattern: /\b\d{1,2}\s*ans\s+(?:maximum|maxi|révolus?)\b/i, reason: "âge" },
  { pattern: /\b(?:un|une|les)\s+hommes?\b/i, reason: "sexe" },
  { pattern: /\b(?:un|une|les)\s+femmes?\b/i, reason: "sexe" },
  { pattern: /\bsexe\s+(?:masculin|féminin|feminin)\b/i, reason: "sexe" },
  { pattern: /\bcélibataires?\b/i, reason: "situation familiale" },
  { pattern: /\bmariée?s?\b/i, reason: "situation familiale" },
  { pattern: /\bsans enfant\b/i, reason: "situation familiale" },
  { pattern: /\bsituation familiale\b/i, reason: "situation familiale" },
  { pattern: /\bmère de famille\b/i, reason: "situation familiale" },
  { pattern: /\bpère de famille\b/i, reason: "situation familiale" },
  { pattern: /\benceinte\b/i, reason: "situation familiale" },
  { pattern: /\bd['’]origine\b/i, reason: "origine" },
  { pattern: /\bethnie\b/i, reason: "origine" },
  { pattern: /\bde souche\b/i, reason: "origine" },
  { pattern: /\brace\b/i, reason: "origine" },
  { pattern: /\bbonne santé\b/i, reason: "santé" },
  { pattern: /\bsans handicap\b/i, reason: "santé" },
  { pattern: /\bnon[-\s]?fumeurs?\b/i, reason: "santé" },
  { pattern: /\bproblèmes? de santé\b/i, reason: "santé" },
];

function alreadyInclusive(title: string) {
  return /[·•]|\(e\)|\(se\)|\(ère\)|h\/f|f\/h/i.test(title);
}

function replaceJobTitle(text: string, pattern: RegExp, label: string) {
  return text.replace(pattern, (match, offset: number) => {
    const after = text.slice(offset + match.length, offset + match.length + 1);
    if (after === "·" || after === "•") return match;
    return label;
  });
}

export function inclusiveTitle(title: string) {
  const source = title.trim();
  if (!source || source === "Sans titre" || alreadyInclusive(source)) return null;
  let next = source;
  for (const form of TITLE_FORMS) {
    next = replaceJobTitle(next, form.pattern, form.label);
  }
  next = next.replace(/\s{2,}/g, " ").trim();
  return next !== source ? next : null;
}

function dropPassage(text: string, passage: string) {
  return text
    .replace(passage, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .trim();
}

function pushFinding(
  findings: DiscriminationFinding[],
  finding: Omit<DiscriminationFinding, "id">,
) {
  const key = `${finding.field}:${finding.questionId ?? ""}:${finding.passage.toLowerCase()}`;
  if (findings.some((item) => `${item.field}:${item.questionId ?? ""}:${item.passage.toLowerCase()}` === key)) return;
  findings.push({ ...finding, id: key });
}

function scanField(
  findings: DiscriminationFinding[],
  field: DiscriminationField,
  text: string,
  questionId?: string,
) {
  const source = text.trim();
  if (!source) return;
  if (field === "title") {
    const inclusive = inclusiveTitle(source);
    if (inclusive) {
      const passage = TITLE_FORMS.map((form) => source.match(form.pattern)?.[0]).find(Boolean) ?? source;
      pushFinding(findings, {
        field,
        passage,
        reason: "sexe",
        rewrite: inclusive,
      });
    }
  }
  for (const entry of LEXICON) {
    const match = source.match(entry.pattern);
    if (!match?.[0]) continue;
    const cleared = dropPassage(source, match[0]);
    const rewrite = cleared || (field === "title" ? "Intitulé du poste" : "Décrivez le poste sans mention personnelle.");
    if (rewrite === source) continue;
    pushFinding(findings, {
      field,
      questionId,
      passage: match[0],
      reason: entry.reason,
      rewrite: field === "title" ? inclusiveTitle(rewrite) ?? rewrite : rewrite,
    });
  }
}

export function scanOfferDiscrimination(input: {
  title?: string | null;
  description?: string | null;
  questions?: Array<{ id?: string; prompt?: string | null }>;
}) {
  const findings: DiscriminationFinding[] = [];
  scanField(findings, "title", String(input.title ?? ""));
  scanField(findings, "description", String(input.description ?? ""));
  for (const question of input.questions ?? []) {
    scanField(findings, "question", String(question.prompt ?? ""), question.id);
  }
  return findings.slice(0, 8);
}

export function mergeDiscriminationFindings(local: DiscriminationFinding[], extra: DiscriminationFinding[]) {
  const merged = [...local];
  for (const finding of extra) {
    pushFinding(merged, finding);
  }
  return merged.slice(0, 8);
}
