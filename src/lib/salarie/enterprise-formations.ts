import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getLearnerEarnedOpenBadges } from "@/lib/openbadges/learner-visible-badges";
import { buildTrainingCourseDetail } from "@/lib/training-courses/build-detail";
import { catalogFallbackCourses, enrichCoursePublic } from "@/lib/training-courses/catalog-fallback";
import { fetchPublicTrainingCourses } from "@/lib/training-courses/queries";
import type { TrainingCoursePublic } from "@/lib/training-courses/types";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export type SalarieEnterpriseFormation = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  trainer: string;
  date: string;
  time: string;
  place: string;
  objectives: string[];
  modalities: string;
  badgeName: string;
  positioningDone: boolean;
};

const JADE_ASSIGNED = ["auto-02", "nego-01", "comm-03", "ia-02"] as const;

const JADE_SESSION: Record<
  string,
  { date: string; time: string; place: string; trainer: string; positioningDone: boolean }
> = {
  "auto-02": {
    date: "Mardi 4 novembre 2026",
    time: "09:00 – 17:30",
    place: "Paris 8e · Byound",
    trainer: "Camille Bernard",
    positioningDone: true,
  },
  "nego-01": {
    date: "Jeudi 20 novembre 2026",
    time: "09:30 – 17:00",
    place: "Le Havre · salle Byound",
    trainer: "Jérôme Picot",
    positioningDone: false,
  },
  "comm-03": {
    date: "Lundi 8 décembre 2026",
    time: "14:00 – 18:00",
    place: "Visio Byound",
    trainer: "Jessica Contentin",
    positioningDone: false,
  },
  "ia-02": {
    date: "Mercredi 14 janvier 2027",
    time: "09:00 – 12:30",
    place: "Distanciel",
    trainer: "Timmy Darcy",
    positioningDone: false,
  },
};

function mapCourse(
  course: TrainingCoursePublic,
  earnedBadgeNames: Set<string>,
): SalarieEnterpriseFormation {
  const detail = buildTrainingCourseDetail(course);
  const session = detail.sessions[0];
  const badgeName = detail.badgeLabel;
  const trainer = detail.trainers[0]?.name || course.trainer_name || "Formateur Byound";
  const jade = JADE_SESSION[course.slug];
  const positioningDone = jade
    ? jade.positioningDone
    : earnedBadgeNames.has(badgeName.trim().toLowerCase());

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    coverUrl: course.cover_url,
    trainer: jade?.trainer ?? trainer,
    date: jade?.date ?? session?.date ?? "Date communiquée par votre entreprise",
    time: jade?.time ?? "09:00 – 17:30",
    place: jade?.place ?? session?.city ?? "Lieu à confirmer",
    objectives: detail.objectives.length ? detail.objectives : ["Objectifs précisés avec votre session"],
    modalities: detail.formatsLabel || "Présentiel · Distanciel",
    badgeName,
    positioningDone,
  };
}

/** Catalogue entreprise Byound (training_courses), pas les formations CFA. */
export async function listSalarieEnterpriseFormations(input: {
  userId: string;
  email: string | null;
}): Promise<SalarieEnterpriseFormation[]> {
  const client = await getServiceRoleClientOrFallback();
  const courses = await fetchPublicTrainingCourses(client);

  let earned = new Set<string>();
  if (!isJadeDemoEmail(input.email)) {
    try {
      const badges = await getLearnerEarnedOpenBadges(input.userId);
      earned = new Set(badges.map((badge) => badge.name.trim().toLowerCase()).filter(Boolean));
    } catch {
      earned = new Set();
    }
  }

  const mapped = courses.map((course) => mapCourse(course, earned));
  if (!isJadeDemoEmail(input.email)) return mapped;

  const wanted = new Set<string>(JADE_ASSIGNED);
  const jade = mapped.filter((course) => wanted.has(course.slug));
  if (jade.length === JADE_ASSIGNED.length) return jade;

  return catalogFallbackCourses()
    .map(enrichCoursePublic)
    .filter((course) => wanted.has(course.slug))
    .map((course) => mapCourse(course, earned));
}
