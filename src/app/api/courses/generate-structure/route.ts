import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/openai-client";
import { importFormationStructure, orderImportedSubchapters, parseFormationImportText } from "@/lib/course-builder/import-structure";
import { getServerClient } from "@/lib/supabase/server";
import { CourseBuilderSection } from "@/types/course-builder";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      console.error("[api/courses/generate-structure] Supabase client unavailable");
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier les cookies de la requête pour le debugging
    const cookies = request.headers.get("cookie");
    console.log("[api/courses/generate-structure] Request cookies present:", !!cookies);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("[api/courses/generate-structure] Auth error:", {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      });
      return NextResponse.json({ 
        error: "Erreur d'authentification",
        details: authError.message 
      }, { status: 401 });
    }
    
    if (!user) {
      console.warn("[api/courses/generate-structure] No user found in session", {
        hasCookies: !!cookies,
        cookieLength: cookies?.length || 0,
      });
      return NextResponse.json({ 
        error: "Non authentifié",
        details: "Aucun utilisateur trouvé dans la session. Veuillez vous reconnecter."
      }, { status: 401 });
    }
    
    console.log("[api/courses/generate-structure] Authenticated user:", user.id, user.email);

    const body = await request.json();
    const { title, content, method } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
    }

    const importedJson = typeof content === "string" ? parseFormationImportText(content) : null;
    if (importedJson) {
      return NextResponse.json({ sections: importedJson.sections, warnings: importedJson.warnings });
    }

    // Prompt pour générer la structure depuis le texte collé
    const prompt = `Analyse ce contenu de formation et génère une structure complète au format JSON.

Titre de la formation: ${title}

Contenu:
${content}

Génère une structure de formation avec des sections, chapitres et sous-chapitres. Chaque élément doit avoir:
- id: un identifiant unique (format: section-1, chapter-1-1, subchapter-1-1-1)
- title: le titre
- description (optionnel pour sections)
- duration: une durée estimée (ex: "15 min")
- type: "text" | "video" | "audio" | "document" | "atelier"
Un sous-chapitre atelier a : instructions (obligatoire), scenario, example, fields (1 à 6 objets label + type "short" ou "long"), criteria (2 à 6 textes), max_improvements (0 à 6).
- content (optionnel): un résumé du contenu

Format JSON attendu:
{
  "sections": [
    {
      "id": "section-1",
      "title": "Titre de la section",
      "description": "Description optionnelle",
      "chapters": [
        {
          "id": "chapter-1-1",
          "title": "Titre du chapitre",
          "duration": "20 min",
          "type": "text",
          "summary": "Résumé du chapitre",
          "subchapters": [
            {
              "id": "subchapter-1-1-1",
              "title": "Titre du sous-chapitre",
              "duration": "10 min",
              "type": "text",
              "summary": "Résumé"
            }
          ]
        }
      ]
    }
  ]
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

    const result = await generateJSON(prompt);

    if (!result || !result.sections) {
      return NextResponse.json(
        { error: "Impossible de générer la structure" },
        { status: 500 }
      );
    }

    const warnings: { message: string }[] = [];
    const sections: CourseBuilderSection[] = result.sections.map((section: any, sectionIndex: number) => ({
      id: section.id || `section-${sectionIndex + 1}`,
      title: section.title || "Section sans titre",
      description: section.description || "",
      chapters: (section.chapters || []).map((chapter: any, chapterIndex: number) => {
        const ordered = orderImportedSubchapters(
          chapter.subchapters || chapter.subChapters || [],
          chapter.title || "Chapitre sans titre",
          (subchapter: any, subIndex: number) => ({
            id: subchapter?.id || `subchapter-${sectionIndex + 1}-${chapterIndex + 1}-${subIndex + 1}`,
            title: (typeof subchapter === "string" ? subchapter : subchapter?.title) || "Sous-chapitre sans titre",
            duration: (typeof subchapter === "string" ? "" : subchapter?.duration) || "10 min",
            type: (subchapter?.type || "text") as "video" | "audio" | "document" | "text",
            summary: subchapter?.summary || "",
            content: subchapter?.content || "",
          }),
        );
        warnings.push(...ordered.warnings);
        return {
          id: chapter.id || `chapter-${sectionIndex + 1}-${chapterIndex + 1}`,
          title: chapter.title || "Chapitre sans titre",
          duration: chapter.duration || "15 min",
          type: (chapter.type || "text") as "video" | "audio" | "document" | "text",
          summary: chapter.summary || "",
          content: chapter.content || "",
          subchapters: ordered.subchapters,
        };
      }),
    }));

    return NextResponse.json({ sections, warnings });
  } catch (error) {
    console.error("[api/courses/generate-structure] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la structure" },
      { status: 500 }
    );
  }
}





