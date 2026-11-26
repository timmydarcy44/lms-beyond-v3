import type { TrainingCourseRow, TrainingCoursePublic } from "@/lib/training-courses/types";
import {
  normalizePageBlocks,
  normalizeProgramStructure,
  type TrainingInstructor,
  type TrainingPageBlock,
  type TrainingProgramSection,
  type TrainingSessionRow,
} from "@/lib/training-courses/cms-types";
import type { TrainingCourseFaqItem } from "@/lib/training-courses/types";
import {
  derivePedagogicalModalityFromFormats,
  pedagogicalModalityLabel,
} from "@/lib/training-courses/qualiopi-fiche";
import { buildPublicRecognition } from "@/lib/training-courses/public-recognition";

/** En-tête formats : `formats[]` si présents, sinon libellé dérivé de `pedagogical_modality`. */
export function buildHeaderFormatsLabel(course: {
  formats?: string[] | null;
  pedagogical_modality?: string | null;
}): string {
  const fromFormats = (course.formats ?? []).map((f) => String(f).trim()).filter(Boolean);
  if (fromFormats.length) return fromFormats.join(" · ");
  const modality =
    String(course.pedagogical_modality ?? "").trim() ||
    derivePedagogicalModalityFromFormats(course.formats);
  return pedagogicalModalityLabel(modality) ?? "";
}

export type TrainingCourseDetail = {
  course: TrainingCoursePublic;
  benefit: string;
  trainers: {
    id: string;
    name: string;
    specialty: string;
    photoUrl: string;
    role: "primary" | "contributor";
  }[];
  methodology: string[];
  exercises: string[];
  casPratiques: string[];
  deliverables: string[];
  competences: string[];
  sessions: TrainingSessionRow[];
  faq: TrainingCourseFaqItem[];
  whyFollow: string[];
  benefits: string[];
  objectives: string[];
  audience: string[];
  programSections: TrainingProgramSection[];
  pageBlocks: TrainingPageBlock[];
  formatsLabel: string;
  maxIntraParticipants: number;
  badgeLabel: string | null;
  badgeImageUrl: string | null;
};

function buildTrainersFromCourse(course: TrainingCourseRow) {
  const instructors = (course.instructors ?? []) as TrainingInstructor[];
  if (instructors.length) {
    return [...instructors]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((ins) => ({
        id: ins.expert_id,
        name: `${ins.first_name} ${ins.last_name}`.trim(),
        specialty: ins.headline ?? "Formateur expert Byound",
        photoUrl:
          ins.photo_url ??
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
        role: ins.role,
      }));
  }

  if (course.trainer_name) {
    return [
      {
        id: course.trainer_id ?? "lead",
        name: course.trainer_name,
        specialty: course.trainer_headline ?? "Formateur expert Byound",
        photoUrl:
          course.trainer_photo_url ??
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
        role: "primary" as const,
      },
    ];
  }

  return [];
}

function formatPrice(value: number | null | undefined, suffix: string): string | null {
  if (value == null) return null;
  return `${value.toLocaleString("fr-FR")} € HT ${suffix}`;
}

export function buildTrainingCourseDetail(
  course: TrainingCoursePublic,
  badgeMeta?: { name?: string | null; imageUrl?: string | null },
): TrainingCourseDetail {
  const benefit =
    course.short_description ??
    course.benefits?.[0] ??
    course.objectives?.[0] ??
    "";

  // Intra uniquement pour l’instant (pas d’offre inter publique).
  const intraLabel = formatPrice(course.intra_price, "/ groupe");

  const sessions: TrainingSessionRow[] = course.sessions?.length
    ? course.sessions.filter((s) => !/inter/i.test(String(s.format ?? s.id ?? "")))
    : [
        ...(intraLabel
          ? [
              {
                id: "intra-default",
                date: "Session intra sur mesure",
                city: "Dans vos locaux ou à distance",
                seats: `Jusqu'à ${course.max_intra_participants ?? 12} participants`,
                price: intraLabel,
                format: "Intra-entreprise",
              },
            ]
          : []),
      ];

  return {
    course,
    benefit,
    trainers: buildTrainersFromCourse(course),
    methodology: course.methodology ?? [],
    exercises: course.case_studies ?? [],
    casPratiques: course.case_studies ?? [],
    deliverables: course.deliverables ?? [],
    competences: course.skills ?? [],
    objectives: course.objectives ?? [],
    audience: course.audience ?? [],
    benefits: course.benefits ?? [],
    whyFollow: course.why_choose ?? [],
    programSections: normalizeProgramStructure(course.program_structure, course.program),
    pageBlocks: normalizePageBlocks(course.page_blocks),
    formatsLabel: buildHeaderFormatsLabel(course),
    maxIntraParticipants: course.max_intra_participants ?? 12,
    sessions,
    faq: course.faq ?? [],
    badgeLabel: buildPublicRecognition(course, {
      badgeMetaName: badgeMeta?.name ?? null,
    }).badgeLabel,
    badgeImageUrl: badgeMeta?.imageUrl ?? null,
  };
}

/** @deprecated Offre inter retirée des fiches publiques — conservé pour l’admin. */
export function formatInterPrice(course: TrainingCoursePublic): string {
  if (course.price_on_quote || course.inter_price == null) return "Sur devis";
  return `À partir de ${course.inter_price.toLocaleString("fr-FR")} € HT / participant`;
}

/** Tarif intra = montant total du groupe (pas /jour, pas /participant). */
export function formatIntraPrice(course: TrainingCoursePublic): string {
  if (course.price_on_quote || course.intra_price == null) return "Sur devis";
  return `${course.intra_price.toLocaleString("fr-FR")} € HT / groupe`;
}

export function isBlockVisible(detail: TrainingCourseDetail, blockId: TrainingPageBlock["id"]): boolean {
  const block = detail.pageBlocks.find((b) => b.id === blockId);
  return block?.visible ?? true;
}
