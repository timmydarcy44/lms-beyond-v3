import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      testId,
      courseId,
      sectionId,
      chapterId,
      subchapterId,
      positionAfterId,
      positionType,
    } = body;

    if (!testId || !courseId) {
      return NextResponse.json({ error: "testId et courseId requis" }, { status: 400 });
    }

    // Vérifier que le test et la formation appartiennent au formateur
    const [testCheck, courseCheck] = await Promise.all([
      supabase
        .from("tests")
        .select("id, created_by, owner_id")
        .eq("id", testId)
        .single(),
      supabase
        .from("courses")
        .select("id, creator_id, owner_id")
        .eq("id", courseId)
        .single(),
    ]);

    if (testCheck.error || !testCheck.data) {
      return NextResponse.json({ error: "Test introuvable" }, { status: 404 });
    }

    if (courseCheck.error || !courseCheck.data) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    const isTestOwner = (testCheck.data.created_by === user.id) || (testCheck.data.owner_id === user.id);
    const isCourseOwner = (courseCheck.data.creator_id === user.id) || (courseCheck.data.owner_id === user.id);

    if (!isTestOwner || !isCourseOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Calculer l'ordre
    const { data: existingAssignments } = await supabase
      .from("course_tests")
      .select("order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: false })
      .limit(1);

    const orderIndex = existingAssignments && existingAssignments.length > 0
      ? existingAssignments[0].order_index + 1
      : 0;

    // Insérer ou mettre à jour l'assignation
    const { data, error } = await supabase
      .from("course_tests")
      .upsert({
        course_id: courseId,
        test_id: testId,
        section_id: sectionId || null,
        chapter_id: chapterId || null,
        subchapter_id: subchapterId || null,
        position_after_id: positionAfterId || null,
        position_type: positionType || null,
        order_index: orderIndex,
      }, {
        onConflict: "course_id,test_id",
      })
      .select()
      .single();

    if (error) {
      console.error("[api/tests/assign-to-course] Erreur:", error);
      return NextResponse.json({ error: "Erreur lors de l'assignation" }, { status: 500 });
    }

    return NextResponse.json({ success: true, assignment: data });
  } catch (error) {
    console.error("[api/tests/assign-to-course] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}




