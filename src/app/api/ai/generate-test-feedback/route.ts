import { NextRequest, NextResponse } from "next/server";
import { generateTextWithAnthropic } from "@/lib/ai/anthropic-client";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testTitle, minScore, maxScore, title, testResults, categoryResults } = body;

    // Vérifier l'authentification
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Construire le prompt pour Anthropic
    const systemPrompt = `Tu es un expert en pédagogie et en évaluation. Tu génères des messages de feedback personnalisés, encourageants et constructifs pour les apprenants après un test.`;

    const userPrompt = `Génère un message de feedback personnalisé pour un test intitulé "${testTitle}".

Score obtenu : ${minScore}% - ${maxScore}%
Niveau : ${title}

${testResults ? `Résultats détaillés : ${JSON.stringify(testResults)}` : ""}
${categoryResults ? `Résultats par catégorie : ${JSON.stringify(categoryResults)}` : ""}

Le message doit être :
- Encourageant et positif
- Constructif avec des suggestions d'amélioration
- Adapté au niveau de performance
- En français
- Entre 50 et 150 mots`;

    // Générer le feedback avec Anthropic
    const message = await generateTextWithAnthropic(userPrompt, systemPrompt);

    if (!message) {
      // Fallback si l'IA ne répond pas
      const fallbackMessage = `Bravo ! Vous avez obtenu un score entre ${minScore}% et ${maxScore}%. ${title === "Excellent" ? "Continuez dans cette direction !" : title === "Bien" ? "Vous êtes sur la bonne voie, quelques ajustements et vous y serez !" : "Pas de panique, c'est en forgeant qu'on devient forgeron. Revenez sur les points essentiels et reprenez les exercices."}`;
      
      return NextResponse.json({
        message: fallbackMessage,
        title: title || "Feedback personnalisé",
      });
    }

    return NextResponse.json({
      message: message.trim(),
      title: title || "Feedback personnalisé",
    });
  } catch (error) {
    console.error("[api/ai/generate-test-feedback] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

