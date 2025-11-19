import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * API pour trouver l'UUID d'un chapitre dans la DB à partir de son ID local (nanoid)
 * Les chapitres sont stockés dans builder_snapshot, on doit les chercher là
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, localChapterId } = body;

    if (!courseId || !localChapterId) {
      return NextResponse.json({ error: "courseId et localChapterId requis" }, { status: 400 });
    }

    // Récupérer le snapshot du cours
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("builder_snapshot")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    const snapshot = course.builder_snapshot as any;
    if (!snapshot || !snapshot.sections) {
      return NextResponse.json({ error: "Snapshot invalide" }, { status: 400 });
    }

    // Chercher le chapitre dans le snapshot
    let foundChapter: any = null;
    for (const section of snapshot.sections || []) {
      for (const chapter of section.chapters || []) {
        if (chapter.id === localChapterId) {
          foundChapter = chapter;
          break;
        }
      }
      if (foundChapter) break;
    }

    if (!foundChapter) {
      return NextResponse.json({ error: "Chapitre introuvable dans le snapshot" }, { status: 404 });
    }

    // Si le chapitre a déjà un UUID de la DB (dans dbId ou id si c'est un UUID)
    if (foundChapter.dbId) {
      return NextResponse.json({ chapterId: foundChapter.dbId });
    }

    // Vérifier si c'est déjà un UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(foundChapter.id)) {
      return NextResponse.json({ chapterId: foundChapter.id });
    }

    // Le chapitre n'a pas encore d'UUID de la DB, il faut le créer
    // Mais pour l'instant, on retourne null car le chapitre n'est pas encore sauvegardé en DB
    return NextResponse.json({ chapterId: null, message: "Le chapitre n'a pas encore été sauvegardé en base de données" });
  } catch (error) {
    console.error("[api/chapters/find-by-local-id] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

