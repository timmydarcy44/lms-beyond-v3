/** Types CMS formations EDGE — structure publique uniquement (pas LMS). */

export type TrainingProgramSubchapter = {
  id: string;
  title: string;
};

export type TrainingProgramChapter = {
  id: string;
  title: string;
  subchapters: TrainingProgramSubchapter[];
};

export type TrainingProgramSection = {
  id: string;
  title: string;
  description?: string;
  chapters: TrainingProgramChapter[];
};

export type TrainingInstructorRole = "primary" | "contributor";

export type TrainingInstructor = {
  expert_id: string;
  role: TrainingInstructorRole;
  sort_order: number;
  first_name: string;
  last_name: string;
  headline: string | null;
  photo_url: string | null;
};

export type TrainingSessionRow = {
  id: string;
  date: string;
  city: string;
  seats: string;
  price: string;
  format?: string;
};

export type TrainingPageBlockId =
  | "presentation"
  | "why_choose"
  | "objectives"
  | "skills"
  | "program"
  | "trainers"
  | "pricing"
  | "faq"
  | "sessions"
  | "open_badge"
  | "prerequisites"
  | "audience"
  | "benefits"
  | "methodology"
  | "case_studies"
  | "deliverables"
  | "pricing";

export type TrainingPageBlock = {
  id: TrainingPageBlockId;
  label: string;
  visible: boolean;
  order: number;
};

export const TRAINING_PAGE_BLOCK_LABELS: Record<TrainingPageBlockId, string> = {
  presentation: "Présentation",
  why_choose: "Pourquoi choisir cette formation",
  objectives: "Objectifs",
  skills: "Compétences",
  program: "Programme détaillé",
  trainers: "Intervenants",
  pricing: "Tarifs",
  faq: "FAQ",
  sessions: "Sessions",
  open_badge: "Open Badge",
  prerequisites: "Prérequis",
  audience: "Public cible",
  benefits: "Bénéfices",
  methodology: "Méthodologie",
  case_studies: "Cas pratiques",
  deliverables: "Livrables",
  pricing: "Tarifs",
};

export function createDefaultPageBlocks(): TrainingPageBlock[] {
  return (Object.keys(TRAINING_PAGE_BLOCK_LABELS) as TrainingPageBlockId[]).map((id, index) => ({
    id,
    label: TRAINING_PAGE_BLOCK_LABELS[id],
    visible: !["benefits", "methodology", "case_studies", "deliverables"].includes(id),
    order: index,
  }));
}

export function normalizePageBlocks(raw: unknown): TrainingPageBlock[] {
  if (!Array.isArray(raw) || !raw.length) return createDefaultPageBlocks();
  const defaults = createDefaultPageBlocks();
  const byId = new Map(defaults.map((b) => [b.id, b]));
  const merged = raw
    .filter((item) => item && typeof item === "object" && "id" in item)
    .map((item, index) => {
      const id = String((item as { id: string }).id) as TrainingPageBlockId;
      const base = byId.get(id);
      if (!base) return null;
      return {
        id,
        label: base.label,
        visible: Boolean((item as { visible?: boolean }).visible ?? base.visible),
        order: typeof (item as { order?: number }).order === "number" ? (item as { order: number }).order : index,
      };
    })
    .filter(Boolean) as TrainingPageBlock[];

  const seen = new Set(merged.map((b) => b.id));
  for (const d of defaults) {
    if (!seen.has(d.id)) merged.push(d);
  }
  return merged.sort((a, b) => a.order - b.order);
}

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function migrateLegacyProgram(
  program: { title: string; duration?: string }[] | null | undefined,
): TrainingProgramSection[] {
  if (!program?.length) return [];
  return [
    {
      id: createId(),
      title: "Programme",
      description: "",
      chapters: program.map((step) => ({
        id: createId(),
        title: step.title,
        subchapters: [],
      })),
    },
  ];
}

export function normalizeProgramStructure(
  structure: unknown,
  legacyProgram: { title: string; duration?: string }[] | null | undefined,
): TrainingProgramSection[] {
  if (Array.isArray(structure) && structure.length) {
    return structure as TrainingProgramSection[];
  }
  return migrateLegacyProgram(legacyProgram);
}
