import { notFound, redirect } from "next/navigation";

import { JessicaLessonPlayView } from "./jessica-lesson-wrapper";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import {
  getLearnerContentDetail,
  type LearnerFlashcard,
} from "@/lib/queries/apprenant";
import { getServerClient } from "@/lib/supabase/server";
import {
  canPlayJessicaFormation,
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
  const readClient = serviceClient ?? supabase;

  const courseId = card.id;
  const { data: course } = await readClient
    .from("courses")
    .select("id, creator_id, org_id, created_by")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(playPath)}`);
  }

  let hasEnrollment = false;
  const enrollmentClient = serviceClient || supabase;
  const [{ data: enrollment }, { data: courseEnrollment }] = await Promise.all([
    enrollmentClient
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle(),
    enrollmentClient
      .from("course_enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle(),
  ]);
  hasEnrollment = Boolean(enrollment) || Boolean(courseEnrollment);

  const catalogClient = readClient;

  const { data: catalogItem, error: catalogItemError } = await catalogClient
    .from("catalog_items")
    .select("id, is_free, price")
    .eq("content_id", course.id)
    .eq("item_type", "module")
    .maybeSingle();
  
  if (catalogItemError) {
    console.error("[formations/[slug]/play] Error fetching catalog_item:", catalogItemError);
  }

  let catalogAccessStatus: string | null = null;
  if (catalogItem && user) {
    const { data: userAccess } = await supabase
      .from("catalog_access")
      .select("access_status")
      .eq("catalog_item_id", catalogItem.id)
      .eq("user_id", user.id)
      .is("organization_id", null)
      .maybeSingle();
    catalogAccessStatus = userAccess?.access_status ?? null;
  }

  const isCreator = String(course.creator_id ?? course.created_by ?? "") === user.id;
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
  const activeLesson = allLessons.find((item) => item.id === lesson) ?? allLessons[0];

  if (!activeLesson) {
    console.warn("[formation/play] Lesson not found:", { lesson, availableLessons: allLessons.map(l => l.id) });
    notFound();
  }

  const activeModule = modules.find((module) => module.lessons?.some((item: { id: string }) => item.id === activeLesson.id));
  const videoSrc = activeLesson.videoUrl || detail.trailerUrl || undefined;
  const activeIndex = allLessons.findIndex((item: { id: string }) => item.id === activeLesson.id);
  const previousLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
  const flashcards = activeLesson.flashcards ?? [];
  
  // Debug: Log des flashcards
  console.log("[formation/play] Active lesson flashcards:", JSON.stringify({
    lessonId: activeLesson.id,
    lessonTitle: activeLesson.title,
    flashcardsCount: flashcards.length,
    flashcards: flashcards.map((f: LearnerFlashcard) => ({ id: f.id, front: f.front?.substring(0, 30) }))
  }));
  
  // Utiliser la route formations au lieu de catalog/formations
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

