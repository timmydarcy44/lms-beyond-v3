import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

// GET - Récupérer les flashcards d'un cours ou d'un chapitre
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const chapterId = searchParams.get("chapterId");

    if (!courseId && !chapterId) {
      return NextResponse.json({ error: "courseId ou chapterId requis" }, { status: 400 });
    }

    let query = supabase.from("flashcards").select("*");

    if (chapterId) {
      query = query.eq("chapter_id", chapterId);
    } else if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: flashcards, error } = await query.order("created_at", { ascending: true });

    if (error) {
      console.error("[api/flashcards] Erreur:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    return NextResponse.json({ flashcards: flashcards || [] });
  } catch (error) {
    console.error("[api/flashcards] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une flashcard
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

    // Vérifier si l'utilisateur est un super admin
    const { data: superAdminCheck } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    
    const isSuperAdmin = !!superAdminCheck;

    const body = await request.json();
    const { courseId, chapterId, front, back } = body;

    console.log("[api/flashcards] POST request:", JSON.stringify({
      courseId,
      chapterId,
      front: front?.substring(0, 30),
      back: back?.substring(0, 30),
      userId: user.id,
      isSuperAdmin
    }));

    if (!front || !back) {
      return NextResponse.json({ error: "front et back requis" }, { status: 400 });
    }

    if (!courseId && !chapterId) {
      return NextResponse.json({ error: "courseId ou chapterId requis" }, { status: 400 });
    }

    // Vérifier que le cours existe et que l'utilisateur est le créateur
    if (courseId) {
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, creator_id")
        .eq("id", courseId)
        .maybeSingle();
      
      if (courseError) {
        console.error("[api/flashcards] Erreur lors de la vérification du cours:", JSON.stringify(courseError));
      }
      
      if (!course) {
        console.error("[api/flashcards] Cours introuvable:", courseId);
        return NextResponse.json({ 
          error: "Cours introuvable",
          details: `Le cours avec l'ID ${courseId} n'existe pas`
        }, { status: 404 });
      }
      
      console.log("[api/flashcards] Vérification du cours:", JSON.stringify({
        courseId: course.id,
        creatorId: course.creator_id,
        userId: user.id,
        isCreator: course.creator_id === user.id,
        isSuperAdmin: isSuperAdmin
      }));
      
      // Vérifier que l'utilisateur est le créateur OU un super admin
      if (course.creator_id !== user.id && !isSuperAdmin) {
        console.error("[api/flashcards] Utilisateur non autorisé:", JSON.stringify({
          courseId: course.id,
          creatorId: course.creator_id,
          userId: user.id,
          isSuperAdmin
        }));
        return NextResponse.json({ 
          error: "Non autorisé",
          details: "Vous n'êtes pas autorisé à créer des flashcards pour ce cours"
        }, { status: 403 });
      }
    }

    const { data: flashcard, error } = await supabase
      .from("flashcards")
      .insert({
        course_id: courseId || null,
        chapter_id: chapterId || null,
        front: front.trim(),
        back: back.trim(),
      })
      .select()
      .single();

    if (flashcard) {
      console.log("[api/flashcards] Flashcard created:", JSON.stringify({
        id: flashcard.id,
        course_id: flashcard.course_id,
        chapter_id: flashcard.chapter_id
      }));
    }

    if (error) {
      console.error("[api/flashcards] Erreur lors de la création:", JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
        courseId,
        chapterId,
        front: front?.substring(0, 30),
        back: back?.substring(0, 30),
      }));
      return NextResponse.json({ 
        error: "Erreur lors de la création",
        details: error.message || "Impossible de créer la flashcard",
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ flashcard });
  } catch (error) {
    console.error("[api/flashcards] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour une flashcard
export async function PUT(request: NextRequest) {
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
    const { id, front, back } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    if (!front || !back) {
      return NextResponse.json({ error: "front et back requis" }, { status: 400 });
    }

    const { data: flashcard, error } = await supabase
      .from("flashcards")
      .update({
        front: front.trim(),
        back: back.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[api/flashcards] Erreur:", error);
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    }

    return NextResponse.json({ flashcard });
  } catch (error) {
    console.error("[api/flashcards] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une flashcard
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const { error } = await supabase.from("flashcards").delete().eq("id", id);

    if (error) {
      console.error("[api/flashcards] Erreur:", error);
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/flashcards] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

