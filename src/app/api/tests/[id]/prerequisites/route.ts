import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: testId } = await params;
    const supabase = await getServerClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer le test et sa position dans la formation
    const { data: courseTest, error: courseTestError } = await supabase
      .from("course_tests")
      .select(`
        course_id,
        local_section_id,
        local_chapter_id,
        local_subchapter_id,
        local_position_after_id,
        courses (
          id,
          builder_snapshot
        )
      `)
      .eq("test_id", testId)
      .maybeSingle();

    if (courseTestError || !courseTest) {
      // Si le test n'est pas assigné à une formation, permettre l'accès
      return NextResponse.json({ 
        canAccess: true, 
        reason: "Test non assigné à une formation" 
      });
    }

    const course = courseTest.courses as any;
    if (!course || !course.builder_snapshot) {
      return NextResponse.json({ 
        canAccess: true, 
        reason: "Formation sans structure" 
      });
    }

    const snapshot = course.builder_snapshot;
    const sections = snapshot.sections || [];

    // Trouver la position du test dans la structure
    const targetSectionId = courseTest.local_section_id;
    const targetChapterId = courseTest.local_chapter_id;
    const targetPositionAfterId = courseTest.local_position_after_id;

    // Collecter tous les chapitres/lessons qui doivent être complétés avant le test
    const requiredLessons: string[] = [];

    for (const section of sections) {
      if (targetSectionId && section.id !== targetSectionId) {
        // Si le test est dans une section spécifique, on ne vérifie que cette section
        continue;
      }

      if (targetSectionId && section.id === targetSectionId) {
        // Vérifier les chapitres avant le test dans cette section
        for (const chapter of section.chapters || []) {
          if (targetChapterId && chapter.id === targetChapterId) {
            // Si le test est assigné à un chapitre spécifique, vérifier les chapitres avant
            break;
          }
          
          if (targetPositionAfterId && chapter.id === targetPositionAfterId) {
            // On a atteint la position du test, arrêter
            break;
          }

          // Ajouter ce chapitre aux prérequis
          requiredLessons.push(chapter.id);

          // Ajouter aussi les sous-chapitres
          for (const subchapter of chapter.subchapters || []) {
            if (targetPositionAfterId && subchapter.id === targetPositionAfterId) {
              break;
            }
            requiredLessons.push(subchapter.id);
          }
        }
        break;
      } else if (!targetSectionId) {
        // Si le test n'est pas dans une section spécifique, vérifier toutes les sections
        for (const chapter of section.chapters || []) {
          requiredLessons.push(chapter.id);
          for (const subchapter of chapter.subchapters || []) {
            requiredLessons.push(subchapter.id);
          }
        }
      }
    }

    if (requiredLessons.length === 0) {
      return NextResponse.json({ 
        canAccess: true, 
        reason: "Aucun prérequis requis" 
      });
    }

    // Vérifier la progression de l'apprenant dans le cours
    // On vérifie via learning_sessions pour voir quels chapitres ont été consultés
    const { data: learningSessions, error: sessionsError } = await supabase
      .from("learning_sessions")
      .select("content_id, duration_seconds")
      .eq("user_id", user.id)
      .eq("content_type", "course")
      .eq("content_id", course.id);

    // Pour une vérification plus précise, on pourrait aussi vérifier course_progress
    // Mais pour l'instant, on considère qu'une session d'apprentissage = chapitre consulté
    const accessedLessons = new Set(
      learningSessions?.map((s: any) => s.content_id) || []
    );

    // Vérifier si tous les prérequis sont remplis
    const missingLessons = requiredLessons.filter(
      (lessonId) => !accessedLessons.has(lessonId)
    );

    // Alternative: vérifier via course_progress si la progression est > 0 pour les chapitres requis
    // Pour simplifier, on vérifie si l'apprenant a une progression dans le cours
    const { data: courseProgress, error: progressError } = await supabase
      .from("course_progress")
      .select("progress_percentage")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();

    // Si l'apprenant a une progression significative (>50%), on considère qu'il a accès
    // Sinon, on vérifie les sessions d'apprentissage
    const hasSignificantProgress = courseProgress && courseProgress.progress_percentage > 50;

    if (hasSignificantProgress || missingLessons.length === 0) {
      return NextResponse.json({ 
        canAccess: true,
        reason: "Prérequis remplis"
      });
    }

    return NextResponse.json({ 
      canAccess: false,
      reason: "Chapitres non complétés",
      missingCount: missingLessons.length,
      totalRequired: requiredLessons.length
    });

  } catch (error) {
    console.error("[api/tests/prerequisites] Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur",
      canAccess: false 
    }, { status: 500 });
  }
}

