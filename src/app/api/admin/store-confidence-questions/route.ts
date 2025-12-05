import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

/**
 * API route pour stocker les questions du test de confiance en soi
 * POST /api/admin/store-confidence-questions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    // Chercher le test de confiance en soi
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("id")
      .or("slug.eq.test-confiance-en-soi,title.ilike.%confiance en soi%")
      .limit(1)
      .maybeSingle();

    if (testError) {
      console.error("[store-confidence-questions] Error finding test:", testError);
      return NextResponse.json(
        { error: "Erreur lors de la recherche du test", details: testError.message },
        { status: 500 }
      );
    }

    if (!test) {
      return NextResponse.json(
        { error: "Test de confiance en soi non trouvé" },
        { status: 404 }
      );
    }

    // Construire les questions
    const likertLabels = {
      "1": "Pas du tout d'accord",
      "2": "Plutôt pas d'accord",
      "3": "Plutôt d'accord",
      "4": "Tout à fait d'accord",
    };

    const likertConfig = {
      min: 1,
      max: 4,
      labels: likertLabels,
    };

    const questions = [
      // Estime de soi (6 questions)
      {
        id: "estime_1",
        title: "Je me sens capable de reconnaître mes qualités.",
        text: "Je me sens capable de reconnaître mes qualités.",
        type: "likert",
        category: "estime",
        dimension: "estime",
        dimensionLabel: "Estime de soi",
        reversed: false,
        imageIndex: 0,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "estime_2",
        title: "Globalement, je suis satisfait(e) de moi-même.",
        text: "Globalement, je suis satisfait(e) de moi-même.",
        type: "likert",
        category: "estime",
        dimension: "estime",
        dimensionLabel: "Estime de soi",
        reversed: false,
        imageIndex: 1,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "estime_3",
        title: "Je me sens digne d'être respecté(e) par les autres.",
        text: "Je me sens digne d'être respecté(e) par les autres.",
        type: "likert",
        category: "estime",
        dimension: "estime",
        dimensionLabel: "Estime de soi",
        reversed: false,
        imageIndex: 2,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "estime_4",
        title: "Il m'arrive de penser que je ne vaux pas grand-chose.",
        text: "Il m'arrive de penser que je ne vaux pas grand-chose.",
        type: "likert",
        category: "estime",
        dimension: "estime",
        dimensionLabel: "Estime de soi",
        reversed: true,
        imageIndex: 3,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "estime_5",
        title: "Je me sens légitime dans mes choix et dans ce que j'entreprends.",
        text: "Je me sens légitime dans mes choix et dans ce que j'entreprends.",
        type: "likert",
        category: "estime",
        dimension: "estime",
        dimensionLabel: "Estime de soi",
        reversed: false,
        imageIndex: 4,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "estime_6",
        title: "Je suis à l'aise pour parler de mes réussites sans culpabiliser.",
        text: "Je suis à l'aise pour parler de mes réussites sans culpabiliser.",
        type: "likert",
        category: "estime",
        dimension: "estime",
        dimensionLabel: "Estime de soi",
        reversed: false,
        imageIndex: 5,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      // Auto-efficacité (6 questions)
      {
        id: "auto_1",
        title: "Je me sens capable de trouver des solutions même en situation difficile.",
        text: "Je me sens capable de trouver des solutions même en situation difficile.",
        type: "likert",
        category: "auto_efficacite",
        dimension: "auto_efficacite",
        dimensionLabel: "Auto-efficacité",
        reversed: false,
        imageIndex: 0,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "auto_2",
        title: "Je peux gérer un imprévu avec calme et lucidité.",
        text: "Je peux gérer un imprévu avec calme et lucidité.",
        type: "likert",
        category: "auto_efficacite",
        dimension: "auto_efficacite",
        dimensionLabel: "Auto-efficacité",
        reversed: false,
        imageIndex: 1,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "auto_3",
        title: "Je crois en ma capacité à atteindre mes objectifs.",
        text: "Je crois en ma capacité à atteindre mes objectifs.",
        type: "likert",
        category: "auto_efficacite",
        dimension: "auto_efficacite",
        dimensionLabel: "Auto-efficacité",
        reversed: false,
        imageIndex: 2,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "auto_4",
        title: "Lorsque je rencontre un obstacle, je trouve généralement un moyen de m'en sortir.",
        text: "Lorsque je rencontre un obstacle, je trouve généralement un moyen de m'en sortir.",
        type: "likert",
        category: "auto_efficacite",
        dimension: "auto_efficacite",
        dimensionLabel: "Auto-efficacité",
        reversed: false,
        imageIndex: 3,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "auto_5",
        title: "Je peux rester concentré(e) même lorsque je suis sous pression.",
        text: "Je peux rester concentré(e) même lorsque je suis sous pression.",
        type: "likert",
        category: "auto_efficacite",
        dimension: "auto_efficacite",
        dimensionLabel: "Auto-efficacité",
        reversed: false,
        imageIndex: 4,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "auto_6",
        title: "Je me sens capable d'affronter des défis importants sans me décourager.",
        text: "Je me sens capable d'affronter des défis importants sans me décourager.",
        type: "likert",
        category: "auto_efficacite",
        dimension: "auto_efficacite",
        dimensionLabel: "Auto-efficacité",
        reversed: false,
        imageIndex: 5,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      // Assertivité (6 questions)
      {
        id: "assertivite_1",
        title: "Je me sens capable d'exprimer clairement mon opinion.",
        text: "Je me sens capable d'exprimer clairement mon opinion.",
        type: "likert",
        category: "assertivite",
        dimension: "assertivite",
        dimensionLabel: "Assertivité",
        reversed: false,
        imageIndex: 0,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "assertivite_2",
        title: "J'ose défendre mes idées face aux autres.",
        text: "J'ose défendre mes idées face aux autres.",
        type: "likert",
        category: "assertivite",
        dimension: "assertivite",
        dimensionLabel: "Assertivité",
        reversed: false,
        imageIndex: 1,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "assertivite_3",
        title: "Je peux dire non sans culpabiliser.",
        text: "Je peux dire non sans culpabiliser.",
        type: "likert",
        category: "assertivite",
        dimension: "assertivite",
        dimensionLabel: "Assertivité",
        reversed: false,
        imageIndex: 2,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "assertivite_4",
        title: "Je me sens légitime pour poser des limites.",
        text: "Je me sens légitime pour poser des limites.",
        type: "likert",
        category: "assertivite",
        dimension: "assertivite",
        dimensionLabel: "Assertivité",
        reversed: false,
        imageIndex: 3,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "assertivite_5",
        title: "Je peux accepter les critiques sans me sentir diminué(e).",
        text: "Je peux accepter les critiques sans me sentir diminué(e).",
        type: "likert",
        category: "assertivite",
        dimension: "assertivite",
        dimensionLabel: "Assertivité",
        reversed: false,
        imageIndex: 4,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "assertivite_6",
        title: "Je me permets de demander de l'aide lorsque j'en ai besoin.",
        text: "Je me permets de demander de l'aide lorsque j'en ai besoin.",
        type: "likert",
        category: "assertivite",
        dimension: "assertivite",
        dimensionLabel: "Assertivité",
        reversed: false,
        imageIndex: 5,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      // Compétences sociales (6 questions)
      {
        id: "social_1",
        title: "Je me sens à l'aise dans des situations sociales nouvelles.",
        text: "Je me sens à l'aise dans des situations sociales nouvelles.",
        type: "likert",
        category: "competences_sociales",
        dimension: "competences_sociales",
        dimensionLabel: "Compétences sociales & Adaptabilité",
        reversed: false,
        imageIndex: 0,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "social_2",
        title: "J'ose prendre des initiatives même si je risque de me tromper.",
        text: "J'ose prendre des initiatives même si je risque de me tromper.",
        type: "likert",
        category: "competences_sociales",
        dimension: "competences_sociales",
        dimensionLabel: "Compétences sociales & Adaptabilité",
        reversed: false,
        imageIndex: 1,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "social_3",
        title: "Je peux prendre des décisions rapidement lorsque c'est nécessaire.",
        text: "Je peux prendre des décisions rapidement lorsque c'est nécessaire.",
        type: "likert",
        category: "competences_sociales",
        dimension: "competences_sociales",
        dimensionLabel: "Compétences sociales & Adaptabilité",
        reversed: false,
        imageIndex: 2,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "social_4",
        title: "Je me sens capable de parler devant un groupe.",
        text: "Je me sens capable de parler devant un groupe.",
        type: "likert",
        category: "competences_sociales",
        dimension: "competences_sociales",
        dimensionLabel: "Compétences sociales & Adaptabilité",
        reversed: false,
        imageIndex: 3,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "social_5",
        title: "J'essaie volontiers de nouvelles expériences.",
        text: "J'essaie volontiers de nouvelles expériences.",
        type: "likert",
        category: "competences_sociales",
        dimension: "competences_sociales",
        dimensionLabel: "Compétences sociales & Adaptabilité",
        reversed: false,
        imageIndex: 4,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
      {
        id: "social_6",
        title: "Je m'adapte facilement à des environnements ou des personnes inconnues.",
        text: "Je m'adapte facilement à des environnements ou des personnes inconnues.",
        type: "likert",
        category: "competences_sociales",
        dimension: "competences_sociales",
        dimensionLabel: "Compétences sociales & Adaptabilité",
        reversed: false,
        imageIndex: 5,
        score: 1,
        status: "ready",
        likert: likertConfig,
      },
    ];

    // Mettre à jour le test avec les questions
    const { error: updateError } = await supabase
      .from("tests")
      .update({
        questions: questions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", test.id);

    if (updateError) {
      console.error("[store-confidence-questions] Error updating test:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Questions stockées avec succès",
      testId: test.id,
      questionCount: questions.length,
    });
  } catch (error) {
    console.error("[store-confidence-questions] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

