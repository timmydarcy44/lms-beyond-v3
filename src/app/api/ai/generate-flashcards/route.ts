import { NextRequest, NextResponse } from "next/server";

import { generateJSON } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";
import { loadPrompt } from "@/lib/ai/prompt-loader";
import { logAIInteraction } from "@/lib/ai/ai-interaction-logger";

export async function POST(request: NextRequest) {
  let chapterContent: string | undefined;
  let chapterTitle: string | undefined;
  
  try {
    const body = await request.json();
    chapterContent = body.chapterContent;
    chapterTitle = body.chapterTitle;
    const chapterId = body.chapterId; // ID local du chapitre (peut être un nanoid)
    const courseId = body.courseId; // ID du cours pour sauvegarder les flashcards

    if (!chapterContent || typeof chapterContent !== "string" || chapterContent.trim().length < 50) {
      return NextResponse.json({ error: "Le contenu du chapitre doit contenir au moins 50 caractères" }, { status: 400 });
    }

    if (!chapterTitle || typeof chapterTitle !== "string") {
      return NextResponse.json({ error: "Le titre du chapitre est requis" }, { status: 400 });
    }

    // Vérifier l'authentification
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Charger le prompt personnalisé ou utiliser le défaut
    const startTime = Date.now();
    const fullPrompt = await loadPrompt("generate-flashcards", { chapterContent, chapterTitle });

    // Schéma JSON pour les flashcards
    const schema = {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              difficulty: { type: "string", enum: ["facile", "intermédiaire", "expert"] },
            },
            required: ["question", "answer", "tags", "difficulty"],
          },
        },
      },
      required: ["flashcards"],
    };

    // Construire le prompt système pour OpenAI
    const systemPrompt = `Tu es un expert en pédagogie. Génère des flashcards de qualité à partir du contenu fourni.
Génère entre 5 et 10 flashcards pertinentes basées sur le contenu du chapitre.
Chaque flashcard doit avoir :
- Une question claire et précise
- Une réponse détaillée et pédagogique
- Des tags pertinents (3-5 tags par flashcard)
- Un niveau de difficulté approprié (facile, intermédiaire, ou expert)`;

    // Utiliser OpenAI pour la génération de flashcards
    const result = await generateJSON(fullPrompt, schema, systemPrompt);
    const duration = Date.now() - startTime;

    if (!result) {
      const errorMsg = "Impossible de générer les flashcards. Vérifiez que la clé API OpenAI est configurée.";
      await logAIInteraction({
        userId: authData.user.id,
        featureId: "generate-flashcards",
        featureName: "Génération de flashcards",
        promptUsed: fullPrompt,
        promptVariables: { chapterContent, chapterTitle },
        success: false,
        errorMessage: errorMsg,
        durationMs: duration,
      });
      return NextResponse.json({ 
        error: errorMsg,
        details: "La clé API OpenAI (OPENAI_API_KEY) est peut-être manquante ou invalide."
      }, { status: 500 });
    }

    if (!result.flashcards || !Array.isArray(result.flashcards)) {
      const errorMsg = "Le format de la réponse est invalide. Les flashcards n'ont pas pu être extraites.";
      await logAIInteraction({
        userId: authData.user.id,
        featureId: "generate-flashcards",
        featureName: "Génération de flashcards",
        promptUsed: fullPrompt,
        promptVariables: { chapterContent, chapterTitle },
        success: false,
        errorMessage: errorMsg,
        durationMs: duration,
      });
      console.error("[ai] Invalid flashcards format:", result);
      return NextResponse.json({ 
        error: errorMsg,
        details: "La réponse de l'IA ne contient pas de flashcards valides."
      }, { status: 500 });
    }

    // Sauvegarder les flashcards dans la base de données si courseId est fourni
    // Essayer de trouver l'UUID du chapitre si chapterId est fourni
    let savedFlashcards = [];
    let actualChapterId: string | null = null;
    
    if (courseId && typeof courseId === "string" && chapterId) {
      // Vérifier si chapterId est un UUID ou un ID local
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(chapterId)) {
        actualChapterId = chapterId;
      } else {
        // C'est un ID local, essayer de trouver l'UUID correspondant dans le snapshot
        try {
          const { data: course } = await supabase
            .from("courses")
            .select("builder_snapshot")
            .eq("id", courseId)
            .single();

          if (course?.builder_snapshot) {
            const snapshot = course.builder_snapshot as any;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            outer: for (const section of snapshot.sections || []) {
              for (const chapter of section.chapters || []) {
                if (chapter.id === chapterId) {
                  if (chapter.dbId) {
                    actualChapterId = chapter.dbId;
                  } else if (uuidRegex.test(chapter.id)) {
                    actualChapterId = chapter.id;
                  }
                  break outer;
                }
                for (const sub of chapter.subchapters || []) {
                  if (sub.id === chapterId) {
                    if (sub.dbId) {
                      actualChapterId = sub.dbId;
                    } else if (uuidRegex.test(sub.id)) {
                      actualChapterId = sub.id;
                    }
                    break outer;
                  }
                }
              }
            }
          }
        } catch (findError) {
          console.warn("[ai/generate-flashcards] Could not find chapter UUID for local ID:", chapterId, findError);
        }
      }
    }
    
    // TOUJOURS sauvegarder les flashcards en DB, même si le chapitre n'a pas d'UUID
    // Elles seront mises à jour plus tard quand le chapitre sera sauvegardé
    if (courseId && typeof courseId === "string") {
      try {
        const uuidRe =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const localChapterRefForInsert =
          chapterId && typeof chapterId === "string" && !uuidRe.test(String(chapterId))
            ? String(chapterId).trim()
            : null;

        // Préparer les données pour l'insertion (front/back + miroir question/answer)
        const flashcardsToInsert = result.flashcards
          .map((flashcard: any) => {
            const q = String(flashcard.question ?? "").trim();
            const a = String(flashcard.answer ?? "").trim();
            if (!q || !a) return null;
            return {
              course_id: courseId,
              chapter_id: actualChapterId,
              local_chapter_ref: localChapterRefForInsert,
              front: q,
              back: a,
              question: q,
              answer: a,
            };
          })
          .filter(Boolean);

        // Vérifier si l'utilisateur est un super admin
        const { data: superAdminCheck } = await supabase
          .from("super_admins")
          .select("id")
          .eq("user_id", authData.user.id)
          .eq("is_active", true)
          .maybeSingle();
        
        const isSuperAdmin = !!superAdminCheck;

        // Vérifier que le cours existe et que l'utilisateur est le créateur
        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select("id, creator_id")
          .eq("id", courseId)
          .maybeSingle();
        
        if (courseError) {
          console.error("[ai/generate-flashcards] Erreur lors de la vérification du cours:", JSON.stringify(courseError));
        }
        
        if (!course) {
          console.error("[ai/generate-flashcards] Cours introuvable:", courseId);
        } else {
          console.log("[ai/generate-flashcards] Vérification du cours:", JSON.stringify({
            courseId: course.id,
            creatorId: course.creator_id,
            userId: authData.user.id,
            isCreator: course.creator_id === authData.user.id,
            isSuperAdmin: isSuperAdmin
          }));
        }

        let insertedFlashcards: any[] = [];
        let insertError: { message?: string; code?: string; details?: string; hint?: string } | null = null;
        if (flashcardsToInsert.length > 0) {
          const ins = await supabase.from("flashcards").insert(flashcardsToInsert).select();
          insertedFlashcards = ins.data || [];
          insertError = ins.error;
        }

        if (insertError) {
          console.error("[ai/generate-flashcards] Error saving flashcards to database:", JSON.stringify({
            error: {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
            },
            courseId,
            actualChapterId,
            flashcardsCount: flashcardsToInsert.length
          }));
          // Ne pas échouer complètement si la sauvegarde échoue, on retourne quand même les flashcards générées
        } else {
          savedFlashcards = insertedFlashcards || [];
          console.log(`[ai/generate-flashcards] Successfully saved ${savedFlashcards.length} flashcards to database with chapter_id: ${actualChapterId || 'null'}`);
        }
      } catch (saveError) {
        console.error("[ai] Error saving flashcards:", saveError);
        // Ne pas échouer complètement si la sauvegarde échoue
      }
    }

    // Enregistrer l'interaction
    await logAIInteraction({
      userId: authData.user.id,
      featureId: "generate-flashcards",
      featureName: "Génération de flashcards",
      promptUsed: fullPrompt,
      promptVariables: { chapterContent, chapterTitle, chapterId },
      response: { 
        flashcardsCount: result.flashcards?.length,
        savedCount: savedFlashcards.length 
      },
      success: true,
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      flashcards: result.flashcards,
      saved: savedFlashcards.length > 0,
      savedCount: savedFlashcards.length,
      savedFlashcards: savedFlashcards,
      chapterId: actualChapterId,
      /** Id builder (chapitre ou sous-chapitre) envoyé par le client — pour router les événements UI */
      builderChapterKey: typeof chapterId === "string" ? chapterId : null,
    });
  } catch (error) {
    console.error("[ai] Error in generate-flashcards", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error && error.stack ? error.stack : undefined;

    // Enregistrer l'erreur
    const supabase = await getServerClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        await logAIInteraction({
          userId: authData.user.id,
          featureId: "generate-flashcards",
          featureName: "Génération de flashcards",
          promptUsed: "",
          promptVariables: { chapterContent: chapterContent || "", chapterTitle: chapterTitle || "" },
          success: false,
          errorMessage: errorMessage,
        }).catch((logError) => {
          console.error("[ai] Error logging AI interaction:", logError);
        });
      }
    }

    return NextResponse.json({ 
      error: "Une erreur est survenue lors de la génération des flashcards",
      details: errorMessage
    }, { status: 500 });
  }
}

