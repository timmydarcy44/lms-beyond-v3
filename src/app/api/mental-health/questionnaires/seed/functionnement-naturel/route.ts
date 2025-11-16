import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isUserSuperAdmin } from "@/lib/auth/super-admin";

const DIMENSION_LABELS: Record<string, string> = {
  style_cognitif_organisationnel: "Style cognitif organisationnel",
  mode_emotionnel_naturel: "Mode émotionnel naturel",
  besoin_social_naturel: "Besoin social naturel",
  coping_naturel: "Coping naturel",
  energie_rythme_interne: "Énergie & rythme interne",
};

const DEFAULT_LIKERT_SCALE = {
  min: 1,
  max: 5,
  labels: {
    "1": "Pas du tout",
    "2": "Plutôt non",
    "3": "Ni oui ni non",
    "4": "Plutôt oui",
    "5": "Tout à fait",
  },
};

type PresetQuestion =
  | { kind: "likert"; text: string; dimension: string; mediaUrl?: string }
  | {
      kind: "single_choice";
      text: string;
      dimension: string;
      options: Array<{ value: string; label: string; points: number }>;
      mediaUrl?: string;
    }
  | { kind: "text"; text: string; dimension: string; mediaUrl?: string };

const createLikert = (text: string, dimension: string, mediaUrl?: string): PresetQuestion => ({
  kind: "likert",
  text,
  dimension,
  mediaUrl,
});

const createSingleChoice = (
  text: string,
  dimension: string,
  options: Array<{ value: string; label: string; points: number }>,
  mediaUrl?: string,
): PresetQuestion => ({
  kind: "single_choice",
  text,
  dimension,
  options,
  mediaUrl,
});

const createOpen = (text: string, dimension: string, mediaUrl?: string): PresetQuestion => ({
  kind: "text",
  text,
  dimension,
  mediaUrl,
});

const PRESET_ITEMS: PresetQuestion[] = [
  // Dimension 1: Besoin social naturel
  createLikert("J’ai naturellement besoin de temps seul·e pour me ressourcer.", "besoin_social_naturel"),
  createLikert("Les interactions sociales me fatiguent rapidement.", "besoin_social_naturel"),
  createLikert("Je préfère les petits cercles intimes plutôt que les grands groupes.", "besoin_social_naturel"),
  createLikert("J’ai rarement besoin de contacts sociaux pour me sentir bien.", "besoin_social_naturel"),
  createSingleChoice(
    "Dans quel environnement social te sens-tu le plus naturellement à l’aise ?",
    "besoin_social_naturel",
    [
      { value: "A", label: "Seul·e ou en très petit comité", points: 4 },
      { value: "B", label: "Avec un groupe réduit et connu", points: 3 },
      { value: "C", label: "Avec un groupe de taille moyenne", points: 2 },
      { value: "D", label: "Dans des environnements très sociaux / grands groupes", points: 1 },
    ],
  ),
  createOpen("Quelles interactions sociales te rechargent ou t’épuisent naturellement ? Explique en quelques mots.", "besoin_social_naturel"),

  // Dimension 2: Mode émotionnel naturel
  createLikert("Je ressens mes émotions de manière intense, quelle qu’elles soient.", "mode_emotionnel_naturel"),
  createLikert("J’ai tendance à garder mes émotions pour moi.", "mode_emotionnel_naturel"),
  createLikert("Mes émotions changent facilement au cours d’une journée.", "mode_emotionnel_naturel"),
  createLikert("Je suis naturellement sensible à l’ambiance ou aux émotions des autres.", "mode_emotionnel_naturel"),
  createSingleChoice(
    "Comment décrirais-tu ton mode émotionnel naturel ?",
    "mode_emotionnel_naturel",
    [
      { value: "A", label: "Fortes émotions, très sensibles", points: 4 },
      { value: "B", label: "Émotions modérées, assez stables", points: 3 },
      { value: "C", label: "Émotions faibles, peu visibles", points: 2 },
      { value: "D", label: "Émotions très maîtrisées / peu perçues", points: 1 },
    ],
  ),
  createOpen("Qu’est-ce qui influence le plus ton équilibre émotionnel au quotidien ?", "mode_emotionnel_naturel"),

  // Dimension 3: Énergie & rythme interne
  createLikert("Mon niveau d’énergie naturel est plutôt bas et constant.", "energie_rythme_interne"),
  createLikert("J’ai besoin de plus de pauses que la moyenne pour rester bien.", "energie_rythme_interne"),
  createLikert("Je suis naturellement calme et peu “survolté·e”.", "energie_rythme_interne"),
  createLikert("J’ai tendance à me fatiguer rapidement lors d’activités prolongées.", "energie_rythme_interne"),
  createSingleChoice(
    "Ton niveau d’énergie naturel ressemble plutôt à :",
    "energie_rythme_interne",
    [
      { value: "A", label: "Faible, besoin de pauses fréquentes", points: 4 },
      { value: "B", label: "Modéré, assez stable", points: 3 },
      { value: "C", label: "Fluctuant, variable selon les jours", points: 2 },
      { value: "D", label: "Élevé, endurant et constant", points: 1 },
    ],
  ),
  createOpen("Qu’est-ce qui t’aide le plus à retrouver ton énergie quand tu fatigues ?", "energie_rythme_interne"),

  // Dimension 4: Style cognitif & organisationnel
  createLikert("J’ai besoin d’un environnement organisé pour me sentir bien.", "style_cognitif_organisationnel"),
  createLikert("J’ai du mal à fonctionner quand tout n’est pas planifié.", "style_cognitif_organisationnel"),
  createLikert("J’aime anticiper et déteste les imprévus.", "style_cognitif_organisationnel"),
  createLikert("Je perds facilement ma concentration lorsque plusieurs choses se passent en même temps.", "style_cognitif_organisationnel"),
  createSingleChoice(
    "Quel style d’organisation te correspond le mieux ?",
    "style_cognitif_organisationnel",
    [
      { value: "A", label: "Très structuré, besoin d’anticiper", points: 4 },
      { value: "B", label: "Plutôt organisé, mais flexible", points: 3 },
      { value: "C", label: "Spontané, organisation légère", points: 2 },
      { value: "D", label: "Très flexible, fonctionne au feeling", points: 1 },
    ],
  ),
  createOpen("De quoi as-tu besoin pour te sentir mentalement clair·e et organisé·e ?", "style_cognitif_organisationnel"),

  // Dimension 5: Stratégies naturelles de coping
  createLikert("Quand une difficulté arrive, j’essaie d’abord de régler les choses seul·e.", "coping_naturel"),
  createLikert("Je demande rarement de l’aide, même quand j’en ai besoin.", "coping_naturel"),
  createLikert("Sous stress, j’ai tendance à me replier plutôt qu’à chercher du soutien.", "coping_naturel"),
  createLikert("Quand je suis sous pression, j’ai du mal à exprimer mes besoins.", "coping_naturel"),
  createSingleChoice(
    "Comment réagis-tu naturellement face au stress ?",
    "coping_naturel",
    [
      { value: "A", label: "Je me replie et gère seul·e", points: 4 },
      { value: "B", label: "Je réfléchis avant d’agir / je prends du recul", points: 3 },
      { value: "C", label: "Je demande du soutien si nécessaire", points: 2 },
      { value: "D", label: "Je sollicite naturellement les autres", points: 1 },
    ],
  ),
  createOpen("Qu’est-ce qui t’aide réellement lorsque tu traverses une situation stressante ?", "coping_naturel"),
];

export async function POST(request: NextRequest) {
  try {
    const sessionClient = await getServerClient();
    if (!sessionClient) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: authData } = await sessionClient.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isSuper = await isUserSuperAdmin(authData.user.id);
    if (!isSuper) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    let orgId: string | null = typeof body.org_id === "string" ? body.org_id : null;

    if (!orgId) {
      const { data: org } = await serviceClient.from("organizations").select("id").limit(1).single();
      if (!org?.id) {
        return NextResponse.json({ error: "Aucune organisation trouvée" }, { status: 400 });
      }
      orgId = org.id;
    }

    const title = "Beyond Profile – Fonctionnement naturel";
    const { data: existing } = await serviceClient
      .from("mental_health_questionnaires")
      .select("id")
      .eq("org_id", orgId)
      .eq("title", title)
      .maybeSingle();

    if (existing?.id) {
      await serviceClient.from("mental_health_questions").delete().eq("questionnaire_id", existing.id);
      await serviceClient.from("mental_health_questionnaires").delete().eq("id", existing.id);
    }

    const questions = PRESET_ITEMS.map((item, index) => {
      if (item.kind === "likert") {
        return {
          id: randomUUID(),
          question_text: item.text,
          question_type: "likert",
          order_index: index,
          is_required: true,
          likert_scale: DEFAULT_LIKERT_SCALE,
          scoring: {
            enabled: true,
            points: { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5 },
            weight: 1,
          },
          metadata: {
            dimension: item.dimension,
            ...(item.mediaUrl ? { media_url: item.mediaUrl } : {}),
          },
        };
      }

      if (item.kind === "single_choice") {
        return {
          id: randomUUID(),
          question_text: item.text,
          question_type: "single_choice",
          order_index: index,
          is_required: true,
          options: item.options,
          likert_scale: null,
          scoring: {
            enabled: true,
            points: Object.fromEntries(item.options.map((option) => [option.value, option.points])),
            weight: 1,
          },
          metadata: {
            dimension: item.dimension,
            ...(item.mediaUrl ? { media_url: item.mediaUrl } : {}),
          },
        };
      }

      return {
        id: randomUUID(),
        question_text: item.text,
        question_type: "text",
        order_index: index,
        is_required: true,
        likert_scale: null,
        scoring: {
          enabled: false,
        },
        metadata: {
          dimension: item.dimension,
          ...(item.mediaUrl ? { media_url: item.mediaUrl } : {}),
        },
      };
    });

    const grouped = questions.reduce<Record<string, string[]>>((acc, question) => {
      const dimension = question.metadata?.dimension ?? "autres";
      if (!acc[dimension]) acc[dimension] = [];
      acc[dimension].push(question.id);
      return acc;
    }, {});

    const scoringConfig = {
      enabled: true,
      max_score: 100,
      categories: Object.entries(grouped).map(([dimension, ids]) => ({
        name: DIMENSION_LABELS[dimension] ?? dimension,
        questions: ids,
        weight: 1,
      })),
    };

    const { data: questionnaire, error: insertError } = await serviceClient
      .from("mental_health_questionnaires")
      .insert({
        org_id: orgId,
        title,
        description:
          "Questionnaire Beyond Care sur le fonctionnement naturel (besoin social, mode émotionnel, énergie, style cognitif, coping).",
        is_active: true,
        frequency: "monthly",
        send_day: 1,
        send_time: "07:30:00",
        target_roles: ["learner"],
        created_by: authData.user.id,
        scoring_config: scoringConfig,
      })
      .select("id")
      .single();

    if (insertError || !questionnaire) {
      console.error("[seed-functionnement-naturel] questionnaire insert", insertError);
      return NextResponse.json({ error: insertError?.message || "Impossible de créer le questionnaire" }, { status: 500 });
    }

    const questionsToInsert = questions.map((question, index) => ({
      id: question.id,
      questionnaire_id: questionnaire.id,
      question_text: question.question_text,
      question_type: question.question_type,
      order_index: index,
      is_required: true,
      likert_scale: question.likert_scale,
      options: question.options ?? null,
      scoring: question.scoring,
      metadata: question.metadata,
    }));

    const { error: questionsError } = await serviceClient
      .from("mental_health_questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("[seed-functionnement-naturel] questions insert", questionsError);
      await serviceClient.from("mental_health_questionnaires").delete().eq("id", questionnaire.id);
      return NextResponse.json({ error: questionsError.message || "Impossible de créer les questions" }, { status: 500 });
    }

    return NextResponse.json({ success: true, questionnaire_id: questionnaire.id });
  } catch (error) {
    console.error("[seed-functionnement-naturel] unexpected", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}
