import { NextRequest, NextResponse } from "next/server";

import { generateJSON } from "@/lib/ai/openai-client";
import { buildChapterGenerationPrompt } from "@/lib/ai/prompts/chapter-generation";
import { getServerClient } from "@/lib/supabase/server";

const formatHeading = (key: string) =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/g, (char) => char.toUpperCase())
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeTextValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    // Si c'est déjà du HTML (contient des balises), le retourner tel quel
    if (value.includes('<') && value.includes('>')) {
      return value;
    }
    // Sinon, c'est du texte brut, le retourner tel quel aussi
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTextValue(item))
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => {
        const normalized = normalizeTextValue(val);
        if (!normalized) return "";
        const heading = key ? `### ${formatHeading(key)}` : "";
        return heading ? `${heading}\n${normalized}` : normalized;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return String(value);
};

const allowedChapterTypes = new Set(["video", "text", "document"]);
const allowedSubchapterTypes = new Set(["video", "text", "document", "audio"]);

const normalizeChapterResult = (raw: any) => {
  const type =
    typeof raw?.type === "string" && allowedChapterTypes.has(raw.type)
      ? raw.type
      : "text";

  const summary = normalizeTextValue(raw?.summary);
  const content = normalizeTextValue(raw?.content);
  const duration =
    typeof raw?.duration === "string" ? raw.duration : String(raw?.duration ?? "");

  return {
    title:
      typeof raw?.title === "string" && raw.title.trim().length > 0
        ? raw.title.trim()
        : "Chapitre",
    summary,
    content,
    duration,
    type,
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, courseContext } = body;

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

    // Construire le prompt
    const fullPrompt = buildChapterGenerationPrompt(prompt, courseContext);

    // Générer le chapitre (sans suggestedSubchapters - on ne veut que le contenu)
    // Note: Le schéma est passé dans le prompt system, la fonction generateJSON utilisera json_object
    const schema = {
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          content: { type: "string" },
          duration: { type: "string" },
          type: { type: "string", enum: ["video", "text", "document"] },
        },
        required: ["title", "summary", "content", "duration", "type"],
      },
    };

    const result = await generateJSON(fullPrompt, schema);

    if (!result) {
      return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
    }

    // Vérifier et corriger le format du contenu si nécessaire
    let content = result.content;
    if (typeof content === "string") {
      // Si le contenu ne contient pas de balises HTML, c'est probablement du texte brut ou du markdown
      if (!content.includes('<') || !content.includes('>')) {
        console.warn("[ai] Content is not HTML, converting to HTML format");
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

    const chapter = normalizeChapterResult({ ...result, content });

    return NextResponse.json({ success: true, chapter });
  } catch (error) {
    console.error("[ai] Error in generate-chapter", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

