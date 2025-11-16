import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isUserSuperAdmin } from "@/lib/auth/super-admin";

const TARGET_EMAILS = ["contentin.cabinet@gmail.com", "timdarcypro@gmail.com"];

const DIMENSION_LABELS: Record<string, string> = {
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

type LikertQuestion = {
  text: string;
  dimension: keyof typeof DIMENSION_LABELS;
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

const QUESTIONS: LikertQuestion[] = [
  { text: "Je prends du recul quand je suis stressé(e).", dimension: "gestion_emotions_stress" },
  { text: "J’explique clairement mes idées, même en groupe.", dimension: "communication_influence" },
  { text: "Je prends des initiatives pour résoudre un problème sans attendre qu’on me le demande.", dimension: "perseverance_action" },
  { text: "Je planifie mes journées pour être efficace.", dimension: "organisation_priorites" },
  { text: "Je repère les émotions des autres, même quand elles ne sont pas dites.", dimension: "empathie_ecoute_active" },
  { text: "Je prends le temps d’analyser un problème avant d’agir.", dimension: "resolution_problemes" },
  { text: "J’écoute chaque point de vue avant de donner le mien.", dimension: "collaboration_conflits" },
  { text: "J’aime tester de nouvelles approches dans mes projets.", dimension: "creativite_adaptabilite" },
  { text: "Je prends le rôle de guide quand un groupe en a besoin.", dimension: "leadership_vision" },
  { text: "Je recherche les informations dont j’ai besoin avant de prendre une décision.", dimension: "confiance_decision" },
  { text: "Je demande de l’aide quand je vois que je ne pourrai pas respecter un délai.", dimension: "organisation_priorites" },
  { text: "J’adapte ma façon de parler si je sens que l’autre ne comprend pas.", dimension: "communication_influence" },
  { text: "Je reste concentré(e) même sous pression.", dimension: "gestion_emotions_stress" },
  { text: "Je continue malgré les obstacles quand un objectif me tient à cœur.", dimension: "perseverance_action" },
  { text: "Je propose des solutions satisfaisantes pour toutes les personnes concernées.", dimension: "collaboration_conflits" },
  { text: "Je pose des questions pour mieux comprendre ce que l’autre ressent.", dimension: "empathie_ecoute_active" },
  { text: "Je décompose les situations complexes en étapes plus simples.", dimension: "resolution_problemes" },
  { text: "Je propose des idées originales pour résoudre un problème.", dimension: "creativite_adaptabilite" },
  { text: "Je propose des idées pour améliorer les méthodes ou les processus.", dimension: "leadership_vision" },
  { text: "Je fais confiance à mon jugement dans les décisions importantes.", dimension: "confiance_decision" },
  { text: "J’utilise des exemples simples pour expliquer quelque chose.", dimension: "communication_influence" },
  { text: "Je classe mes tâches selon leur importance.", dimension: "organisation_priorites" },
  { text: "Je reconnais rapidement mes émotions dans une situation difficile.", dimension: "gestion_emotions_stress" },
  { text: "Je reste engagé(e) même quand la motivation baisse.", dimension: "perseverance_action" },
  { text: "Je m’adapte facilement aux différentes personnalités dans un groupe.", dimension: "collaboration_conflits" },
  { text: "Je vérifie la fiabilité d’une information avant d’y croire.", dimension: "resolution_problemes" },
  { text: "Je m’adapte facilement quand mes plans changent.", dimension: "creativite_adaptabilite" },
  { text: "Je reformule parfois pour vérifier que j’ai bien compris ce que l’autre me dit.", dimension: "empathie_ecoute_active" },
  { text: "Je repère facilement les objectifs à long terme dans un projet.", dimension: "leadership_vision" },
  { text: "Je suis capable de trancher rapidement lorsqu’une décision est urgente.", dimension: "confiance_decision" },
  { text: "Je sais présenter une idée de manière convaincante.", dimension: "communication_influence" },
  { text: "Je réorganise rapidement mes priorités lorsqu’un imprévu survient.", dimension: "organisation_priorites" },
  { text: "Je fais attention à mes mots quand je suis en colère ou contrarié(e).", dimension: "gestion_emotions_stress" },
  { text: "Je saisis rapidement une opportunité qui se présente.", dimension: "perseverance_action" },
  { text: "Je reste calme quand une situation devient tendue.", dimension: "collaboration_conflits" },
  { text: "Je cherche une nouvelle solution si la méthode habituelle ne fonctionne pas.", dimension: "resolution_problemes" },
  { text: "Je modifie ma façon de faire lorsque quelque chose ne fonctionne pas comme prévu.", dimension: "creativite_adaptabilite" },
  { text: "Je reste pleinement attentif(ve) quand quelqu’un me parle.", dimension: "empathie_ecoute_active" },
  { text: "Je valorise les forces des personnes autour de moi.", dimension: "leadership_vision" },
  { text: "Je défends mon point de vue calmement lorsque c’est nécessaire.", dimension: "confiance_decision" },
];

async function resolveOrgIds(
  serviceClient: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  requestedOrgIds: unknown[],
) {
  const orgIds = new Set<string>();

  if (Array.isArray(requestedOrgIds)) {
    requestedOrgIds
      .map((value) => (typeof value === "string" ? value : null))
      .filter((value): value is string => Boolean(value))
      .forEach((value) => orgIds.add(value));
  }

  if (orgIds.size > 0) {
    return Array.from(orgIds);
  }

  const { data: profiles } = await serviceClient
    .from("profiles")
    .select("id, email")
    .in("email", TARGET_EMAILS);

  if (profiles && profiles.length > 0) {
    await Promise.all(
      profiles.map(async (profile) => {
        const { data: memberships } = await serviceClient
          .from("org_memberships")
          .select("org_id")
          .eq("user_id", profile.id);

        memberships
          ?.map((membership) => membership.org_id)
          .filter((value): value is string => Boolean(value))
          .forEach((value) => orgIds.add(value));
      }),
    );
  }

  if (orgIds.size === 0) {
    const { data: organizations } = await serviceClient.from("organizations").select("id").limit(1);
    organizations
      ?.map((organization) => organization.id)
      .filter((value): value is string => Boolean(value))
      .forEach((value) => orgIds.add(value));
  }

  return Array.from(orgIds);
}

function buildQuestionRecords(questionnaireId: string) {
  return QUESTIONS.map((question, index) => ({
    id: randomUUID(),
    questionnaire_id: questionnaireId,
    question_text: question.text,
    question_type: "likert" as const,
    order_index: index,
    is_required: true,
    likert_scale: DEFAULT_LIKERT_SCALE,
    options: null,
    scoring: {
      enabled: true,
      points: { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5 },
      weight: 1,
    },
    metadata: {
      dimension: question.dimension,
    },
  }));
}

function buildScoringConfig(questionIds: Record<string, string[]>) {
  return {
    enabled: true,
    max_score: 100,
    categories: Object.entries(questionIds).map(([dimension, ids]) => ({
      name: DIMENSION_LABELS[dimension] ?? dimension,
      questions: ids,
      weight: 1,
    })),
  };
}

export async function POST(request: NextRequest) {
  try {
    const sessionClient = await getServerClient();
    if (!sessionClient) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: authData } = await sessionClient.auth.getUser();
    const requesterId = authData?.user?.id;

    if (!requesterId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isSuper = await isUserSuperAdmin(requesterId);
    if (!isSuper) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const targetOrgIds = await resolveOrgIds(serviceClient, body?.org_ids);

    if (targetOrgIds.length === 0) {
      return NextResponse.json({ error: "Impossible d’identifier les organisations cibles." }, { status: 400 });
    }

    const results: Array<{ org_id: string; questionnaire_id: string }> = [];
    const title = "Soft Skills – Profil 360";

    for (const orgId of targetOrgIds) {
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

      const questionIdMap: Record<string, string[]> = {};
      QUESTIONS.forEach((question) => {
        if (!questionIdMap[question.dimension]) {
          questionIdMap[question.dimension] = [];
        }
      });

      const { data: questionnaire, error: insertError } = await serviceClient
        .from("mental_health_questionnaires")
        .insert({
          org_id: orgId,
          title,
          description:
            "Questionnaire soft skills sur 10 dimensions clés (communication, leadership, empathie, créativité, organisation, prise de décision, etc.).",
          is_active: true,
          frequency: "quarterly",
          send_day: 1,
          send_time: "08:00:00",
          target_roles: ["learner"],
          created_by: requesterId,
          scoring_config: buildScoringConfig(
            Object.keys(questionIdMap).reduce<Record<string, string[]>>((acc, key) => {
              acc[key] = [];
              return acc;
            }, {}),
          ),
        })
        .select("id, scoring_config")
        .single();

      if (insertError || !questionnaire) {
        console.error("[seed-soft-skills] questionnaire insert", insertError);
        return NextResponse.json(
          { error: insertError?.message || "Impossible de créer le questionnaire" },
          { status: 500 },
        );
      }

      const questionRecords = buildQuestionRecords(questionnaire.id);
      questionRecords.forEach((record) => {
        const dimension = record.metadata?.dimension;
        if (dimension) {
          if (!questionIdMap[dimension]) {
            questionIdMap[dimension] = [];
          }
          questionIdMap[dimension].push(record.id);
        }
      });

      const scoringConfig = buildScoringConfig(questionIdMap);

      const { error: questionsError } = await serviceClient.from("mental_health_questions").insert(questionRecords);

      if (questionsError) {
        console.error("[seed-soft-skills] questions insert", questionsError);
        await serviceClient.from("mental_health_questionnaires").delete().eq("id", questionnaire.id);
        return NextResponse.json({ error: questionsError.message || "Impossible de créer les questions" }, { status: 500 });
      }

      await serviceClient
        .from("mental_health_questionnaires")
        .update({ scoring_config: scoringConfig })
        .eq("id", questionnaire.id);

      results.push({ org_id: orgId, questionnaire_id: questionnaire.id });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("[seed-soft-skills] unexpected", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}

