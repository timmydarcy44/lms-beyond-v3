import { foldSeoText } from "@/lib/seo/score";

const HYPE = [
  /\bgarant[ieé]\b/i,
  /\bn[°o]\s*1\b/i,
  /\bnum[eé]ro\s+1\b/i,
  /\b100\s*%\b/,
  /\bleader\b/i,
  /\bmeilleur[e]?\s+d['’]Europe\b/i,
  /\bprix\s+le\s+plus\s+bas\b/i,
];

export function extractNumericClaims(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)?\s*(?:%|€|euros?)?/gi) ?? []).map((item) => item.replace(/\s+/g, " ").trim());
}

export function claimAllowedInSource(claim: string, source: string): boolean {
  const foldedSource = foldSeoText(source);
  const foldedClaim = foldSeoText(claim);
  if (!foldedClaim) return true;
  if (foldedSource.includes(foldedClaim)) return true;
  const digits = claim.replace(/[^\d]/g, "");
  if (digits && foldedSource.includes(digits)) return true;
  return false;
}

export function proposalViolatesSource(proposal: string, source: string): boolean {
  const foldedSource = foldSeoText(source);
  if (!proposal.trim()) return true;
  for (const pattern of HYPE) {
    if (pattern.test(proposal) && !pattern.test(source)) return true;
  }
  for (const claim of extractNumericClaims(proposal)) {
    const digits = claim.replace(/[^\d]/g, "");
    if (digits.length < 2) continue;
    if (!claimAllowedInSource(claim, source) && !foldedSource.includes(digits)) return true;
  }
  return false;
}

export function asPlainText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    if (typeof row.text === "string") return row.text.trim();
    if (typeof row.title === "string") return row.title.trim();
    if (typeof row.value === "string") return row.value.trim();
  }
  return "";
}
