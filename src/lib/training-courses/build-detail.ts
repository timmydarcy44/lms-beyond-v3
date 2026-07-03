import type { TrainingCoursePublic } from "@/lib/training-courses/types";
import { EDGE_SPECIALISTS } from "@/lib/edge-site/training-catalog-human";
import type { TrainingReview } from "@/lib/edge-site/training-module-detail";

export type TrainingCourseDetail = {
  course: TrainingCoursePublic;
  benefit: string;
  trainers: {
    id: string;
    name: string;
    specialty: string;
    photoUrl: string;
    missionsCount: number;
    companiesCount: number;
  }[];
  methodology: string[];
  exercises: string[];
  casPratiques: string[];
  competences: string[];
  sessions: { date: string; city: string; seats: string; price: string }[];
  faq: { q: string; a: string }[];
  reviews: TrainingReview[];
  whyFollow: string[];
  formatsLabel: string;
  maxIntraParticipants: number;
};

function formatPrice(value: number | null | undefined, suffix: string): string | null {
  if (value == null) return null;
  return `${value.toLocaleString("fr-FR")} € HT ${suffix}`;
}

export function buildTrainingCourseDetail(course: TrainingCoursePublic): TrainingCourseDetail {
  const benefit =
    course.short_description ??
    course.objectives?.[0] ??
    "Développer des compétences immédiatement applicables en entreprise.";

  const leadTrainer = course.trainer_name
    ? {
        id: course.trainer_id ?? "lead",
        name: course.trainer_name,
        specialty: course.trainer_headline ?? "Formateur expert EDGE",
        photoUrl:
          course.trainer_photo_url ??
          EDGE_SPECIALISTS[0]?.photoUrl ??
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
        missionsCount: 48,
        companiesCount: 32,
      }
    : null;

  const extraTrainers = EDGE_SPECIALISTS.slice(0, 2).map((s) => ({
    id: s.id,
    name: s.name,
    specialty: s.specialty,
    photoUrl: s.photoUrl,
    missionsCount: s.missionsCount,
    companiesCount: s.companiesCount,
  }));

  const trainers = leadTrainer
    ? [leadTrainer, ...extraTrainers.filter((t) => t.id !== leadTrainer.id).slice(0, 1)]
    : extraTrainers;

  const interLabel = formatPrice(course.inter_price, "/ participant");
  const intraLabel = formatPrice(course.intra_price, "/ groupe");

  return {
    course,
    benefit,
    trainers,
    methodology: ["Apports théoriques", "Mises en situation", "Retours d'expérience", "Plan d'action"],
    exercises: ["Ateliers pratiques", "Jeux de rôle", "Études de cas sectoriels"],
    casPratiques: ["Cas concrets issus de votre contexte", "Livrables opérationnels à emporter"],
    competences: course.skills ?? course.objectives ?? [],
    formatsLabel: (course.formats ?? []).join(" · ") || "Présentiel · Distanciel",
    maxIntraParticipants: course.max_intra_participants ?? 12,
    sessions: [
      {
        date: "Prochaine session inter",
        city: "Paris · Distanciel",
        seats: "Places limitées",
        price: interLabel ?? "Sur devis",
      },
      {
        date: "Session intra sur mesure",
        city: "Dans vos locaux ou à distance",
        seats: `Jusqu'à ${course.max_intra_participants ?? 12} participants`,
        price: intraLabel ?? "Sur devis",
      },
    ],
    faq: course.faq?.length
      ? course.faq
      : [
          {
            q: "Quelle différence entre intra et inter ?",
            a: "L'intra est organisée pour votre équipe (jusqu'à 12 participants). L'inter réunit des participants de plusieurs entreprises.",
          },
          {
            q: "La formation est-elle certifiante ?",
            a: `Oui, un ${course.badge_name ?? "Open Badge EDGE"} est délivré en fin de parcours.`,
          },
          {
            q: "Peut-on adapter le programme ?",
            a: "En intra, le contenu peut être personnalisé selon vos enjeux métier.",
          },
        ],
    reviews: [
      {
        author: "Sophie M.",
        role: "DRH",
        company: "PME industrielle",
        rating: 5,
        text: "Formation très concrète, équipe opérationnelle dès le lendemain.",
        photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
      },
      {
        author: "Thomas L.",
        role: "Manager",
        company: "Groupe services",
        rating: 5,
        text: "Intervenant expert et pédagogie adaptée à notre niveau.",
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
      },
      {
        author: "Nadia K.",
        role: "Responsable formation",
        company: "ETI",
        rating: 5,
        text: "Excellent rapport qualité-prix, nous avons renouvelé en intra.",
        photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
      },
    ],
    whyFollow: course.why_choose?.length
      ? course.why_choose
      : (course.objectives ?? []).slice(0, 4),
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
