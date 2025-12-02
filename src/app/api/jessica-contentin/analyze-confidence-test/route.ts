import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scores, firstName } = body as {
      scores: {
        estime: number;
        auto_efficacite: number;
        assertivite: number;
        competences_sociales: number;
      };
      firstName?: string;
    };

    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json(
        { error: "OpenAI non configuré" },
        { status: 500 }
      );
    }

    // Construire le prompt pour l'analyse
    const scoresText = `
- Estime de soi : ${scores.estime}/24 (${((scores.estime / 24) * 100).toFixed(0)}%)
- Auto-efficacité : ${scores.auto_efficacite}/24 (${((scores.auto_efficacite / 24) * 100).toFixed(0)}%)
- Assertivité : ${scores.assertivite}/24 (${((scores.assertivite / 24) * 100).toFixed(0)}%)
- Compétences sociales & Adaptabilité : ${scores.competences_sociales}/24 (${((scores.competences_sociales / 24) * 100).toFixed(0)}%)
`;

    const prompt = `Tu es Jessica Contentin, psychopédagogue certifiée en neuroéducation, experte en TDAH/HPI et spécialisée dans la confiance en soi. 

Analyse les résultats suivants d'un test de confiance en soi (24 questions, 4 dimensions) :

${scoresText}

Fournis une analyse approfondie et personnalisée en JSON avec cette structure exacte :
{
  "global": "Analyse globale du profil (2-3 paragraphes). Ton empathique, professionnel, bienveillant. Commence par ${firstName ? `"${firstName}, ` : ""}voici vos résultats" si un prénom est fourni, sinon "Voici vos résultats".",
  "dimensions": {
    "estime": {
      "score": ${scores.estime},
      "analyse": "Analyse détaillée de l'estime de soi (1-2 paragraphes). Ton doux, rassurant, orienté accompagnement.",
      "points_forts": ["Point fort 1", "Point fort 2"],
      "axes_amelioration": ["Axe d'amélioration 1", "Axe d'amélioration 2"]
    },
    "auto_efficacite": {
      "score": ${scores.auto_efficacite},
      "analyse": "Analyse détaillée de l'auto-efficacité (1-2 paragraphes).",
      "points_forts": ["Point fort 1", "Point fort 2"],
      "axes_amelioration": ["Axe d'amélioration 1", "Axe d'amélioration 2"]
    },
    "assertivite": {
      "score": ${scores.assertivite},
      "analyse": "Analyse détaillée de l'assertivité (1-2 paragraphes).",
      "points_forts": ["Point fort 1", "Point fort 2"],
      "axes_amelioration": ["Axe d'amélioration 1", "Axe d'amélioration 2"]
    },
    "competences_sociales": {
      "score": ${scores.competences_sociales},
      "analyse": "Analyse détaillée des compétences sociales (1-2 paragraphes).",
      "points_forts": ["Point fort 1", "Point fort 2"],
      "axes_amelioration": ["Axe d'amélioration 1", "Axe d'amélioration 2"]
    }
  },
  "recommandations": {
    "prioritaires": ["Recommandation prioritaire 1", "Recommandation prioritaire 2", "Recommandation prioritaire 3"],
    "complementaires": ["Recommandation complémentaire 1", "Recommandation complémentaire 2"]
  }
}

IMPORTANT :
- Ton professionnel, empathique, chaleureux, rassurant
- Pas médical, pas culpabilisant
- Orienté vers le progrès, la clarté, la compréhension de soi
- Authentique, humain
- Adapte le ton selon les scores (encourageant pour les scores bas, valorisant pour les scores élevés)
- Les recommandations doivent être concrètes et actionnables`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Tu es Jessica Contentin, psychopédagogue certifiée en neuroéducation, experte en TDAH/HPI et spécialisée dans la confiance en soi. Tu fournis des analyses bienveillantes et professionnelles.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 3000,
    });

    const analysis = response.choices[0]?.message?.content;
    if (!analysis) {
      return NextResponse.json(
        { error: "Aucune analyse générée" },
        { status: 500 }
      );
    }

    try {
      const parsedAnalysis = JSON.parse(analysis);
      return NextResponse.json({ analysis: parsedAnalysis });
    } catch (parseError) {
      console.error("[analyze-confidence-test] Error parsing JSON:", parseError);
      return NextResponse.json(
        { error: "Erreur lors du parsing de l'analyse" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[analyze-confidence-test] Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'analyse",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

