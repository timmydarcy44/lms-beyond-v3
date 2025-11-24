import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

type MirrorQuestionRequest = {
  question: string;
  category?: string;
  type: "single" | "multiple" | "likert" | "scale";
  options?: Array<{ value: string; points?: number }>;
  context?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: MirrorQuestionRequest = await request.json();
    const { question, category, type, options, context } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: "Question requise" },
        { status: 400 }
      );
    }

    // Vérifier si OpenAI ou Anthropic est configuré
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
      // Fallback : génération basique
      return NextResponse.json({
        mirror_question: generateBasicMirror(question),
        is_positive: false,
        confidence: 0.6,
        explanation: "Génération basique (IA non configurée)",
      });
    }

    // Utiliser OpenAI si disponible, sinon Anthropic
    const aiProvider = openaiKey ? "openai" : "anthropic";
    const apiKey = openaiKey || anthropicKey;

    // Construire le prompt
    const systemPrompt = `Tu es un expert en psychologie et en création de tests de soft skills. 
Ta tâche est de générer une question miroir pour détecter les biais cognitifs (notamment le biais de désirabilité sociale).

Une question miroir doit :
1. Mesurer le même trait de personnalité/compétence que la question originale
2. Être formulée de manière inverse ou complémentaire
3. Permettre de détecter les incohérences dans les réponses
4. Être naturelle et compréhensible

Réponds UNIQUEMENT avec un JSON valide au format suivant :
{
  "mirror_question": "La question miroir générée",
  "is_positive": true ou false,
  "explanation": "Brève explication de pourquoi cette question est un bon miroir"
}`;

    const userPrompt = `Question originale : "${question}"
${category ? `Catégorie : ${category}` : ""}
Type : ${type}
${context ? `Contexte : ${context}` : ""}

Génère une question miroir pertinente.`;

    let mirrorResponse: any;

    if (aiProvider === "openai") {
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error("Erreur OpenAI");
      }

      const data = await openaiResponse.json();
      mirrorResponse = JSON.parse(data.choices[0].message.content);
    } else {
      // Anthropic
      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      });

      if (!anthropicResponse.ok) {
        throw new Error("Erreur Anthropic");
      }

      const data = await anthropicResponse.json();
      const content = data.content[0].text;
      mirrorResponse = JSON.parse(content);
    }

    // Inverser les options si c'est un Likert
    let mirrorOptions: Array<{ value: string; points?: number }> | undefined;
    if (type === "likert" && options && options.length > 0) {
      mirrorOptions = [...options].reverse();
    }

    return NextResponse.json({
      mirror_question: mirrorResponse.mirror_question,
      options: mirrorOptions,
      is_positive: mirrorResponse.is_positive ?? false,
      confidence: 0.9,
      explanation: mirrorResponse.explanation,
    });
  } catch (error) {
    console.error("[api/ai/generate-mirror-question] Error:", error);
    
    // Fallback : génération basique
    const body: MirrorQuestionRequest = await request.json();
    return NextResponse.json({
      mirror_question: generateBasicMirror(body.question),
      is_positive: false,
      confidence: 0.6,
      explanation: "Génération basique (erreur IA)",
    });
  }
}

function generateBasicMirror(question: string): string {
  const inversions: Record<string, string> = {
    "à l'aise": "mal à l'aise",
    "facilement": "difficilement",
    "souvent": "rarement",
    "toujours": "jamais",
    "bien": "mal",
    "facile": "difficile",
    "préfère": "évite",
    "aime": "n'aime pas",
  };

  let mirrorQuestion = question;
  for (const [positive, negative] of Object.entries(inversions)) {
    if (mirrorQuestion.toLowerCase().includes(positive)) {
      mirrorQuestion = mirrorQuestion.replace(
        new RegExp(positive, "gi"),
        negative
      );
      break;
    }
  }

  if (mirrorQuestion === question) {
    if (question.startsWith("Je ")) {
      mirrorQuestion = question.replace(/^Je /, "Je ne ");
    }
  }

  return mirrorQuestion;
}









