import { NextRequest, NextResponse } from "next/server";

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { hasUserFeature } from "@/lib/queries/organization-features";
import { isUserSuperAdmin } from "@/lib/auth/super-admin";
import { generateJSON } from "@/lib/ai/openai-client";
import { logAIUsageEvent } from "@/lib/ai/usage-logger";

type AnswerPayload = {
  questionId: string;
  value: number | string;
};

type DimensionAggregate = {
  sum: number;
  count: number;
};

const DIMENSION_LABELS: Record<string, string> = {
  style_cognitif_organisationnel: "Organisation cognitive",
  mode_emotionnel_naturel: "Mode émotionnel naturel",
  besoin_social_naturel: "Besoin social naturel",
  coping_naturel: "Coping naturel",
  energie_rythme_interne: "Énergie & rythme interne",
  gestion_emotions_stress: "Gestion des émotions & du stress",
  communication_influence: "Communication & influence",
  perseverance_action: "Persévérance & passage à l’action",
  organisation_priorites: "Organisation, temps & priorités",
  empathie_ecoute_active: "Empathie & écoute active",
  resolution_problemes: "Résolution de problèmes & pensée critique",
  collaboration_conflits: "Collaboration & gestion des conflits",
  creativite_adaptabilite: "Créativité & adaptabilité",
  leadership_vision: "Leadership & vision",
  confiance_decision: "Confiance en soi & prise de décision",
};

const DIMENSION_MESSAGES: Record<
  string,
  {
    high: string;
    medium: string;
    low: string;
  }
> = {
  style_cognitif_organisationnel: {
    high: "Vous aimez planifier, cadrer et anticiper. Cette structure vous aide à rester efficace.",
    medium: "Vous avez besoin d’un cadre clair tout en restant capable d’improviser selon la situation.",
    low: "La planification serrée peut devenir lourde : vous gagnez à clarifier vos priorités au fil de l’eau.",
  },
  mode_emotionnel_naturel: {
    high: "Votre sensibilité émotionnelle est une force : elle vous permet de décoder fines nuances et ambiance.",
    medium: "Vous prenez en compte vos ressentis tout en gardant une certaine distance émotionnelle.",
    low: "Votre mode émotionnel reste plutôt calme : pensez à verbaliser ce que vous ressentez pour rester aligné·e.",
  },
  besoin_social_naturel: {
    high: "La connexion humaine est un vrai carburant : prévoyez des temps d’échanges nourrissants dans votre agenda.",
    medium: "Vous alternez aisément entre moments sociaux et temps seul·e, selon vos besoins du moment.",
    low: "Vous préservez votre bulle pour recharger : posez vos limites pour protéger ces temps essentiels.",
  },
  coping_naturel: {
    high: "Vous puisez naturellement du soutien autour de vous et posez vos besoins avec clarté : gardez ce réflexe.",
    medium: "Vous gérez beaucoup par vous-même tout en sachant demander de l’aide quand c’est nécessaire.",
    low: "Vous avez tendance à encaisser seul·e : identifiez une personne-ressource ou un rituel d’expression pour relâcher la pression.",
  },
  energie_rythme_interne: {
    high: "Votre énergie est stable et soutenante : n’oubliez pas d’inclure des micro-pauses pour maintenir ce niveau.",
    medium: "Votre énergie varie : apprenez à reconnaître vos pics pour caler les activités qui comptent.",
    low: "Votre rythme demande des respirations fréquentes : pensez à planifier des temps courts de récupération.",
  },
  gestion_emotions_stress: {
    high: "Tu sais réguler ton stress et garder de la clarté émotionnelle, même en situation tendue.",
    medium: "Tu gères tes émotions avec des hauts et des bas : pense à consolider tes routines de récupération.",
    low: "Le stress peut vite monter : installe des respirations rapides (pause, mouvement, appuis physiques) pour t’apaiser.",
  },
  communication_influence: {
    high: "Tu fais passer tes messages avec impact et tu ajustes ton discours selon ton interlocuteur.",
    medium: "Tu communiques de façon claire dans les contextes connus, mais le collectif peut parfois te challenger.",
    low: "Ton message peut perdre en clarté : simplifie, structure et vérifie la compréhension de ton auditoire.",
  },
  perseverance_action: {
    high: "Tu gardes le cap et tu transformes facilement tes idées en actions concrètes.",
    medium: "Tu restes engagé·e quand cela fait sens, mais un coup de pouce extérieur peut être nécessaire sur la durée.",
    low: "L’élan retombe vite : fractionne les objectifs et sécurise un plan d’action très court terme pour te relancer.",
  },
  organisation_priorites: {
    high: "Tu structures efficacement ton temps et tu sais arbitrer ce qui compte vraiment.",
    medium: "Tu t’organises dès que la charge augmente : clarifie quelques routines pour gagner en confort.",
    low: "Les priorités se mélangent : construis un tableau simple (urgent / important) pour cadrer ta journée.",
  },
  empathie_ecoute_active: {
    high: "Tu captes rapidement les signaux émotionnels d’autrui et tu ajustes ton soutien avec finesse.",
    medium: "Tu es attentif·ve aux autres mais il t’arrive de passer à côté de signaux faibles.",
    low: "Les ressentis des autres te parviennent difficilement : multiplie les reformulations et les questions ouvertes.",
  },
  resolution_problemes: {
    high: "Tu analyses les situations avec méthode et tu prends des décisions éclairées.",
    medium: "Tu alternes entre intuition et analyse : gagne en efficacité avec un canevas simple (constat → options → test).",
    low: "Tu peux agir trop vite ou te perdre dans le détail : impose-toi un temps d’observation avant d’agir.",
  },
  collaboration_conflits: {
    high: "Tu facilites les relations et tu sais apaiser les tensions pour que chacun avance.",
    medium: "Tu cherches l’équilibre collectif mais tu peux parfois t’effacer ou t’imposer trop vite.",
    low: "Les situations tendues te bousculent : prépare une phrase d’ouverture et une demande claire avant d’échanger.",
  },
  creativite_adaptabilite: {
    high: "Tu changes facilement de stratégie et tu proposes des idées originales pour contourner les blocages.",
    medium: "Tu t’adaptes si nécessaire : garde un espace régulier pour tester de nouvelles approches sans pression.",
    low: "Les imprévus freinent ton élan : expérimente de petites variations contrôlées pour développer ta souplesse.",
  },
  leadership_vision: {
    high: "Tu donnes une direction et tu valorises les talents autour de toi avec naturel.",
    medium: "Tu peux endosser le rôle si on te le demande : clarifie ce que tu veux porter pour oser davantage.",
    low: "Tu restes souvent en retrait : prépare une vision simple (pourquoi → comment → bénéfices) pour guider ton équipe.",
  },
  confiance_decision: {
    high: "Tu assumes tes choix et tu sais trancher avec assurance.",
    medium: "Tu décides correctement mais tu peux douter lorsque l’enjeu est élevé.",
    low: "Tu redoutes de te tromper : définis tes critères incontournables et consulte une personne ressource avant de conclure.",
  },
};

function scoreToMessage(dimension: string, score: number) {
  const thresholds = DIMENSION_MESSAGES[dimension] ?? DIMENSION_MESSAGES.coping_naturel;
  if (score >= 70) return thresholds.high;
  if (score >= 45) return thresholds.medium;
  return thresholds.low;
}

function buildSummary(dimensionScores: Record<string, number>) {
  const entries = Object.entries(dimensionScores);
  if (entries.length === 0) {
    return "Vos résultats sont enregistrés. Revenez régulièrement pour suivre votre évolution.";
  }

  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [topDimension, topScore] = sorted[0];
  const [lowDimension, lowScore] = sorted[sorted.length - 1];

  const topLabel = DIMENSION_LABELS[topDimension] ?? topDimension;
  const lowLabel = DIMENSION_LABELS[lowDimension] ?? lowDimension;

  return `Votre force actuelle se situe sur « ${topLabel} » (${Math.round(
    topScore,
  )}/100). Vous gagnez à surveiller « ${lowLabel} » (${Math.round(
    lowScore,
  )}/100) pour rester en équilibre.`;
}

type ChoiceAnswer = {
  dimension: string;
  question: string;
  choice: string;
  points: number;
};

type QualitativeResponse = {
  dimension: string;
  question: string;
  answer: string;
};

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    global_summary: { type: "string" },
    profile_introduction: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" },
    },
    improvement_opportunities: {
      type: "array",
      items: { type: "string" },
    },
    career_paths: {
      type: "array",
      items: { type: "string" },
    },
    dimension_insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dimension_key: { type: "string" },
          insight: { type: "string" },
          recommended_actions: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["dimension_key", "insight"],
      },
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["global_summary"],
};

function buildAssessmentAnalysisPrompt({
  dimensionScores,
  choiceAnswers,
  qualitativeResponses,
}: {
  dimensionScores: Record<string, number>;
  choiceAnswers: ChoiceAnswer[];
  qualitativeResponses: QualitativeResponse[];
}) {
  const dimensionLines =
    Object.entries(dimensionScores)
      .map(([key, score]) => {
        const label = DIMENSION_LABELS[key] ?? key;
        return `- ${label} (${key}) : ${Math.round(score)} / 100`;
      })
      .join("\n") || "- Aucun score quantitatif disponible.";

  const choiceLines =
    choiceAnswers
      .map((answer) => {
        const label = DIMENSION_LABELS[answer.dimension] ?? answer.dimension;
        return `- ${label} : choix « ${answer.choice} » (${answer.points} points).`;
      })
      .join("\n") || "- Aucun choix unique enregistré.";

  const qualitativeLines =
    qualitativeResponses
      .map((response) => {
        const label = DIMENSION_LABELS[response.dimension] ?? response.dimension;
        return `- ${label} : ${response.answer}`;
      })
      .join("\n") || "- Aucune réponse ouverte fournie.";

  return `
Tu es un expert Beyond Care en neurosciences et psychopédagogie. Ton rôle est d’analyser le fonctionnement naturel d'un·e apprenant·e en lisant entre les lignes : tu relies les scores, les choix et les réponses libres pour comprendre la personne au-delà des simples déclarations.

Scores quantitatifs (0 à 100) :
${dimensionLines}

Choix déclarés :
${choiceLines}

Réponses ouvertes :
${qualitativeLines}

Consignes :
- écris en français, en casse naturelle (Pas de Title Case).
- adopte un ton chaleureux, concret, non jugeant.
- commence ton analyse par une phrase qui positionne explicitement le score global (ex. "Avec 56/100 tu te situes dans la zone d’équilibre fragile car…").
- explique pourquoi ce niveau de score apparaît, en reliant les réponses quanti et quali.
- connecte systématiquement quanti et quali pour expliquer le mode de fonctionnement.
- suggère des actions réalistes qui respectent l’écologie naturelle de la personne.
- dresse un classement décroissant des dimensions (du score le plus élevé au plus bas) dans l'analyse détaillée.
- identifie 3 à 5 points forts concrets (forces) et 3 à 5 axes d’amélioration pratiques.
- propose 3 à 5 pistes de métiers ou d’études cohérentes avec le profil détecté, en restant réaliste.

Réponds UNIQUEMENT avec un JSON respectant ce schéma :
{
  "global_summary": string,
  "profile_introduction": string,
  "strengths": string[],
  "improvement_opportunities": string[],
  "career_paths": string[],
  "dimension_insights": [
    {
      "dimension_key": string,
      "insight": string,
      "recommended_actions": string[]
    }
  ],
  "recommendations": string[]
}
`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const url = new URL(request.url);
    const questionnaireId = url.searchParams.get("questionnaireId");

    let query = supabase
      .from("mental_health_assessments")
      .select("id, questionnaire_id, overall_score, dimension_scores, analysis_summary, analysis_details, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (questionnaireId) {
      query = query.eq("questionnaire_id", questionnaireId);
    }

    const { data: assessments, error } = await query;

    if (error) {
      console.error("[mental-health/assessments] GET error", error);
      return NextResponse.json({ error: "Impossible de récupérer les résultats" }, { status: 500 });
    }

    return NextResponse.json({ assessments: assessments ?? [] });
  } catch (error) {
    console.error("[mental-health/assessments] GET unexpected", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const { questionnaireId, answers } = body as { questionnaireId?: string; answers?: AnswerPayload[] };

    if (!questionnaireId || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "Questionnaire et réponses obligatoires" }, { status: 400 });
    }

    const sessionClient = await getServerClient();
    if (!sessionClient) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isSuper = await isUserSuperAdmin(user.id);
    const hasAccess = await hasUserFeature("beyond_care");
    if (!hasAccess && !isSuper) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { data: membership } = await sessionClient
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!membership && !isSuper) {
      return NextResponse.json({ error: "Aucune organisation associée" }, { status: 400 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: questionnaire, error: questionnaireError } = await serviceClient
      .from("mental_health_questionnaires")
      .select(
        `
        id,
        org_id,
        title,
        questions:mental_health_questions (
          id,
        question_text,
          question_type,
          metadata,
        likert_scale,
        options
        )
      `,
      )
      .eq("id", questionnaireId)
      .maybeSingle();

    if (questionnaireError || !questionnaire) {
      return NextResponse.json({ error: "Questionnaire introuvable" }, { status: 404 });
    }

    if (!isSuper && membership?.org_id !== questionnaire.org_id) {
      return NextResponse.json({ error: "Questionnaire non accessible" }, { status: 403 });
    }

    const questionMap = new Map(
      (questionnaire.questions || []).map((question) => [question.id, question]),
    );

    if (questionMap.size === 0) {
      return NextResponse.json({ error: "Questionnaire non configuré" }, { status: 400 });
    }

    const answersArray: AnswerPayload[] = Array.isArray(answers) ? answers : [];
    if (answersArray.length === 0) {
      return NextResponse.json({ error: "Aucune réponse fournie" }, { status: 400 });
    }

    const aggregates = new Map<string, DimensionAggregate>();
    const responsesPayload: Array<Record<string, any>> = [];
    const qualitativeResponses: QualitativeResponse[] = [];
    const choiceAnswers: ChoiceAnswer[] = [];

    let totalScore = 0;
    let totalCount = 0;

    for (const rawAnswer of answersArray) {
      if (!rawAnswer?.questionId) {
        return NextResponse.json({ error: "Réponse invalide (question manquante)" }, { status: 400 });
      }

      const question = questionMap.get(rawAnswer.questionId);
      if (!question) {
        return NextResponse.json({ error: "Réponse invalide" }, { status: 400 });
      }

      const dimension = question.metadata?.dimension ?? "autres";

      if (question.question_type === "text") {
        const textValue =
          typeof rawAnswer.value === "string" ? rawAnswer.value.trim() : "";

        if (!textValue) {
          return NextResponse.json(
            { error: "Merci de répondre en quelques mots aux questions ouvertes." },
            { status: 400 },
          );
        }

        qualitativeResponses.push({
          dimension,
          question: question.question_text,
          answer: textValue,
        });

        responsesPayload.push({
          questionnaire_id: questionnaireId,
          question_id: question.id,
          user_id: user.id,
          org_id: membership?.org_id ?? questionnaire.org_id,
          response_value: textValue,
          response_json: { value: textValue },
          metadata: {
            dimension,
            question_type: question.question_type,
          },
        });

        continue;
      }

      if (question.question_type === "single_choice" || question.question_type === "multiple_choice") {
        const selectedValue = String(rawAnswer.value ?? "");
        const options = Array.isArray(question.options) ? question.options : [];
        const option = options.find((opt: any) => opt.value === selectedValue);

        if (!option) {
          return NextResponse.json(
            { error: "Option invalide pour une question à choix unique." },
            { status: 400 },
          );
        }

        const pointsArray = options.map((opt: any) => opt.points ?? 0);
        const maxPoints = Math.max(...pointsArray);
        const minPoints = Math.min(...pointsArray);
        const points = option.points ?? 0;
        const normalizedScore =
          maxPoints === minPoints ? 0 : ((points - minPoints) / (maxPoints - minPoints)) * 100;

        const aggregate = aggregates.get(dimension) ?? { sum: 0, count: 0 };
        aggregate.sum += normalizedScore;
        aggregate.count += 1;
        aggregates.set(dimension, aggregate);

        choiceAnswers.push({
          dimension,
          question: question.question_text,
          choice: option.label ?? selectedValue,
          points,
        });

        responsesPayload.push({
          questionnaire_id: questionnaireId,
          question_id: question.id,
          user_id: user.id,
          org_id: membership?.org_id ?? questionnaire.org_id,
          response_value: selectedValue,
          response_json: {
            value: selectedValue,
            label: option.label ?? selectedValue,
            points,
          },
          metadata: {
            dimension,
            question_type: question.question_type,
          },
        });

        totalScore += normalizedScore;
        totalCount += 1;
        continue;
      }

      const numericValue = Number(rawAnswer.value);
      if (!Number.isFinite(numericValue)) {
        return NextResponse.json({ error: "Valeur numérique attendue." }, { status: 400 });
      }

      const likert = question.likert_scale ?? { min: 1, max: 5 };
      if (numericValue < likert.min || numericValue > likert.max) {
        return NextResponse.json({ error: "Valeur hors de l'échelle attendue" }, { status: 400 });
      }

      const normalizedScore = ((numericValue - likert.min) / (likert.max - likert.min)) * 100;

      const aggregate = aggregates.get(dimension) ?? { sum: 0, count: 0 };
      aggregate.sum += normalizedScore;
      aggregate.count += 1;
      aggregates.set(dimension, aggregate);

      responsesPayload.push({
        questionnaire_id: questionnaireId,
        question_id: question.id,
        user_id: user.id,
        org_id: membership?.org_id ?? questionnaire.org_id,
        response_value: numericValue.toString(),
        response_json: { value: numericValue },
        metadata: {
          dimension,
          question_type: question.question_type,
        },
      });

      totalScore += normalizedScore;
      totalCount += 1;
    }

    if (responsesPayload.length === 0) {
      return NextResponse.json({ error: "Aucune réponse enregistrée" }, { status: 400 });
    }

    if (totalCount === 0) {
      return NextResponse.json({ error: "Impossible de calculer le score" }, { status: 400 });
    }

    const dimensionScores: Record<string, number> = {};
    const analysisDetails: Record<
      string,
      { score: number; label: string; message: string; recommendations: string[] }
    > = {};

    aggregates.forEach((aggregate, dimension) => {
      const average = aggregate.sum / aggregate.count;
      dimensionScores[dimension] = average;
      analysisDetails[dimension] = {
        score: average,
        label: DIMENSION_LABELS[dimension] ?? dimension,
        message: scoreToMessage(dimension, average),
        recommendations: [],
      };
    });

    const overallScore = totalScore / totalCount;
    let analysisSummary = buildSummary(dimensionScores);
    let aiRecommendations: string[] = [];
    let profileIntroduction: string | null = null;
    let aiStrengths: string[] = [];
    let aiImprovements: string[] = [];
    let aiCareerPaths: string[] = [];

    if (Object.keys(dimensionScores).length > 0) {
      try {
        const aiResult = await generateJSON(
          buildAssessmentAnalysisPrompt({
            dimensionScores,
            choiceAnswers,
            qualitativeResponses,
          }),
          { parameters: ANALYSIS_SCHEMA },
        );

        if (aiResult) {
          if (typeof aiResult.global_summary === "string" && aiResult.global_summary.trim().length > 0) {
            analysisSummary = aiResult.global_summary.trim();
          }

          if (typeof aiResult.profile_introduction === "string" && aiResult.profile_introduction.trim().length > 0) {
            profileIntroduction = aiResult.profile_introduction.trim();
          }

          if (Array.isArray(aiResult.strengths)) {
            aiStrengths = aiResult.strengths
              .filter((item: any) => typeof item === "string" && item.trim().length > 0)
              .map((item: string) => item.trim())
              .slice(0, 5);
          }

          if (Array.isArray(aiResult.improvement_opportunities)) {
            aiImprovements = aiResult.improvement_opportunities
              .filter((item: any) => typeof item === "string" && item.trim().length > 0)
              .map((item: string) => item.trim())
              .slice(0, 5);
          }

          if (Array.isArray(aiResult.career_paths)) {
            aiCareerPaths = aiResult.career_paths
              .filter((item: any) => typeof item === "string" && item.trim().length > 0)
              .map((item: string) => item.trim())
              .slice(0, 5);
          }

          if (Array.isArray(aiResult.dimension_insights)) {
            aiResult.dimension_insights.forEach((insight: any) => {
              const dimensionKey = typeof insight.dimension_key === "string" ? insight.dimension_key : "";
              if (!dimensionKey) return;

              if (!analysisDetails[dimensionKey]) {
                analysisDetails[dimensionKey] = {
                  score: dimensionScores[dimensionKey] ?? 0,
                  label: DIMENSION_LABELS[dimensionKey] ?? dimensionKey,
                  message: "",
                  recommendations: [],
                };
              }

              if (typeof insight.insight === "string" && insight.insight.trim().length > 0) {
                analysisDetails[dimensionKey].message = insight.insight.trim();
              }

              if (Array.isArray(insight.recommended_actions)) {
                analysisDetails[dimensionKey].recommendations = insight.recommended_actions
                  .filter((item: any) => typeof item === "string" && item.trim().length > 0)
                  .map((item: string) => item.trim())
                  .slice(0, 3);
              }
            });
          }

          if (Array.isArray(aiResult.recommendations)) {
            aiRecommendations = aiResult.recommendations
              .filter((item: any) => typeof item === "string" && item.trim().length > 0)
              .map((item: string) => item.trim())
              .slice(0, 5);
          }

          await logAIUsageEvent(serviceClient, {
            userId: user.id,
            route: "/api/mental-health/assessments",
            action: "analysis",
            provider: "openai",
            model: "gpt-4o-mini",
            metadata: {
              questionnaireId,
              dimensions: Object.keys(dimensionScores),
            },
          });
        }
      } catch (aiError) {
        console.error("[mental-health/assessments] AI analysis error", aiError);
      }
    }

    const { error: responsesError } = await serviceClient.from("mental_health_responses").insert(responsesPayload);
    if (responsesError) {
      console.error("[mental-health/assessments] responses insert", responsesError);
      const message =
        responsesError.code === "42P01"
          ? "Table mental_health_responses absente. Appliquez la migration Beyond Care."
          : responsesError.message || "Impossible d'enregistrer les réponses";

      return NextResponse.json(
        {
          error: message,
          code: responsesError.code,
        },
        { status: 500 },
      );
    }

    const { data: assessment, error: assessmentError } = await serviceClient
      .from("mental_health_assessments")
      .insert({
        questionnaire_id: questionnaireId,
        user_id: user.id,
        org_id: membership?.org_id ?? questionnaire.org_id,
        overall_score: overallScore,
        dimension_scores: dimensionScores,
        analysis_summary: analysisSummary,
        analysis_details: analysisDetails,
        metadata: {
          question_count: answersArray.length,
          qualitative_responses: qualitativeResponses,
          choice_answers: choiceAnswers,
          ai_recommendations: aiRecommendations,
          ai_profile_introduction: profileIntroduction,
          ai_strengths: aiStrengths,
          ai_improvement_opportunities: aiImprovements,
          ai_career_paths: aiCareerPaths,
        },
      })
      .select("id, questionnaire_id, overall_score, dimension_scores, analysis_summary, analysis_details, metadata, created_at")
      .single();

    if (assessmentError || !assessment) {
      console.error("[mental-health/assessments] assessment insert", assessmentError);
      const message =
        assessmentError?.code === "42P01"
          ? "Table mental_health_assessments absente. Appliquez la migration Beyond Care."
          : assessmentError?.message || "Impossible d'enregistrer l'analyse";

      return NextResponse.json(
        {
          error: message,
          code: assessmentError?.code,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error("[mental-health/assessments] POST unexpected", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}

