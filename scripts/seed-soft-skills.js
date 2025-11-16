const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");

const SUPABASE_URL = "https://fqqqejpakbccwvrlolpc.supabase.co";
const ORG_ID = "33e9a355-9e75-4151-83b9-dda09e83a70d";
const CREATED_BY = "60c88469-3c53-417f-a81d-565a662ad2f5";

const DIMENSION_LABELS = {
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

const DEFAULT_LIKERT_SCALE = {
  min: 1,
  max: 5,
  labels: {
    1: "Pas du tout",
    2: "Plutôt non",
    3: "Ni oui ni non",
    4: "Plutôt oui",
    5: "Tout à fait",
  },
};

const SOFT_SKILLS_QUESTIONS = [
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

async function run() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY n’est pas défini dans l’environnement courant.");
  }

  const supabase = createClient(SUPABASE_URL, serviceRoleKey);
  const title = "Soft Skills – Profil 360";

  const { data: existing, error: existingError } = await supabase
    .from("mental_health_questionnaires")
    .select("id")
    .eq("org_id", ORG_ID)
    .eq("title", title)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    console.log(`[seed-soft-skills] Suppression de l’ancienne version (${existing.id}).`);
    await supabase.from("mental_health_questions").delete().eq("questionnaire_id", existing.id);
    await supabase.from("mental_health_questionnaires").delete().eq("id", existing.id);
  }

  const questions = SOFT_SKILLS_QUESTIONS.map((item, index) => ({
    id: randomUUID(),
    question_text: item.text,
    question_type: "likert",
    order_index: index,
    is_required: true,
    likert_scale: DEFAULT_LIKERT_SCALE,
    scoring: {
      enabled: true,
      points: {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
      },
      weight: 1,
    },
    metadata: {
      dimension: item.dimension,
    },
  }));

  const grouped = questions.reduce((acc, question) => {
    const dimension = question.metadata?.dimension || "autres";
    if (!acc[dimension]) {
      acc[dimension] = [];
    }
    acc[dimension].push(question.id);
    return acc;
  }, {});

  const scoringConfig = {
    enabled: true,
    max_score: 100,
    categories: Object.entries(grouped).map(([dimension, ids]) => ({
      name: DIMENSION_LABELS[dimension] || dimension,
      questions: ids,
      weight: 1,
    })),
  };

  const { data: questionnaire, error: insertError } = await supabase
    .from("mental_health_questionnaires")
    .insert({
      org_id: ORG_ID,
      title,
      description:
        "Questionnaire soft skills couvrant 10 dimensions clés (gestion du stress, communication, collaboration, créativité, leadership, etc.).",
      is_active: true,
      frequency: "quarterly",
      send_day: 1,
      send_time: "08:00:00",
      target_roles: ["learner"],
      created_by: CREATED_BY,
      scoring_config: scoringConfig,
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  const questionsToInsert = questions.map((question, orderIndex) => ({
    id: question.id,
    questionnaire_id: questionnaire.id,
    question_text: question.question_text,
    question_type: question.question_type,
    order_index: orderIndex,
    is_required: true,
    likert_scale: question.likert_scale,
    options: null,
    scoring: question.scoring,
    metadata: question.metadata,
  }));

  const { error: questionsError } = await supabase
    .from("mental_health_questions")
    .insert(questionsToInsert);

  if (questionsError) {
    await supabase.from("mental_health_questionnaires").delete().eq("id", questionnaire.id);
    throw questionsError;
  }

  console.log(`[seed-soft-skills] Questionnaire inséré (${questionnaire.id}) avec ${questions.length} questions.`);
}

run().catch((error) => {
  console.error("[seed-soft-skills] échec :", error);
  process.exit(1);
});



