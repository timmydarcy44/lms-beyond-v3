import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import type { TestCategoryResult } from "@/types/test-result";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      testId,
      testTitle,
      categoryResults,
      userId,
      attemptId,
    } = body as {
      testId: string;
      testTitle: string;
      categoryResults: TestCategoryResult[];
      userId: string;
      attemptId: string;
    };

    // Vérifier que l'utilisateur peut accéder à cette analyse (soit lui-même, soit Super Admin)
    if (user.id !== userId) {
      // Vérifier si c'est un Super Admin
      const serviceClient = getServiceRoleClient();
      const clientToUse = serviceClient || supabase;
      
      const { data: superAdmin } = await clientToUse
        .from("super_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!superAdmin) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }

    // Vérifier si une analyse existe déjà pour cette tentative
    const serviceClient = getServiceRoleClient();
    const clientToUse = serviceClient || supabase;
    
    const { data: existingAnalysis } = await clientToUse
      .from("test_result_analyses")
      .select("analysis")
      .eq("attempt_id", attemptId)
      .maybeSingle();

    if (existingAnalysis?.analysis) {
      // Retourner l'analyse existante
      return NextResponse.json({
        analysis: existingAnalysis.analysis,
        cached: true,
      });
    }

    // Construire le prompt pour l'analyse
    const categoriesText = categoryResults
      .map((cat) => `${cat.category}: ${cat.score}/${cat.maxScore} (${cat.percentage.toFixed(1)}%)`)
      .join("\n");

    const prompt = `En tant qu'expert en développement personnel et compétences professionnelles, analysez les résultats suivants d'un test de soft skills intitulé "${testTitle}".

Résultats par catégorie :
${categoriesText}

Fournissez une analyse détaillée et personnalisée qui :
1. Identifie les points forts de l'apprenant
2. Met en évidence les domaines à améliorer
3. Propose des recommandations concrètes et actionnables pour le développement
4. Offre un contenu à forte valeur ajoutée avec des conseils pratiques
5. Utilise un ton encourageant et bienveillant

Format de réponse : HTML avec des paragraphes bien structurés, des listes à puces pour les recommandations, et des sections clairement définies.`;

    // Utiliser Anthropic en priorité pour l'analyse des résultats
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    let analysis = "";
    
    if (anthropicApiKey) {
      // Utiliser Anthropic Claude (priorité)
      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2000,
          system: "Tu es un expert en développement personnel et compétences professionnelles. Tu fournis des analyses détaillées et bienveillantes des résultats de tests de soft skills.",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!claudeResponse.ok) {
        const error = await claudeResponse.json();
        throw new Error(`Anthropic API error: ${error.error?.message || "Unknown error"}`);
      }

      const claudeData = await claudeResponse.json();
      analysis = claudeData.content[0]?.text || "";
    } else if (openaiApiKey) {
      // Fallback sur OpenAI si Anthropic n'est pas disponible
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Tu es un expert en développement personnel et compétences professionnelles. Tu fournis des analyses détaillées et bienveillantes des résultats de tests de soft skills.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!openaiResponse.ok) {
        const error = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
      }

      const openaiData = await openaiResponse.json();
      analysis = openaiData.choices[0]?.message?.content || "";
    } else {
      return NextResponse.json(
        { error: "Aucune clé API OpenAI ou Anthropic configurée" },
        { status: 500 }
      );
    }

    if (!analysis) {
      return NextResponse.json(
        { error: "Aucune analyse générée" },
        { status: 500 }
      );
    }

    // Stocker l'analyse dans la base de données
    try {
      await clientToUse
        .from("test_result_analyses")
        .insert({
          attempt_id: attemptId,
          test_id: testId,
          user_id: userId,
          category_results: categoryResults,
          analysis: analysis,
          created_at: new Date().toISOString(),
        });
    } catch (dbError) {
      // Si la table n'existe pas encore, on continue quand même
      console.warn("[api/tests/analyze-results] Erreur lors du stockage de l'analyse:", dbError);
    }

    return NextResponse.json({
      analysis,
      cached: false,
    });
  } catch (error) {
    console.error("[api/tests/analyze-results] Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'analyse",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

