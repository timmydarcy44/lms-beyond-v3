import { notFound } from "next/navigation";

import { JessicaLessonPlayView } from "./jessica-lesson-wrapper";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import {
  getLearnerContentDetail,
  type LearnerFlashcard,
} from "@/lib/queries/apprenant";
import { getServerClient } from "@/lib/supabase/server";
import { resolveJessicaCreatorId } from "@/lib/jessica-contentin/resolve-creator-id";
import { isJessicaStudioCourse } from "@/lib/jessica-contentin/formation-access";

interface FormationLessonPlayPageProps {
  params: Promise<{
    slug: string;
    lesson: string;
  }>;
}

export default async function FormationLessonPlayPage({ params }: FormationLessonPlayPageProps) {
  const { slug, lesson } = await params;

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

  const jessicaCreatorId = await resolveJessicaCreatorId();

  const courseId = card.id;
  const { data: course } = await readClient
    .from("courses")
    .select("id, creator_id, org_id, created_by")
    .eq("id", courseId)
    .maybeSingle();

  if (!course || !isJessicaStudioCourse(course, jessicaCreatorId)) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  const catalogClient = readClient;

  let hasEnrollment = false;
  if (user?.id) {
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
  }
  
  // Trouver le catalog_item_id pour ce course
  const { data: catalogItem, error: catalogItemError } = await catalogClient
    .from("catalog_items")
    .select("id, is_free, price")
    .eq("content_id", course.id)
    .eq("item_type", "module")
    .maybeSingle();
  
  if (catalogItemError) {
    console.error("[formations/[slug]/play] Error fetching catalog_item:", catalogItemError);
  }

  console.log("[formations/[slug]/play] Access check:", {
    courseId: course.id,
    userId: user?.id,
    catalogItemId: catalogItem?.id,
    isFree: catalogItem?.is_free,
    catalogItemExists: !!catalogItem,
    hasEnrollment,
  });

  // Pas de catalog_item : accès créateur ou apprenant inscrit (enrollment)
  if (!catalogItem) {
    console.warn("[formations/[slug]/play] Catalog item not found for course:", course.id);
    if (user && (course.creator_id === user.id || hasEnrollment)) {
      console.log("[formations/[slug]/play] Access granted (creator or enrollment, no catalog_item)");
    } else {
      console.log("[formations/[slug]/play] No catalog_item and no enrollment, redirecting to catalogue");
      const { redirect } = await import("next/navigation");
      redirect(`/dashboard/catalogue`);
    }
  } else if (user) {
    const isCreator = course.creator_id === user.id;
    
    const { data: userAccess } = await supabase
      .from("catalog_access")
      .select("access_status")
      .eq("catalog_item_id", catalogItem.id)
      .eq("user_id", user.id)
      .is("organization_id", null)
      .maybeSingle();

    const hasExplicitAccess = userAccess && (
      userAccess.access_status === "purchased" ||
      userAccess.access_status === "free" ||
      userAccess.access_status === "manually_granted"
    );

    const hasAccess = isCreator || hasExplicitAccess || hasEnrollment || catalogItem.is_free;

    console.log("[formations/[slug]/play] Access decision:", {
      isCreator,
      hasExplicitAccess,
      isFree: catalogItem.is_free,
      hasAccess,
      accessStatus: userAccess?.access_status,
    });

    if (!hasAccess) {
      // Rediriger vers la page de paiement ou mon-compte (clients Jessica)
      console.log("[formations/[slug]/play] No access, redirecting");
      const { redirect } = await import("next/navigation");
      if (catalogItem.id) {
        redirect(`/dashboard/catalogue/module/${catalogItem.id}/payment`);
      }
      redirect("/mon-compte");
    }
  } else if (!user && !catalogItem.is_free) {
    // Si l'utilisateur n'est pas connecté et le module n'est pas gratuit, rediriger vers la page de paiement
    console.log("[formations/[slug]/play] User not logged in, redirecting to payment:", `/dashboard/catalogue/module/${catalogItem.id}/payment`);
    const { redirect } = await import("next/navigation");
    redirect(`/dashboard/catalogue/module/${catalogItem.id}/payment`);
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

