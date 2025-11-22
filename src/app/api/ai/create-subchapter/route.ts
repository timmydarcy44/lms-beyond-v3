import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Route pour créer un sous-chapitre avec OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, chapterContext, chapterTitle } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return NextResponse.json({ error: "Le prompt doit contenir au moins 10 caractères" }, { status: 400 });
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

    // Construire le prompt pour un sous-chapitre
    const fullPrompt = `Tu es un expert en pédagogie et en création de contenu de formation. Ton objectif est de produire un sous-chapitre prêt à être diffusé, riche, structuré et immédiatement actionnable.

Crée un sous-chapitre pour le chapitre "${chapterTitle}".

Description du sous-chapitre : ${prompt}

${chapterContext ? `Contexte du chapitre parent : ${JSON.stringify(chapterContext)}` : ""}

Le sous-chapitre doit être :
- Cohérent avec le chapitre parent
- Complet et détaillé (minimum 400 mots, idéalement 500-600 mots)
- Pédagogiquement structuré avec une hiérarchie claire
- Adapté au format choisi (vidéo, texte, document, audio)
- Approfondi et enrichi avec des exemples concrets, des cas pratiques, et des conseils actionnables

IMPORTANT - Structure HTML requise pour le contenu :
- Utilise des balises HTML sémantiques : <h2> pour les titres de sections principales, <h3> pour les sous-sections, <h4> pour les sous-sous-sections
- Utilise <ol> avec <li> pour les listes numérotées (1, 2, 3...) quand il y a un ordre logique ou des étapes
- Utilise <ul> avec <li> pour les listes à puces quand l'ordre n'est pas important
- Utilise des sous-listes avec des lettres (a, b, c...) dans les <li> pour structurer davantage les points
- Utilise <p> pour les paragraphes de texte
- Utilise <strong> pour mettre en évidence les mots-clés importants
- Utilise <em> pour l'emphase
- Structure claire avec une hiérarchie : H2 > H3 > H4
- Utiliser des numéros dans les titres (1., 2., 3., etc.) pour les sections principales et des sous-numéros (1.1., 1.2., etc.) pour les sous-sections
- Dans les listes, utiliser des sous-numéros (1.1, 1.2) ou des lettres (a, b, c) pour structurer les sous-points
- Format HTML valide (pas de markdown, directement du HTML)
- Mise en page soignée avec une structure visuelle claire et aérée

Exemple de structure attendue :
<h2>1. Introduction</h2>
<p>Texte d'introduction...</p>

<h3>1.1. Objectifs de cette section</h3>
<ol>
  <li>Premier objectif
    <ol type="a">
      <li>Sous-point a</li>
      <li>Sous-point b</li>
    </ol>
  </li>
  <li>Deuxième objectif</li>
</ol>

<h2>2. Concepts clés</h2>
<p>Texte explicatif...</p>

<h3>2.1. Premier concept</h3>
<p>Explication...</p>
<ul>
  <li>Point important 1
    <ul>
      <li>Détail a</li>
      <li>Détail b</li>
    </ul>
  </li>
  <li>Point important 2</li>
</ul>`;

    // Schéma JSON pour le sous-chapitre
    const schema = {
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          content: { type: "string" },
          duration: { type: "string" },
          type: { type: "string", enum: ["video", "text", "document", "audio"] },
        },
        required: ["title", "summary", "content", "duration", "type"],
      },
    };

    // Utiliser OpenAI pour la création de sous-chapitres
    const systemPrompt = `Tu es un expert en pédagogie. Génère des sous-chapitres de qualité, cohérents avec le chapitre parent.
CRITIQUE : Le champ "content" DOIT être du HTML valide avec des balises (<h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>). 
NE PAS utiliser de markdown (pas de ##, -, *, etc.). UNIQUEMENT du HTML brut.
Schéma JSON attendu : ${JSON.stringify(schema.parameters)}`;

    const result = await generateJSON(fullPrompt, schema, systemPrompt);

    if (!result) {
      console.error("[ai] generateJSON returned null or undefined");
      return NextResponse.json({ 
        error: "Erreur lors de la génération. Vérifiez que OPENAI_API_KEY est configurée et valide." 
      }, { status: 500 });
    }

    // Valider que le résultat contient les champs requis
    if (!result.title || !result.content || !result.summary || !result.duration || !result.type) {
      console.error("[ai] Invalid result structure:", result);
      return NextResponse.json({ 
        error: "La réponse de l'IA est incomplète. Veuillez réessayer." 
      }, { status: 500 });
    }

    // Vérifier et corriger le format du contenu si nécessaire
    let content = result.content;
    if (typeof content === "string") {
      // Si le contenu ne contient pas de balises HTML, c'est probablement du texte brut ou du markdown
      if (!content.includes('<') || !content.includes('>')) {
        console.warn("[ai] Content is not HTML, converting markdown/text to HTML format");
        // Convertir le texte brut/markdown en HTML
        const lines = content.split('\n');
        let htmlContent = '';
        let inList = false;
        let listType: 'ul' | 'ol' | null = null;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) {
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            continue;
          }

          // Détecter les titres markdown
          if (line.startsWith('#### ')) {
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            htmlContent += `<h4>${line.substring(5)}</h4>\n`;
          } else if (line.startsWith('### ')) {
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            htmlContent += `<h3>${line.substring(4)}</h3>\n`;
          } else if (line.startsWith('## ')) {
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            htmlContent += `<h2>${line.substring(3)}</h2>\n`;
          } else if (line.startsWith('# ')) {
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            htmlContent += `<h2>${line.substring(2)}</h2>\n`;
          } else if (/^\d+\.\s/.test(line)) {
            // Liste numérotée
            if (!inList || listType !== 'ol') {
              if (inList) {
                htmlContent += `</${listType}>\n`;
              }
              htmlContent += '<ol>\n';
              inList = true;
              listType = 'ol';
            }
            htmlContent += `<li>${line.replace(/^\d+\.\s/, '')}</li>\n`;
          } else if (/^[-*+]\s/.test(line)) {
            // Liste à puces
            if (!inList || listType !== 'ul') {
              if (inList) {
                htmlContent += `</${listType}>\n`;
              }
              htmlContent += '<ul>\n';
              inList = true;
              listType = 'ul';
            }
            htmlContent += `<li>${line.replace(/^[-*+]\s/, '')}</li>\n`;
          } else {
            // Paragraphe normal
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
              listType = null;
            }
            htmlContent += `<p>${line}</p>\n`;
          }
        }

        if (inList) {
          htmlContent += `</${listType}>\n`;
        }

        content = htmlContent.trim();
      }
    }

    return NextResponse.json({ success: true, subchapter: { ...result, content } });
  } catch (error) {
    console.error("[ai] Error in create-subchapter", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}





