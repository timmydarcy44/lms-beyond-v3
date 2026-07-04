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
  badgeLabel: string;
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
        specialty: ins.headline ?? "Formateur expert EDGE",
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
        specialty: course.trainer_headline ?? "Formateur expert EDGE",
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

  const interLabel = formatPrice(course.inter_price, "/ participant");
  const intraLabel = formatPrice(course.intra_price, "/ groupe");

  const sessions: TrainingSessionRow[] = course.sessions?.length
    ? course.sessions
    : [
        ...(interLabel
          ? [
              {
                id: "inter-default",
                date: "Prochaine session inter",
                city: "Paris · Distanciel",
                seats: "Places limitées",
                price: interLabel,
                format: "Inter-entreprises",
              },
            ]
          : []),
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
    formatsLabel: (course.formats ?? []).join(" · "),
    maxIntraParticipants: course.max_intra_participants ?? 12,
    sessions,
    faq: course.faq ?? [],
    badgeLabel: badgeMeta?.name ?? course.badge_name ?? "Open Badge EDGE",
    badgeImageUrl: badgeMeta?.imageUrl ?? null,
  };
}

export function formatInterPrice(course: TrainingCoursePublic): string {
  if (course.inter_price == null) return "Sur devis";
  return `À partir de ${course.inter_price.toLocaleString("fr-FR")} € HT / participant`;
}

export function formatIntraPrice(course: TrainingCoursePublic): string {
  if (course.intra_price == null) return "Sur devis";
  return `${course.intra_price.toLocaleString("fr-FR")} € HT / groupe`;
}

export function isBlockVisible(detail: TrainingCourseDetail, blockId: TrainingPageBlock["id"]): boolean {
  const block = detail.pageBlocks.find((b) => b.id === blockId);
  return block?.visible ?? true;
}
