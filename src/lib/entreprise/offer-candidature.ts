export type RecruitmentStep = { id: string; title: string; detail: string };
export type DocumentDemand = "required" | "optional" | "hidden";
export type RequestedDocuments = {
  cv: DocumentDemand;
  cover_letter: DocumentDemand;
  portfolio: DocumentDemand;
};
export type ScreeningQuestion = {
  id: string;
  prompt: string;
  kind: "yes_no" | "short";
  eliminatory: boolean;
};
export type OfferDiffusion = { byound: boolean; linkedin: boolean };

export const DEFAULT_RECRUITMENT_STEPS: RecruitmentStep[] = [
  { id: "candidature", title: "Candidature", detail: "CV + 1 question" },
  { id: "echange", title: "Échange téléphonique", detail: "20 min" },
  { id: "entretien", title: "Entretien", detail: "Sur site, avec le manager" },
  { id: "reponse", title: "Réponse sous 10 jours", detail: "Sous 10 jours" },
];

export const DEFAULT_DOCUMENTS: RequestedDocuments = {
  cv: "required",
  cover_letter: "optional",
  portfolio: "optional",
};

export const DOCUMENT_ROWS = [
  { key: "cv", label: "CV" },
  { key: "cover_letter", label: "Lettre de motivation" },
  { key: "portfolio", label: "Lien LinkedIn / portfolio" },
] as const;

export const DEMAND_OPTIONS = [
  { value: "required", label: "Obligatoire" },
  { value: "optional", label: "Facultative" },
  { value: "hidden", label: "Non demandée" },
] as const;

const DEMANDS = new Set<DocumentDemand>(["required", "optional", "hidden"]);

export function publicOfferUrl(offerId: string) {
  return `https://www.byound.fr/dashboard/talent/offres/${offerId}`;
}

export function linkedinShareText(input: { title: string; contract?: string | null; city?: string | null; url?: string | null }) {
  const place = [input.contract, input.city].map((item) => String(item ?? "").trim()).filter(Boolean).join(" · ");
  const lines = [`Nous recrutons : ${String(input.title ?? "").trim() || "un poste"}.`];
  if (place) lines.push(place);
  if (input.url) lines.push(input.url);
  return lines.join("\n");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] | null {
  if (typeof value === "string") {
    try {
      return asArray(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return Array.isArray(value) ? value : null;
}

function readSteps(value: unknown): RecruitmentStep[] | null {
  const rows = asArray(value);
  if (!rows) return null;
  return rows.slice(0, 12).map((row, index) => {
    const item = asRecord(row) ?? {};
    return {
      id: String(item.id ?? `etape-${index + 1}`).slice(0, 40),
      title: String(item.title ?? "").slice(0, 80),
      detail: String(item.detail ?? "").slice(0, 160),
    };
  });
}

function readDemand(value: unknown, fallback: DocumentDemand): DocumentDemand {
  return DEMANDS.has(value as DocumentDemand) ? (value as DocumentDemand) : fallback;
}

function readDocuments(value: unknown): RequestedDocuments | null {
  const row = asRecord(value);
  if (!row) return null;
  return {
    cv: readDemand(row.cv, "required"),
    cover_letter: readDemand(row.cover_letter, "optional"),
    portfolio: readDemand(row.portfolio, "optional"),
  };
}

function readQuestions(value: unknown): ScreeningQuestion[] {
  const rows = asArray(value) ?? [];
  return rows.slice(0, 3).map((row, index) => {
    const item = asRecord(row) ?? {};
    return {
      id: String(item.id ?? `question-${index + 1}`).slice(0, 40),
      prompt: String(item.prompt ?? "").slice(0, 240),
      kind: item.kind === "short" ? "short" : "yes_no",
      eliminatory: item.eliminatory === true,
    };
  });
}

function readDiffusion(value: unknown): OfferDiffusion | null {
  const row = asRecord(value);
  if (!row) return null;
  if (typeof row.byound !== "boolean" && typeof row.linkedin !== "boolean") return null;
  return { byound: row.byound === true, linkedin: row.linkedin === true };
}

export type CandidatureFields = {
  recruitment_steps?: RecruitmentStep[] | null;
  requested_documents?: RequestedDocuments | null;
  screening_questions?: ScreeningQuestion[] | null;
  application_deadline?: string | null;
  diffusion?: OfferDiffusion | null;
};

export function prepareCandidature<T extends CandidatureFields>(row: T): { draft: T; folded: boolean } {
  const steps = readSteps(row.recruitment_steps);
  const documents = readDocuments(row.requested_documents);
  const diffusion = readDiffusion(row.diffusion);
  const deadline = String(row.application_deadline ?? "").slice(0, 10);
  return {
    folded: steps == null || documents == null || diffusion == null,
    draft: {
      ...row,
      recruitment_steps: steps ?? DEFAULT_RECRUITMENT_STEPS.map((step) => ({ ...step })),
      requested_documents: documents ?? { ...DEFAULT_DOCUMENTS },
      screening_questions: readQuestions(row.screening_questions),
      application_deadline: /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? deadline : null,
      diffusion: diffusion ?? { byound: true, linkedin: false },
    },
  };
}

export function hasRecruitmentSteps(steps: Array<{ title?: string }> | null | undefined) {
  return Array.isArray(steps) && steps.length > 0 && steps.every((step) => String(step.title ?? "").trim().length > 0);
}

export function hasDiffusionChannel(diffusion: { byound?: boolean; linkedin?: boolean } | null | undefined) {
  return Boolean(diffusion?.byound || diffusion?.linkedin);
}
