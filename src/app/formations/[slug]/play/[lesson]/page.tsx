import { notFound, redirect } from "next/navigation";

import { JessicaLessonPlayView } from "./jessica-lesson-wrapper";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import {
  getLearnerContentDetail,
  type LearnerFlashcard,
  type LearnerLesson,
} from "@/lib/queries/apprenant";
import { getServerClient } from "@/lib/supabase/server";
import {
  canPlayJessicaFormation,
  lessonIdsFromBuilderSnapshot,
} from "@/lib/jessica-contentin/formation-access";

interface FormationLessonPlayPageProps {
  params: Promise<{
    slug: string;
    lesson: string;
  }>;
}

export default async function FormationLessonPlayPage({ params }: FormationLessonPlayPageProps) {
  const { slug, lesson } = await params;
  const playPath = `/formations/${slug}/play/${lesson}`;

  const data = await getLearnerContentDetail("formations", slug);
  if (!data) {
    notFound();
  }

  const { card, detail } = data;

  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { getServiceRoleClient } = await import("@/lib/supabase/server");
  const serviceClient = getServiceRoleClient();
  const enrollmentClient = serviceClient ?? supabase;

  const { data: course } = await supabase
    .from("courses")
    .select("id, creator_id, org_id, created_by, builder_snapshot")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  const courseId = String(course?.id ?? card.id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(playPath)}`);
  }

  const [{ data: enrollment }, { data: courseEnrollment }] = await Promise.all([
    enrollmentClient
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle(),
    enrollmentClient
      .from("course_enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle(),
  ]);
  const hasEnrollment = Boolean(enrollment) || Boolean(courseEnrollment);

  const catalogReadClient = serviceClient ?? supabase;
  const { data: catalogItem, error: catalogItemError } = await catalogReadClient
    .from("catalog_items")
    .select("id, is_free, price")
    .eq("content_id", courseId)
    .eq("item_type", "module")
    .maybeSingle();

  if (catalogItemError) {
    console.error("[formations/[slug]/play] Error fetching catalog_item:", catalogItemError);
  }

  let catalogAccessStatus: string | null = null;
  if (catalogItem) {
    const { data: userAccess } = await supabase
      .from("catalog_access")
      .select("access_status")
      .eq("catalog_item_id", catalogItem.id)
      .eq("user_id", user.id)
      .is("organization_id", null)
      .maybeSingle();
    catalogAccessStatus = userAccess?.access_status ?? null;
  }

  const isCreator = String(course?.creator_id ?? course?.created_by ?? "") === user.id;
  const hasPlayAccess = canPlayJessicaFormation({
    isCreator,
    hasEnrollment,
    catalogAccessStatus,
    isFree: Boolean(catalogItem?.is_free),
  });

  if (!hasPlayAccess) {
    redirect("/mon-compte");
  }

  const modules = detail.modules || [];
  const allLessons = modules.flatMap((module) => module.lessons ?? []);
  let activeLesson = allLessons.find((item) => item.id === lesson) ?? allLessons[0] ?? null;

  if (!activeLesson && course?.builder_snapshot) {
    const snapshotLessonIds = lessonIdsFromBuilderSnapshot(course.builder_snapshot);
    const requestedExists = snapshotLessonIds.includes(lesson);
    const fallbackLessonId = requestedExists ? lesson : snapshotLessonIds[0];
    if (fallbackLessonId) {
      activeLesson = {
        id: fallbackLessonId,
        title: "Chapitre",
        type: "document",
      } as LearnerLesson;
    }
  }

  if (!activeLesson) {
    redirect(`/formations/${slug}`);
  }

  const activeModule = modules.find((module) =>
    module.lessons?.some((item: { id: string }) => item.id === activeLesson.id),
  );
  const videoSrc = activeLesson.videoUrl || detail.trailerUrl || undefined;
  const activeIndex = allLessons.findIndex((item: { id: string }) => item.id === activeLesson.id);
  const previousLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
  const flashcards = activeLesson.flashcards ?? [];
  const baseHref = `/formations/${slug}`;

  return (
    <DyslexiaModeProvider>
      <div className="min-h-screen" style={{ backgroundColor: "#F8F5F0" }}>
        <JessicaLessonPlayView
          detail={detail}
          modules={modules}
          activeLesson={activeLesson}
          activeModule={activeModule}
          videoSrc={videoSrc ?? null}
          cardHref={baseHref}
          flashcards={flashcards}
          previousLesson={
            previousLesson ? { id: previousLesson.id, title: previousLesson.title ?? "Chapitre précédent" } : undefined
          }
          nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title ?? "Chapitre suivant" } : undefined}
          courseId={card.id}
          courseTitle={card.title}
        />
      </div>
    </DyslexiaModeProvider>
  );
}
