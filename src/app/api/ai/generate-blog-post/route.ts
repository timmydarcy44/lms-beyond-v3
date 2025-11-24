import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Le prompt est requis" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key non configurée" },
        { status: 500 }
      );
    }

    // Générer le contenu avec OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en rédaction d'articles de blog pour Jessica Contentin, spécialisée en psychologie de l'enfant et en parentalité. 
Tu rédiges des articles clairs, bien structurés, avec des conseils pratiques. 
Tu utilises le format HTML avec des balises comme <h1>, <h2>, <h3>, <p>, <strong>, <em>, etc.
Tu dois retourner un JSON avec les clés suivantes:
- title: le titre de l'article
- excerpt: un court résumé (2-3 phrases)
- content: le contenu HTML complet de l'article`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    // Essayer de parser le JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      // Si ce n'est pas du JSON, créer une structure par défaut
      result = {
        title: prompt.substring(0, 60) + "...",
        excerpt: "Article généré par l'IA",
        content: `<h1>${prompt}</h1><p>${responseText}</p>`,
      };
    }

    return NextResponse.json({
      title: result.title || prompt.substring(0, 60),
      excerpt: result.excerpt || "",
      content: result.content || `<p>${responseText}</p>`,
    });
  } catch (error: any) {
    console.error("[api/ai/generate-blog-post] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}

