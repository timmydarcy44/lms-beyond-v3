import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

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
    const scope = (searchParams.get("scope") ?? "chapter").trim().toLowerCase();
    const chapterKeyRaw =
      searchParams.get("chapterKey") ??
      searchParams.get("localChapterRef") ??
      searchParams.get("chapterId");
    const chapterKey = chapterKeyRaw?.trim() || null;
    const countsOnly = searchParams.get("counts") === "1";

    if (countsOnly) {
      if (!courseId) {
        return NextResponse.json({ error: "courseId requis pour counts" }, { status: 400 });
      }
      const { data: countRows, error: countsError } = await supabase
        .from("flashcards")
        .select("chapter_id")
        .eq("course_id", courseId);

      if (countsError) {
        console.error("[api/flashcards] Erreur counts:", countsError);
        return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
      }

      const counts: Record<string, number> = {};
      for (const row of countRows ?? []) {
        const cid = (row as { chapter_id?: string | null }).chapter_id;
        if (!cid) continue;
        counts[cid] = (counts[cid] ?? 0) + 1;
      }
      return NextResponse.json({ counts });
    }

    if (!chapterKey) {
      return NextResponse.json({ flashcards: [] });
    }

    let query = supabase.from("flashcards").select("*");

    if (courseId) {
      const k = chapterKey.replace(/,/g, "\\,");
      if (scope === "subchapter") {
        if (!isUuid(chapterKey)) {
          return NextResponse.json({ flashcards: [] });
        }
        query = query.eq("course_id", courseId).eq("subchapter_id", chapterKey);
      } else {
        // Chapitre: strictement subchapter_id IS NULL
        if (!isUuid(chapterKey)) {
          return NextResponse.json({ flashcards: [] });
        }
        query = query.eq("course_id", courseId).is("subchapter_id", null).eq("chapter_id", chapterKey);
      }
    } else if (isUuid(chapterKey)) {
      query = scope === "subchapter"
        ? query.eq("subchapter_id", chapterKey)
        : query.eq("chapter_id", chapterKey).is("subchapter_id", null);
    } else {
      return NextResponse.json({ flashcards: [] });
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
    const body = await request.json();
    console.log("BODY RECEIVED:", body);

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

    const courseId = body?.courseId ?? null;
    const chapterId = body?.chapterId ?? null;
    const scope = String(body?.scope ?? "chapter").trim().toLowerCase();
    const builderLocalChapterId =
      body?.builderLocalChapterId != null ? String(body.builderLocalChapterId) : null;
    const localChapterRef = body?.localChapterRef != null ? String(body.localChapterRef) : null;
    const frontRaw = body?.front ?? body?.question;
    const backRaw = body?.back ?? body?.answer;
    const front =
      frontRaw === undefined || frontRaw === null ? null : String(frontRaw).trim() || null;
    const back =
      backRaw === undefined || backRaw === null ? null : String(backRaw).trim() || null;
    const flashcards = Array.isArray(body?.flashcards) ? (body.flashcards as unknown[]) : null;

    console.log("[api/flashcards] POST request:", JSON.stringify({
      courseId,
      chapterId,
      bulk: Array.isArray(flashcards) ? flashcards.length : 0,
      front: typeof front === "string" ? front.substring(0, 30) : null,
      back: typeof back === "string" ? back.substring(0, 30) : null,
      userId: user.id,
      isSuperAdmin,
    }));

    const hasLocalScope = Boolean(builderLocalChapterId || localChapterRef);
    if (!courseId && !chapterId && !hasLocalScope) {
      return NextResponse.json({ error: "courseId ou chapterId (ou référence locale) requis" }, { status: 400 });
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

    // Bulk insert/update
    if (flashcards && Array.isArray(flashcards)) {
      const isUuid = (value: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

      const isSubchapter = scope === "subchapter";
      const uuidChapter =
        !isSubchapter && chapterId && isUuid(String(chapterId)) ? String(chapterId) : null;
      const uuidSubchapter =
        isSubchapter && chapterId && isUuid(String(chapterId)) ? String(chapterId) : null;
      const persistedLocalChapterRef =
        !isSubchapter ? null : null;
      const persistedLocalSubchapterRef =
        null;

      const rowsWithId: Array<Record<string, unknown>> = [];
      const rowsWithoutId: Array<Record<string, unknown>> = [];

      for (const raw of flashcards) {
        const obj = raw as Record<string, unknown>;
        const id = obj?.id ? String(obj.id) : "";
        const f = String(obj?.front ?? obj?.question ?? "").trim();
        const b = String(obj?.back ?? obj?.answer ?? "").trim();
        if (!f || !b) continue;

        const base = {
          course_id: courseId || null,
          chapter_id: uuidChapter,
          subchapter_id: uuidSubchapter,
          front: f,
          back: b,
          question: f,
          answer: b,
        } satisfies Record<string, unknown>;

        if (id && isUuid(id)) rowsWithId.push({ ...base, id });
        else rowsWithoutId.push(base);
      }

      if (flashcards.length > 0 && rowsWithId.length + rowsWithoutId.length === 0) {
        return NextResponse.json(
          {
            error: "Aucune flashcard valide",
            details:
              "Chaque carte doit avoir question et answer (ou front et back) non vides après normalisation.",
          },
          { status: 400 },
        );
      }

      if (rowsWithId.length > 0) {
        const { error: upsertErr } = await supabase.from("flashcards").upsert(rowsWithId as never, { onConflict: "id" });
        if (upsertErr) {
          console.error("[api/flashcards] Bulk upsert error:", upsertErr);
          return NextResponse.json({ error: "Erreur lors de la sauvegarde", details: upsertErr.message }, { status: 500 });
        }
      }

      let inserted: any[] = [];
      if (rowsWithoutId.length > 0) {
        const { data: insertedRows, error: insertErr } = await supabase.from("flashcards").insert(rowsWithoutId as never).select("*");
        if (insertErr) {
          console.error("[api/flashcards] Bulk insert error:", insertErr);
          return NextResponse.json({ error: "Erreur lors de la sauvegarde", details: insertErr.message }, { status: 500 });
        }
        inserted = insertedRows || [];
      }

      console.log("SUCCESS SAVING FLASHCARDS");
      return NextResponse.json({ success: true, insertedCount: inserted.length });
    }

    if (!front || !back) {
      return NextResponse.json(
        {
          error: "question et answer requis",
          details: "Envoyez question/answer ou front/back (chaînes non vides après trim).",
        },
        { status: 400 },
      );
    }

    const uuidChapter =
      chapterId && isUuid(String(chapterId)) ? String(chapterId) : null;
    const isSubchapterSingle = scope === "subchapter";
    const uuidChapterSingle = !isSubchapterSingle ? uuidChapter : null;
    const uuidSubchapterSingle = isSubchapterSingle ? uuidChapter : null;
    const persistedLocalChapterRefSingle =
      null;
    const persistedLocalSubchapterRefSingle =
      null;

    if (!uuidChapterSingle && !uuidSubchapterSingle && !courseId) {
      return NextResponse.json(
        { error: "chapterId (UUID ou local) ou courseId requis pour ancrer la flashcard" },
        { status: 400 },
      );
    }

    const { data: flashcard, error } = await supabase
      .from("flashcards")
      .insert({
        course_id: courseId || null,
        chapter_id: uuidChapterSingle,
        subchapter_id: uuidSubchapterSingle,
        front: front,
        back: back,
        question: front,
        answer: back,
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
    const { id, front, back, question, answer } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const nextFront = String(front ?? question ?? "").trim();
    const nextBack = String(back ?? answer ?? "").trim();
    if (!nextFront || !nextBack) {
      return NextResponse.json(
        { error: "front et back (ou question et answer) requis" },
        { status: 400 },
      );
    }

    const { data: flashcard, error } = await supabase
      .from("flashcards")
      .update({
        front: nextFront,
        back: nextBack,
        question: nextFront,
        answer: nextBack,
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

