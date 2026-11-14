import { isAccompanimentPlanLabel } from "@/lib/handicap/plan-storage";

/** Catégories transmises au formateur sans confirmation spéciale. */
export const SHAREABLE_CATEGORIES = new Set([
  "evaluations",
  "supports",
  "rythme",
  "locaux",
  "materiel",
]);

const FORBIDDEN_RAW = [
  "rqth",
  "handicap",
  "mdph",
  "aah",
  "invalidite",
  "pathologie",
  "diagnostic",
];

const INTERNAL_LABELS = new Set([
  "Besoins spécifiques",
  "Demande d'aménagement",
  "Message à la référente",
]);

export function isInternalAccommodationLabel(label: string | null | undefined) {
  const l = String(label ?? "");
  return INTERNAL_LABELS.has(l) || isAccompanimentPlanLabel(l);
}

/** Normalise pour comparaison insensible à la casse et aux accents. */
export function foldForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function containsForbiddenDisabilityTerms(text: string): boolean {
  const folded = foldForMatch(text);
  return FORBIDDEN_RAW.some((w) => folded.includes(w));
}

export type ShareAccRow = {
  id: string;
  label: string;
  details: string | null;
  category: string;
};

export function selectAccommodationsForTrainerShare(
  rows: ShareAccRow[],
  opts: { includeAutreIds?: string[] },
): { ok: ShareAccRow[]; blocked: ShareAccRow[]; error?: string } {
  const includeAutre = new Set(opts.includeAutreIds ?? []);
  const candidates: ShareAccRow[] = [];

  for (const row of rows) {
    if (isInternalAccommodationLabel(row.label)) continue;
    if (SHAREABLE_CATEGORIES.has(row.category)) {
      candidates.push(row);
      continue;
    }
    if (row.category === "autre" && includeAutre.has(row.id)) {
      candidates.push(row);
    }
  }

  const blocked = candidates.filter(
    (a) =>
      containsForbiddenDisabilityTerms(a.label) ||
      containsForbiddenDisabilityTerms(a.details ?? ""),
  );
  if (blocked.length) {
    return {
      ok: [],
      blocked,
      error: "Reformulez en décrivant le besoin, sans mention du handicap.",
    };
  }

  return { ok: candidates, blocked: [] };
}

export function buildTrainerShareEmailHtml(input: {
  items: Array<{ label: string; details?: string | null }>;
  appUrl: string;
}) {
  const lis = input.items
    .map((a) => {
      const detail = a.details?.trim()
        ? `<br/><span style="color:#64748B;font-size:13px">${escapeHtml(a.details)}</span>`
        : "";
      return `<li style="margin:0 0 8px"><strong>${escapeHtml(a.label)}</strong>${detail}</li>`;
    })
    .join("");
  return `<p>Des aménagements ont été partagés pour une session à venir.</p>
<ul style="padding-left:18px">${lis}</ul>
<p><a href="${escapeHtml(input.appUrl)}/dashboard/formateur">Ouvrir votre espace formateur</a></p>
<p>Ce message ne contient aucune information médicale.</p>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
