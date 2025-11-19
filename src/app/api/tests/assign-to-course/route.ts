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

    // Fonction pour vérifier si une chaîne est un UUID valide
    const isValidUUID = (str: string | null | undefined): boolean => {
      if (!str) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    // Séparer les IDs UUID (pour les tables relationnelles) et les IDs locaux (pour le builder_snapshot)
    // Les IDs locaux (nanoids) sont stockés dans des colonnes texte séparées
    const cleanSectionId = isValidUUID(sectionId) ? sectionId : null;
    const cleanChapterId = isValidUUID(chapterId) ? chapterId : null;
    const cleanSubchapterId = isValidUUID(subchapterId) ? subchapterId : null;
    const cleanPositionAfterId = isValidUUID(positionAfterId) ? positionAfterId : null;
    
    // Stocker les IDs locaux (nanoids) dans des colonnes texte
    const localSectionId = !isValidUUID(sectionId) && sectionId ? sectionId : null;
    const localChapterId = !isValidUUID(chapterId) && chapterId ? chapterId : null;
    const localSubchapterId = !isValidUUID(subchapterId) && subchapterId ? subchapterId : null;
    const localPositionAfterId = !isValidUUID(positionAfterId) && positionAfterId ? positionAfterId : null;

    // Vérifier que le test et la formation appartiennent au formateur
    const [testCheck, courseCheck] = await Promise.all([
      supabase
        .from("tests")
        .select("id, created_by, owner_id, creator_id")
        .eq("id", testId)
        .single(),
      supabase
        .from("courses")
        .select("id, creator_id, owner_id")
        .eq("id", courseId)
        .single(),
    ]);

    if (testCheck.error || !testCheck.data) {
      console.error("[api/tests/assign-to-course] Test not found:", {
        testId,
        error: testCheck.error,
        user: user.id,
      });
      return NextResponse.json({ 
        error: "Test introuvable",
        details: testCheck.error?.message || "Le test n'existe pas ou vous n'y avez pas accès"
      }, { status: 404 });
    }

    if (courseCheck.error || !courseCheck.data) {
      console.error("[api/tests/assign-to-course] Course not found:", {
        courseId,
        error: courseCheck.error,
        user: user.id,
      });
      return NextResponse.json({ 
        error: "Formation introuvable",
        details: courseCheck.error?.message || "La formation n'existe pas ou vous n'y avez pas accès"
      }, { status: 404 });
    }

    // Vérifier la propriété du test (created_by, owner_id, ou creator_id)
    const testCreatedBy = testCheck.data.created_by || (testCheck.data as any).creator_id;
    const testOwnerId = testCheck.data.owner_id;
    const isTestOwner = (testCreatedBy === user.id) || (testOwnerId === user.id);

    // Vérifier la propriété de la formation
    const isCourseOwner = (courseCheck.data.creator_id === user.id) || (courseCheck.data.owner_id === user.id);

    if (!isTestOwner) {
      console.error("[api/tests/assign-to-course] User is not test owner:", {
        testId,
        userId: user.id,
        testCreatedBy,
        testOwnerId,
      });
      return NextResponse.json({ 
        error: "Non autorisé",
        details: "Vous n'êtes pas propriétaire de ce test"
      }, { status: 403 });
    }

    if (!isCourseOwner) {
      console.error("[api/tests/assign-to-course] User is not course owner:", {
        courseId,
        userId: user.id,
        courseCreatorId: courseCheck.data.creator_id,
        courseOwnerId: courseCheck.data.owner_id,
      });
      return NextResponse.json({ 
        error: "Non autorisé",
        details: "Vous n'êtes pas propriétaire de cette formation"
      }, { status: 403 });
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
    // Stocker à la fois les UUIDs (si disponibles) et les IDs locaux (nanoids) du builder
    const { data, error } = await supabase
      .from("course_tests")
      .upsert({
        course_id: courseId,
        test_id: testId,
        section_id: cleanSectionId,
        chapter_id: cleanChapterId,
        subchapter_id: cleanSubchapterId,
        position_after_id: cleanPositionAfterId,
        position_type: positionType || null,
        order_index: orderIndex,
        // Stocker les IDs locaux (nanoids) pour le positionnement dans le builder_snapshot
        local_section_id: localSectionId,
        local_chapter_id: localChapterId,
        local_subchapter_id: localSubchapterId,
        local_position_after_id: localPositionAfterId,
      }, {
        onConflict: "course_id,test_id",
      })
      .select()
      .single();

    if (error) {
      console.error("[api/tests/assign-to-course] Erreur lors de l'insertion:", {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        testId,
        courseId,
        sectionId,
        chapterId,
        subchapterId,
        positionAfterId,
        positionType,
        orderIndex,
        userId: user.id,
      });
      return NextResponse.json({ 
        error: "Erreur lors de l'assignation",
        details: error.message || error.details || error.hint || "Impossible d'assigner le test à la formation",
        code: error.code,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, assignment: data });
  } catch (error) {
    console.error("[api/tests/assign-to-course] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}





