/**

 * Moteur IA Mission EDGE — scène d'abord, coach discret, jauges dynamiques.

 */



import { getOpenAIClient, generateJSON } from "@/lib/ai/openai-client";

import { memoryBlockForPrompt, type CoachMemory } from "@/lib/apprenant/edge-coach-memory";

import {

  applyGaugeDeltas,

  gaugeBehaviorHints,

  gaugesBlockForPrompt,

  initialMissionGauges,

  parseGaugeDeltas,

} from "@/lib/apprenant/edge-mission-gauges";

import {

  behaviorSectionForPrompt,

  buildBehaviorDebrief,

  coachFeedbackFromBehaviors,

  debriefSystemPromptWithBehaviors,

  observedBehaviorsJsonBlock,

  parseObservedBehaviorsFromTurn,

} from "@/lib/apprenant/edge-mission-behavior";

import type { BehaviorTurnObservation } from "@/lib/apprenant/edge-behavior-evidence";
import { heuristicBehaviorDetection } from "@/lib/apprenant/edge-behavior-evidence";
import { getBehaviorGrid } from "@/lib/apprenant/edge-behavior-grids";

import type {

  MissionChatMessage,

  MissionCoachReply,

  MissionContext,

  MissionDebrief,

  SkillProofMatrix,

} from "@/lib/apprenant/edge-mission-types";



const LEVELS = ["Débutant", "Intermédiaire", "Confirmé", "Expert"];



function missionBlock(ctx: MissionContext): string {

  const m = ctx.mission;

  return `MISSION : « ${m.title} »

Objectif pédagogique : ${m.pedagogicalObjective}

Compétence principale : ${m.primarySkill}

Contexte : ${m.context}

Personnage joué : ${m.coachRole}

Objectif de la mission : ${m.missionGoal}`;

}



function memorySection(ctx: MissionContext): string {

  if (!ctx.coachMemory) return "";

  return `\nMÉMOIRE COACH :\n${memoryBlockForPrompt(ctx.coachMemory)}`;

}



function gaugeSection(ctx: MissionContext): string {

  const gauges = ctx.gaugeState ?? initialMissionGauges(ctx.skillName);

  const behavior = gaugeBehaviorHints(gauges);

  return `\nJAUGES ACTUELLES (0-100) :\n${gaugesBlockForPrompt(gauges)}\n${behavior}`;

}



export function buildMissionSystemPrompt(ctx: MissionContext): string {

  const name = ctx.coachMemory?.firstName ?? "l'apprenant";

  return `Tu es le moteur d'une Mission EDGE pour ${name === "toi" ? "l'apprenant" : name}.



RÈGLE ABSOLUE : LA SCÈNE PASSE TOUJOURS AVANT L'ANALYSE.

Après une réponse utilisateur :

1. sceneResponse : le personnage (${ctx.mission.coachRole}) réagit EN PREMIER, dans la scène, de façon réaliste.

   - Si l'utilisateur pose une question, le personnage Y RÉPOND directement (ne l'ignore jamais).

   - Puis relance, contredit, précise, met la pression ou demande une preuve.

2. coachFeedback : 1-2 phrases MAX, discret, après la scène. Mentionne un COMPORTEMENT observé (pas « bonne réponse »). Peut lier à une jauge.

3. gaugeDeltas : variations de jauges selon la qualité stratégique (pas seulement la politesse).

4. observedBehaviors : comportements de la grille réellement manifestés dans la réponse utilisateur (observed: true/false + evidenceQuote).

5. coachInsight détaillé : UNIQUEMENT tous les 3 tours — sinon NE PAS le remplir.



Le coach reste en arrière-plan. L'utilisateur doit vivre une situation professionnelle, pas lire un corrigé.



${missionBlock(ctx)}

${memorySection(ctx)}

${gaugeSection(ctx)}

${behaviorSectionForPrompt(ctx)}



Objectif professionnel : ${ctx.objective || "non précisé"}

Niveau : ${ctx.levelCurrent || "Intermédiaire"}



JSON attendu à chaque tour (hors ouverture) :

{

  "sceneResponse": "réaction du personnage (répond à la question si posée)",

  "nextQuestion": "relance ou suite de la scène (optionnel)",

  "coachFeedback": "feedback court ou chaîne vide",

  "gaugeDeltas": [{ "name": "Confiance du client", "delta": 8, "reason": "..." }],

  ${observedBehaviorsJsonBlock()}

}



Ouverture uniquement :

{

  "coachIntro": "salutation courte du Coach EDGE",

  "sceneResponse": "première réplique in-character"

}`;

}



function buildOpeningUserPrompt(ctx: MissionContext): string {

  return `Ouvre la mission « ${ctx.mission.title} ».

coachIntro : message bref du Coach EDGE.

sceneResponse : première réplique de ${ctx.mission.coachRole} — scène, émotions, première objection.

Pas de gaugeDeltas à l'ouverture.`;

}



function buildTurnUserPrompt(ctx: MissionContext, lastUserMessage: string, userTurn: number): string {

  const detailed = userTurn % 3 === 0;

  return `Tour ${userTurn}. L'apprenant vient de répondre :

« ${lastUserMessage.slice(0, 800)} »



ORDRE OBLIGATOIRE :

1. sceneResponse : ${ctx.mission.coachRole} réagit et RÉPOND à toute question posée.

2. nextQuestion (optionnel) : relance du personnage.

3. coachFeedback : 1-2 phrases max, orienté COMPORTEMENT observé.${detailed ? " Ajoute coachInsight (analyse détaillée)." : " PAS de coachInsight ce tour."}

4. observedBehaviors : liste des comportements de la grille observés ou absents ce tour.

5. gaugeDeltas : variations réalistes.`;

}



function countUserTurns(messages: MissionChatMessage[]): number {

  return messages.filter((m) => m.role === "user").length;

}



function fallbackCoachIntro(ctx: MissionContext): string {

  return `C'est parti pour « ${ctx.mission.title} ». Réagis naturellement — je te donnerai des indices discrets au fil de l'échange.`;

}



const FALLBACK_OPENING_SCENE = (ctx: MissionContext) =>

  `${ctx.mission.coachRole} croise les bras.



« Votre solution est intéressante, mais franchement, c'est beaucoup trop cher pour notre budget. »



Que réponds-tu ?`;



const FALLBACK_TURNS: Array<{

  scene: string;

  coach: string;

  deltas: { name: string; delta: number; reason: string }[];

}> = [

  {

    scene: `« Par rapport à vos concurrents. J'ai deux propositions sur mon bureau, elles sont 30 % moins chères. Alors dites-moi : pourquoi je paierais plus ? »`,

    coach: "Bon réflexe : tu cherches à comprendre avant d'argumenter.",

    deltas: [

      { name: "Confiance du client", delta: 8, reason: "Tu questionnes au lieu de te braquer." },

      { name: "Tension", delta: -3, reason: "L'échange s'ouvre." },

      { name: "Avancée vers l'objectif", delta: 5, reason: "Tu crées un dialogue." },

    ],

  },

  {

    scene: `Il hoche la tête, peu convaincu. « Montrez-moi un chiffre concret : le retour sur investissement en 6 mois. Pas des promesses. »`,

    coach: "Attention : reste précis. Un critère chiffré vaut mieux qu'un discours général.",

    deltas: [

      { name: "Clarté de l'argumentation", delta: 6, reason: "Tu structures ta réponse." },

      { name: "Confiance du client", delta: 4, reason: "Tu prends le temps de répondre." },

    ],

  },

  {

    scene: `Il consulte sa montre. « Dernière chance : qu'est-ce qui justifie un deuxième rendez-vous ? »`,

    coach: "C'est le moment de conclure avec une prochaine étape concrète.",

    deltas: [

      { name: "Avancée vers l'objectif", delta: 10, reason: "Tu vises l'objectif de la mission." },

      { name: "Tension", delta: 5, reason: "La pression monte en fin d'échange." },

    ],

  },

];



function fallbackCoachReply(ctx: MissionContext, messages: MissionChatMessage[]): MissionCoachReply {

  const userTurns = countUserTurns(messages);

  const gauges = ctx.gaugeState ?? initialMissionGauges(ctx.skillName);



  if (messages.length === 0) {

    return { coachIntro: fallbackCoachIntro(ctx), sceneReply: FALLBACK_OPENING_SCENE(ctx), gauges };

  }



  const idx = Math.min(userTurns - 1, FALLBACK_TURNS.length - 1);

  const turn = FALLBACK_TURNS[Math.max(0, idx)];

  const gaugeDeltas = parseGaugeDeltas(turn.deltas);

  const updated = applyGaugeDeltas(gauges, gaugeDeltas);



  const lastUserText = messages.filter((m) => m.role === "user").pop()?.content ?? "";
  const observedBehaviors = heuristicBehaviorDetection(lastUserText, getBehaviorGrid(ctx.skillName)).map((b) => ({
    key: b.key,
    label: b.label,
    observed: b.observed,
    evidenceQuote: b.evidenceQuote,
  }));

  const reply: MissionCoachReply = {

    sceneReply: turn.scene,

    coachFeedback: turn.coach,

    gaugeDeltas,

    gauges: updated,

    observedBehaviors: observedBehaviors.length ? observedBehaviors : undefined,

  };



  if (userTurns % 3 === 0) {

    reply.showDetailedInsight = true;

    reply.coachInsight = {

      whyAsked: "Je voulais voir comment tu gères la pression du personnage.",

      whatObserved: turn.coach,

      whyThink: "Tu progresses dans la situation sans fuir le sujet.",

      howEvaluated: "J'observe si tu réponds à la question posée et si tu fais avancer l'objectif.",

    };

  }



  return reply;

}



function mergeScene(raw: Record<string, unknown>): string {

  const scene = String(raw.sceneResponse ?? raw.sceneReply ?? "").trim();

  const next = String(raw.nextQuestion ?? "").trim();

  if (scene && next) return `${scene}\n\n${next}`;

  return scene || next;

}



function parseCoachReply(

  raw: Record<string, unknown>,

  ctx: MissionContext,

  messages: MissionChatMessage[],

): MissionCoachReply {

  const sceneReply = mergeScene(raw);

  if (!sceneReply) return fallbackCoachReply(ctx, messages);



  const userTurns = countUserTurns(messages);

  const isOpening = messages.length === 0;

  const gauges = ctx.gaugeState ?? initialMissionGauges(ctx.skillName);

  const gaugeDeltas = parseGaugeDeltas(raw.gaugeDeltas);

  const updatedGauges = gaugeDeltas.length ? applyGaugeDeltas(gauges, gaugeDeltas) : gauges;



  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  const lastUserText = lastUser?.content ?? "";

  const observedBehaviors = !isOpening

    ? parseObservedBehaviorsFromTurn(raw, ctx, lastUserText)

    : undefined;



  const result: MissionCoachReply = {

    sceneReply,

    gauges: updatedGauges,

    gaugeDeltas: gaugeDeltas.length ? gaugeDeltas : undefined,

    observedBehaviors,

  };



  const intro = String(raw.coachIntro ?? "").trim();

  if (intro && isOpening) result.coachIntro = intro.slice(0, 400);



  const feedback = String(raw.coachFeedback ?? "").trim();

  if (feedback && !isOpening) {
    result.coachFeedback = feedback.slice(0, 280);
  } else if (!isOpening && observedBehaviors?.length) {
    const behaviorFeedback = coachFeedbackFromBehaviors(observedBehaviors, ctx.skillName);
    if (behaviorFeedback) result.coachFeedback = behaviorFeedback;
  } else if (!isOpening && gaugeDeltas.length > 0 && gaugeDeltas[0].reason) {
    result.coachFeedback = gaugeDeltas[0].reason.slice(0, 280);
  }



  const showDetailed = !isOpening && userTurns > 0 && userTurns % 3 === 0;

  const insight = raw.coachInsight;

  if (showDetailed && insight && typeof insight === "object") {

    const i = insight as Record<string, unknown>;

    result.showDetailedInsight = true;

    result.coachInsight = {

      whyAsked: String(i.whyAsked ?? "").slice(0, 300),

      whatObserved: String(i.whatObserved ?? "").slice(0, 300),

      whyThink: String(i.whyThink ?? "").slice(0, 300),

      howEvaluated: String(i.howEvaluated ?? "").slice(0, 300),

    };

  }



  return result;

}



export async function getMissionCoachReply(

  ctx: MissionContext,

  messages: MissionChatMessage[],

): Promise<MissionCoachReply> {

  if (!ctx.gaugeState) {

    ctx.gaugeState = initialMissionGauges(ctx.skillName);

  }



  const client = getOpenAIClient();

  if (!client) return fallbackCoachReply(ctx, messages);



  try {

    const isOpening = messages.length === 0;

    const lastUser = [...messages].reverse().find((m) => m.role === "user");

    const userTurns = countUserTurns(messages);



    const userPrompt = isOpening

      ? buildOpeningUserPrompt(ctx)

      : buildTurnUserPrompt(ctx, lastUser?.content ?? "", userTurns);



    const transcript = messages

      .map((m) => {

        const who =

          m.role === "user" ? "Apprenant" : m.kind === "coach" ? "Coach EDGE" : ctx.mission.coachRole;

        return `${who} : ${m.content}`;

      })

      .join("\n");



    const completion = await client.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        { role: "system", content: buildMissionSystemPrompt(ctx) },

        ...(transcript ? [{ role: "user" as const, content: `Historique :\n${transcript}` }] : []),

        { role: "user", content: `${userPrompt}\n\nRenvoie UNIQUEMENT un JSON valide.` },

      ],

      max_tokens: 620,

      temperature: 0.84,

      response_format: { type: "json_object" },

    });



    const text = completion.choices[0]?.message?.content ?? "";

    try {

      return parseCoachReply(JSON.parse(text) as Record<string, unknown>, ctx, messages);

    } catch {

      return fallbackCoachReply(ctx, messages);

    }

  } catch (error) {

    console.error("[edge-mission] coach reply error", error);

    return fallbackCoachReply(ctx, messages);

  }

}



function clampLevel(level: string, fallback: string): string {

  const found = LEVELS.find((l) => l.toLowerCase() === level.trim().toLowerCase());

  return found ?? fallback ?? "Intermédiaire";

}



function buildCelebration(ctx: MissionContext, progressHighlight: string): string {

  const name = ctx.coachMemory?.firstName;

  const greeting = name && name !== "toi" ? `Bravo ${name}.` : "Bravo.";

  return `${greeting}\n\nTu viens de terminer « ${ctx.mission.title} ».\n\nAujourd'hui tu as particulièrement progressé sur ${progressHighlight}.`;

}



function fallbackDebrief(ctx: MissionContext, messages: MissionChatMessage[], proofText: string): MissionDebrief {

  const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content);

  const richness = userMsgs.join(" ").length + proofText.length;

  const base = ctx.levelCurrent && LEVELS.includes(ctx.levelCurrent) ? ctx.levelCurrent : "Intermédiaire";

  const progressHighlight = ctx.mission.primarySkill;



  return {

    strengths: ["Tu es resté dans le contexte de la scène.", "Tu as répondu aux objections du personnage."],

    improvements: ["Quantifier davantage ta proposition.", "Conclure avec une prochaine étape concrète."],

    levelEstimated: base,

    confidence: Math.min(88, 55 + Math.floor(richness / 45)),

    nextAction: `Nouvelle Mission EDGE sur « ${ctx.skillName} ».`,

    skillValidated: richness > 450,

    summary: `Mission « ${ctx.mission.title} » terminée.`,

    observations: ["Échange contextualisé avec le personnage."],

    whyThink: "Basé sur tes réponses dans la scène et l'évolution des jauges.",

    examplesFromAnswers: userMsgs.slice(0, 2).map((t) => `« ${t.slice(0, 100)}… »`),

    whatToWorkNext: ["Pratiquer la reformulation du besoin", "Structurer un argument chiffré"],

    recommendedMissionTitle: `Nouvelle objection en ${ctx.skillName}`,

    celebrationMessage: buildCelebration(ctx, progressHighlight),

    progressHighlight,

  };

}



const DEBRIEF_SCHEMA = {

  type: "object",

  properties: {

    strengths: { type: "array", items: { type: "string" } },

    improvements: { type: "array", items: { type: "string" } },

    levelEstimated: { type: "string" },

    confidence: { type: "number" },

    nextAction: { type: "string" },

    skillValidated: { type: "boolean" },

    summary: { type: "string" },

    observations: { type: "array", items: { type: "string" } },

    whyThink: { type: "string" },

    examplesFromAnswers: { type: "array", items: { type: "string" } },

    whatToWorkNext: { type: "array", items: { type: "string" } },

    recommendedMissionTitle: { type: "string" },

    celebrationMessage: { type: "string" },

    progressHighlight: { type: "string" },

  },

  required: [

    "strengths",

    "improvements",

    "levelEstimated",

    "confidence",

    "nextAction",

    "skillValidated",

    "summary",

    "observations",

    "whyThink",

    "examplesFromAnswers",

    "whatToWorkNext",

    "recommendedMissionTitle",

    "celebrationMessage",

    "progressHighlight",

  ],

};



export async function generateMissionDebrief(

  ctx: MissionContext,

  messages: MissionChatMessage[],

  proofText = "",

  options?: {

    proofMatrix?: SkillProofMatrix;

    behaviorTurns?: BehaviorTurnObservation[];

  },

): Promise<MissionDebrief> {

  const transcript = messages

    .map((m) => {

      const who =

        m.role === "user" ? "Apprenant" : m.kind === "coach" ? "Coach EDGE" : ctx.mission.coachRole;

      return `${who} : ${m.content}`;

    })

    .join("\n");



  const gaugeInfo = ctx.gaugeState ? gaugesBlockForPrompt(ctx.gaugeState) : "";

  const behaviorPrompt = options?.proofMatrix

    ? debriefSystemPromptWithBehaviors(ctx, options.proofMatrix)

    : "Coach EDGE bienveillant. JSON uniquement.";



  const raw = await generateJSON(

    `${behaviorPrompt}\n\nAnalyse cette Mission EDGE terminée.\n${missionBlock(ctx)}\n${gaugeInfo ? `Jauges finales :\n${gaugeInfo}` : ""}\nPreuve : ${proofText || "aucune"}\nTranscript :\n${transcript}`,

    DEBRIEF_SCHEMA,

    behaviorPrompt,

  );



  if (!raw || typeof raw !== "object") {

    const fallback = fallbackDebrief(ctx, messages, proofText);

    if (options?.proofMatrix) {

      return buildBehaviorDebrief(ctx, messages, options.proofMatrix, options.behaviorTurns ?? [], fallback);

    }

    return fallback;

  }



  const fallbackLevel = ctx.levelCurrent && LEVELS.includes(ctx.levelCurrent) ? ctx.levelCurrent : "Intermédiaire";

  const progressHighlight = String(raw.progressHighlight ?? ctx.skillName).slice(0, 120);



  const baseDebrief: MissionDebrief = {

    strengths: Array.isArray(raw.strengths) ? raw.strengths.map(String).slice(0, 4) : [],

    improvements: Array.isArray(raw.improvements) ? raw.improvements.map(String).slice(0, 4) : [],

    levelEstimated: clampLevel(String(raw.levelEstimated ?? ""), fallbackLevel),

    confidence: Math.max(0, Math.min(100, Math.round(Number(raw.confidence) || 60))),

    nextAction: String(raw.nextAction ?? ""),

    skillValidated: options?.proofMatrix?.isValidated ?? Boolean(raw.skillValidated),

    summary: String(raw.summary ?? "").slice(0, 500),

    observations: Array.isArray(raw.observations) ? raw.observations.map(String).slice(0, 4) : [],

    whyThink: String(raw.whyThink ?? "").slice(0, 500),

    examplesFromAnswers: Array.isArray(raw.examplesFromAnswers)

      ? raw.examplesFromAnswers.map(String).slice(0, 3)

      : [],

    whatToWorkNext: Array.isArray(raw.whatToWorkNext) ? raw.whatToWorkNext.map(String).slice(0, 4) : [],

    recommendedMissionTitle: String(raw.recommendedMissionTitle ?? "").slice(0, 120),

    celebrationMessage: String(raw.celebrationMessage ?? buildCelebration(ctx, progressHighlight)).slice(0, 600),

    progressHighlight,

  };



  if (options?.proofMatrix) {

    return buildBehaviorDebrief(

      ctx,

      messages,

      options.proofMatrix,

      options.behaviorTurns ?? [],

      baseDebrief,

    );

  }



  return baseDebrief;

}



const MISSION_BASE_XP = 50;

const PROOF_BONUS_XP = 20;



export function computeMissionXp(hasProof: boolean): number {

  return MISSION_BASE_XP + (hasProof ? PROOF_BONUS_XP : 0);

}



export type { CoachMemory };


