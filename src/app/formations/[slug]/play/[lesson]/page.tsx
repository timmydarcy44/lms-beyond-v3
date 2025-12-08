import { notFound } from "next/navigation";

import { JessicaLessonPlayView } from "./jessica-lesson-wrapper";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import {
  getLearnerContentDetail,
  type LearnerFlashcard,
} from "@/lib/queries/apprenant";
import { getServerClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

interface FormationLessonPlayPageProps {
  params: Promise<{
    slug: string;
    lesson: string;
  }>;
}

export default async function FormationLessonPlayPage({ params }: FormationLessonPlayPageProps) {
  const { slug, lesson } = await params;

  // Récupérer les détails de la formation
  const data = await getLearnerContentDetail("formations", slug);
  if (!data) {
    notFound();
  }

  // Vérifier que c'est bien une formation de Jessica Contentin
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  // Récupérer l'ID de Jessica Contentin
  const { data: jessicaProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  if (!jessicaProfile) {
    notFound();
  }

  // Récupérer le course et vérifier le creator_id
  const { data: course } = await supabase
    .from("courses")
    .select("id, creator_id")
    .eq("id", slug)
    .maybeSingle();

  if (!course || course.creator_id !== jessicaProfile.id) {
    notFound();
  }

  // SÉCURITÉ: Vérifier l'accès de l'utilisateur dans catalog_access
  const { data: { user } } = await supabase.auth.getUser();
  
  // Trouver le catalog_item_id pour ce course
  const { data: catalogItem } = await supabase
    .from("catalog_items")
    .select("id, is_free, price")
    .eq("content_id", course.id)
    .eq("item_type", "module")
    .maybeSingle();

  console.log("[formations/[slug]/play] Access check:", {
    courseId: course.id,
    userId: user?.id,
    catalogItemId: catalogItem?.id,
    isFree: catalogItem?.is_free,
    catalogItemExists: !!catalogItem,
  });

  // Si le catalog_item n'existe pas, permettre l'accès au créateur uniquement
  // (pour les anciens cours qui n'ont pas encore de catalog_item)
  if (!catalogItem) {
    console.warn("[formations/[slug]/play] Catalog item not found for course:", course.id);
    if (user && course.creator_id === user.id) {
      // Le créateur peut toujours accéder
      console.log("[formations/[slug]/play] Creator access granted (no catalog_item)");
    } else {
      // Pour les autres utilisateurs, rediriger vers le catalogue
      console.log("[formations/[slug]/play] No catalog_item and not creator, redirecting to catalogue");
      const { redirect } = await import("next/navigation");
      redirect(`/dashboard/catalogue`);
    }
    // Continuer l'exécution si c'est le créateur
  } else if (user) {
    // Vérifier si l'utilisateur est le créateur
    const isCreator = course.creator_id === user.id;
    
    // Vérifier l'accès dans catalog_access
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

    const hasAccess = isCreator || hasExplicitAccess || catalogItem.is_free;

    console.log("[formations/[slug]/play] Access decision:", {
      isCreator,
      hasExplicitAccess,
      isFree: catalogItem.is_free,
      hasAccess,
      accessStatus: userAccess?.access_status,
    });

    if (!hasAccess) {
      // Rediriger vers la page de paiement
      console.log("[formations/[slug]/play] No access, redirecting to payment:", `/dashboard/catalogue/module/${catalogItem.id}/payment`);
      const { redirect } = await import("next/navigation");
      redirect(`/dashboard/catalogue/module/${catalogItem.id}/payment`);
    }
  } else if (!user && !catalogItem.is_free) {
    // Si l'utilisateur n'est pas connecté et le module n'est pas gratuit, rediriger vers la page de paiement
    console.log("[formations/[slug]/play] User not logged in, redirecting to payment:", `/dashboard/catalogue/module/${catalogItem.id}/payment`);
    const { redirect } = await import("next/navigation");
    redirect(`/dashboard/catalogue/module/${catalogItem.id}/payment`);
  }

  const { card, detail } = data;
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
      <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
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

