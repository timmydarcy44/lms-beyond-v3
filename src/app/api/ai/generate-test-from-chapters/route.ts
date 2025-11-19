import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { generateJSON } from "@/lib/ai/openai-client";
import { nanoid } from "nanoid";

type GenerateTestRequest = {
  courseId: string;
  chapterIds: string[]; // IDs des chapitres (peuvent être des nanoids locaux ou des UUIDs)
  numberOfQuestions?: number;
  difficulty?: "easy" | "medium" | "hard";
  questionTypes?: ("multiple" | "single" | "text")[];
};

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

    const body: GenerateTestRequest = await request.json();
    const { courseId, chapterIds, numberOfQuestions = 10, difficulty = "medium", questionTypes = ["multiple", "single"] } = body;

    if (!courseId || !chapterIds || chapterIds.length === 0) {
      return NextResponse.json({ 
        error: "courseId et chapterIds sont requis" 
      }, { status: 400 });
    }

    // Récupérer la formation avec son builder_snapshot
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, builder_snapshot")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ 
        error: "Formation introuvable",
        details: courseError?.message 
      }, { status: 404 });
    }

    // Extraire le contenu des chapitres sélectionnés depuis builder_snapshot
    const builderSnapshot = course.builder_snapshot;
    if (!builderSnapshot || typeof builderSnapshot !== "object") {
      return NextResponse.json({ 
        error: "Structure de formation invalide" 
      }, { status: 400 });
    }

    const chaptersContent: string[] = [];
    
    // Parcourir les sections et chapitres pour trouver ceux sélectionnés
    const sections = (builderSnapshot as any).sections || [];
    for (const section of sections) {
      const chapters = section.chapters || [];
      for (const chapter of chapters) {
        // Vérifier si ce chapitre est dans la liste des IDs sélectionnés
        if (chapterIds.includes(chapter.id)) {
          // Extraire le contenu du chapitre
          let chapterText = `# ${chapter.title || "Chapitre sans titre"}\n\n`;
          
          if (chapter.description) {
            chapterText += `${chapter.description}\n\n`;
          }

          // Extraire le contenu des sous-chapitres
          const subchapters = chapter.subchapters || [];
          for (const subchapter of subchapters) {
            if (subchapter.title) {
              chapterText += `## ${subchapter.title}\n\n`;
            }
            if (subchapter.content) {
              chapterText += `${subchapter.content}\n\n`;
            }
          }

          // Si le chapitre a un contenu direct
          if (chapter.content) {
            chapterText += `${chapter.content}\n\n`;
          }

          chaptersContent.push(chapterText);
        }
      }
    }

    if (chaptersContent.length === 0) {
      return NextResponse.json({ 
        error: "Aucun contenu trouvé pour les chapitres sélectionnés" 
      }, { status: 400 });
    }

    // Concaténer tout le contenu
    const fullContent = chaptersContent.join("\n\n---\n\n");

    if (!fullContent || fullContent.trim().length === 0) {
      console.error("[generate-test-from-chapters] Aucun contenu trouvé pour les chapitres sélectionnés");
      return NextResponse.json({ 
        error: "Aucun contenu trouvé",
        details: "Les chapitres sélectionnés ne contiennent pas de contenu textuel."
      }, { status: 400 });
    }

    // Générer les questions avec l'IA
    const systemPrompt = `Tu es un expert en pédagogie et en création de tests d'évaluation. 
Génère un ensemble de questions de test basées sur le contenu fourni.
Les questions doivent être pertinentes, claires et évaluer la compréhension du contenu.
Génère ${numberOfQuestions} questions de difficulté ${difficulty}.
Utilise les types de questions suivants : ${questionTypes.join(", ")}.`;

    const userPrompt = `Génère ${numberOfQuestions} questions d'évaluation basées sur le contenu suivant :

${fullContent}

Instructions :
- Crée des questions variées qui testent la compréhension du contenu
- Pour les questions à choix multiples (multiple/single), propose 4 options dont une seule correcte
- Pour les questions texte, assure-toi qu'elles nécessitent une réponse détaillée
- Adapte la difficulté à : ${difficulty}
- Les questions doivent être claires et sans ambiguïté`;

    const schema = {
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Le texte de la question" },
                type: { 
                  type: "string", 
                  enum: questionTypes,
                  description: "Le type de question" 
                },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "Le texte de l'option" },
                      label: { type: "string", description: "Le texte affiché (identique à value si non spécifié)" },
                      correct: { type: "boolean", description: "Si cette option est la bonne réponse" },
                    },
                    required: ["value", "correct"],
                  },
                  description: "Les options pour les questions à choix multiples (requis si type est 'multiple' ou 'single')",
                },
                helper: { 
                  type: "string", 
                  description: "Un texte d'aide ou de contexte optionnel pour la question" 
                },
                score: { 
                  type: "number", 
                  description: "Le nombre de points attribués à cette question (défaut: 1)" 
                },
              },
              required: ["title", "type"],
            },
          },
        },
        required: ["questions"],
      },
    };

    console.log("[generate-test-from-chapters] Appel à l'IA avec:", {
      courseId,
      chapterIds,
      numberOfQuestions,
      difficulty,
      questionTypes,
      contentLength: fullContent.length,
    });

    const result = await generateJSON(userPrompt, schema, systemPrompt);

    console.log("[generate-test-from-chapters] Résultat de l'IA:", {
      hasResult: !!result,
      resultKeys: result ? Object.keys(result) : [],
      hasQuestions: result?.questions ? true : false,
      questionsCount: result?.questions?.length || 0,
    });

    if (!result) {
      console.error("[generate-test-from-chapters] Aucun résultat de l'IA");
      return NextResponse.json({ 
        error: "Impossible de générer les questions",
        details: "L'IA n'a pas retourné de résultat. Vérifiez que OPENAI_API_KEY est configurée."
      }, { status: 500 });
    }

    // L'IA peut retourner directement un tableau ou un objet avec une propriété questions
    let questionsArray = result.questions || (Array.isArray(result) ? result : null);

    if (!questionsArray || !Array.isArray(questionsArray) || questionsArray.length === 0) {
      console.error("[generate-test-from-chapters] Format de réponse invalide:", result);
      return NextResponse.json({ 
        error: "Impossible de générer les questions",
        details: "La réponse de l'IA n'est pas au format attendu. Format reçu: " + JSON.stringify(result).substring(0, 200)
      }, { status: 500 });
    }

    // Formater les questions pour le format TestBuilderQuestion
    const formattedQuestions = questionsArray.map((q: any, index: number) => {
      const question: any = {
        id: nanoid(),
        title: q.title || `Question ${index + 1}`,
        type: q.type || "multiple",
        score: q.score || 1,
        status: "draft" as const,
        aiGenerated: true,
      };

      if (q.helper) {
        question.helper = q.helper;
      }

      if ((q.type === "multiple" || q.type === "single") && q.options && Array.isArray(q.options)) {
        question.options = q.options.map((opt: any) => ({
          id: nanoid(),
          value: opt.value || opt.label || `Option`,
          correct: opt.correct === true,
          points: opt.correct ? (q.score || 1) : 0,
        }));
      }

      return question;
    });

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      sourceChapters: chapterIds,
      courseTitle: course.title,
    });

  } catch (error) {
    console.error("[ai/generate-test-from-chapters] Erreur inattendue:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[ai/generate-test-from-chapters] Stack trace:", errorStack);
    return NextResponse.json({
      error: "Erreur lors de la génération",
      details: errorMessage
    }, { status: 500 });
  }
}

