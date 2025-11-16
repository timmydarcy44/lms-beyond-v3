import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";
import { CourseBuilderSection } from "@/types/course-builder";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file || !title) {
      return NextResponse.json({ error: "Fichier et titre requis" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Le fichier doit être un PDF" }, { status: 400 });
    }

    // Pour l'instant, on va utiliser une approche simplifiée :
    // Lire le PDF comme texte (les PDFs textuels fonctionneront)
    // Pour les PDFs avec images, il faudrait utiliser une bibliothèque comme pdf-parse
    // ou utiliser l'API de vision d'OpenAI avec des images converties
    
    // Convertir le fichier en texte (approximation pour PDFs textuels)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Essayer d'extraire du texte brut (fonctionne pour les PDFs textuels simples)
    // Pour une solution complète, il faudrait utiliser pdf-parse ou pdfjs-dist
    let pdfText = "";
    try {
      // Approche simple : chercher du texte dans le buffer
      // Note: Cette approche est limitée, idéalement utiliser pdf-parse
      pdfText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r]/g, "");
      
      // Si le texte est trop court, le PDF est probablement binaire
      if (pdfText.length < 100) {
        return NextResponse.json(
          { error: "Impossible d'extraire le texte du PDF. Veuillez utiliser un PDF avec du texte extractible ou la méthode copier/coller." },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Erreur lors de la lecture du PDF" },
        { status: 500 }
      );
    }

    // Utiliser OpenAI pour générer la structure depuis le texte extrait
    const prompt = `Analyse ce contenu extrait d'un PDF de formation et génère une structure complète au format JSON.

Titre de la formation: ${title}

Contenu extrait du PDF:
${pdfText.substring(0, 10000)} ${pdfText.length > 10000 ? "... (contenu tronqué)" : ""}

Génère une structure de formation avec des sections, chapitres et sous-chapitres. Chaque élément doit avoir:
- id: un identifiant unique (format: section-1, chapter-1-1, subchapter-1-1-1)
- title: le titre
- description (optionnel pour sections)
- duration: une durée estimée (ex: "15 min")
- type: "text" | "video" | "audio" | "document"
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
        { error: "Impossible de générer la structure depuis le PDF" },
        { status: 500 }
      );
    }

    // Valider et formater la structure
    const sections: CourseBuilderSection[] = result.sections.map((section: any, sectionIndex: number) => ({
      id: section.id || `section-${sectionIndex + 1}`,
      title: section.title || "Section sans titre",
      description: section.description || "",
      chapters: (section.chapters || []).map((chapter: any, chapterIndex: number) => ({
        id: chapter.id || `chapter-${sectionIndex + 1}-${chapterIndex + 1}`,
        title: chapter.title || "Chapitre sans titre",
        duration: chapter.duration || "15 min",
        type: (chapter.type || "text") as "video" | "audio" | "document" | "text",
        summary: chapter.summary || "",
        content: chapter.content || "",
        subchapters: (chapter.subchapters || []).map((subchapter: any, subIndex: number) => ({
          id: subchapter.id || `subchapter-${sectionIndex + 1}-${chapterIndex + 1}-${subIndex + 1}`,
          title: subchapter.title || "Sous-chapitre sans titre",
          duration: subchapter.duration || "10 min",
          type: (subchapter.type || "text") as "video" | "audio" | "document" | "text",
          summary: subchapter.summary || "",
          content: subchapter.content || "",
        })),
      })),
    }));

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("[api/courses/generate-structure-from-pdf] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement du PDF" },
      { status: 500 }
    );
  }
}

