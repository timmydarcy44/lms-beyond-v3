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

  const suggestedSubchapters = Array.isArray(raw?.suggestedSubchapters)
    ? raw.suggestedSubchapters
        .map((sub: any, index: number) => {
          const subTitle =
            typeof sub?.title === "string" && sub.title.trim().length > 0
              ? sub.title.trim()
              : `Sous-chapitre ${index + 1}`;
          const subSummary = normalizeTextValue(sub?.summary);
          const subDuration =
            typeof sub?.duration === "string"
              ? sub.duration
              : String(sub?.duration ?? "");
          const subType =
            typeof sub?.type === "string" && allowedSubchapterTypes.has(sub.type)
              ? sub.type
              : "text";

          return {
            title: subTitle,
            summary: subSummary,
            duration: subDuration,
            type: subType,
          };
        })
        .filter((sub: any) => sub && sub.title)
    : [];

  return {
    title:
      typeof raw?.title === "string" && raw.title.trim().length > 0
        ? raw.title.trim()
        : "Chapitre",
    summary,
    content,
    duration,
    type,
    suggestedSubchapters,
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

    // Générer le chapitre
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
          suggestedSubchapters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                duration: { type: "string" },
                type: { type: "string", enum: ["video", "text", "document", "audio"] },
                summary: { type: "string" },
              },
              required: ["title", "duration", "type", "summary"],
            },
          },
        },
        required: ["title", "summary", "content", "duration", "type", "suggestedSubchapters"],
      },
    };

    const result = await generateJSON(fullPrompt, schema);

    if (!result) {
      return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
    }

    const chapter = normalizeChapterResult(result);

    return NextResponse.json({ success: true, chapter });
  } catch (error) {
    console.error("[ai] Error in generate-chapter", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

