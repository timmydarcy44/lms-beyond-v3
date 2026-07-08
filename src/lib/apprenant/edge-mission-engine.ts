/**
 * Moteur IA Mission EDGE — coach scénarisé avec personnalité, mémoire et transparence.
 */

import { getOpenAIClient, generateJSON } from "@/lib/ai/openai-client";
import { memoryBlockForPrompt, type CoachMemory } from "@/lib/apprenant/edge-coach-memory";
import type {
  CoachInsight,
  MissionChatMessage,
  MissionCoachReply,
  MissionContext,
  MissionDebrief,
} from "@/lib/apprenant/edge-mission-types";

const LEVELS = ["Débutant", "Intermédiaire", "Confirmé", "Expert"];

function missionBlock(ctx: MissionContext): string {
  const m = ctx.mission;
  return `MISSION : « ${m.title} »
Objectif pédagogique : ${m.pedagogicalObjective}
Compétence principale : ${m.primarySkill}
Compétences secondaires : ${m.secondarySkills.join(", ")}
Contexte : ${m.context}
Histoire : ${m.story}
Personnages : ${m.characters.join(" · ")}
Ton rôle (in-character) : ${m.coachRole}
Objectif de la mission : ${m.missionGoal}
Critères de réussite : ${m.successCriteria.join(" ; ")}`;
}

function memorySection(ctx: MissionContext): string {
  if (!ctx.coachMemory) return "";
  return `\nMÉMOIRE COACH (utilise pour personnaliser, faire référence au passé) :\n${memoryBlockForPrompt(ctx.coachMemory)}`;
}

export function buildMissionSystemPrompt(ctx: MissionContext): string {
  const name = ctx.coachMemory?.firstName ?? "l'apprenant";
  return `Tu es le Coach EDGE — un coach personnel IA qui accompagne ${name === "toi" ? "l'apprenant" : name}.
Tu as DEUX voix distinctes dans chaque réponse JSON :

1. coachIntro / coachInsight = toi, le Coach EDGE (hors scène). Tu parles naturellement, avec chaleur et mémoire. Tu expliques, tu encourages, tu es transparent.
2. sceneReply = le personnage ${ctx.mission.coachRole} DANS la scène. Dialogue in-character uniquement.

${missionBlock(ctx)}
${memorySection(ctx)}

Objectif professionnel : ${ctx.objective || "non précisé"}
Niveau actuel : ${ctx.levelCurrent || "à évaluer"}

RÈGLES :
- JAMAIS de question hors contexte dans sceneReply.
- sceneReply : situer la scène, émotions, enjeux, puis objection ou situation (2-4 phrases).
- coachIntro (1er message) : salutation personnalisée avec mémoire si disponible, puis annonce la mission.
- coachInsight (après réponse apprenant) : transparence IA obligatoire avec whyAsked, whatObserved, whyThink, howEvaluated.
- Fais référence aux missions passées quand pertinent ("la semaine dernière…", "comme lors de ta mission…").
- Après 2-3 échanges, complique la situation dans sceneReply.
- Tutoiement, ton premium adulte. Jamais de débrief final ici.`;
}

const REPLY_SCHEMA = {
  type: "object",
  properties: {
    coachIntro: { type: "string" },
    coachInsight: {
      type: "object",
      properties: {
        whyAsked: { type: "string" },
        whatObserved: { type: "string" },
        whyThink: { type: "string" },
        howEvaluated: { type: "string" },
      },
      required: ["whyAsked", "whatObserved", "whyThink", "howEvaluated"],
    },
    sceneReply: { type: "string" },
  },
  required: ["sceneReply"],
};

function buildOpeningUserPrompt(ctx: MissionContext): string {
  return `Ouvre la mission « ${ctx.mission.title} ».
Renvoie coachIntro (message personnel du Coach EDGE, avec mémoire si disponible) ET sceneReply (première réplique in-character de ${ctx.mission.coachRole}).
sceneReply : situe la scène avec émotions et enjeux, puis lance la première objection.`;
}

function buildTurnUserPrompt(ctx: MissionContext, lastUserMessage: string): string {
  return `L'apprenant vient de répondre :
« ${lastUserMessage.slice(0, 800)} »

Renvoie coachInsight (transparent : pourquoi tu as posé la question, ce que tu observes, pourquoi tu le penses, comment tu l'évalues) ET sceneReply (réaction in-character + prochaine situation).
Si pertinent, compare avec ses missions passées.`;
}

/* ------------------------------ Mode dégradé ------------------------------ */

function fallbackCoachIntro(ctx: MissionContext): string {
  const m = ctx.coachMemory;
  if (!m?.lastMission) {
    return "Bienvenue dans cette mission. Je vais t'accompagner pas à pas — après chaque réponse, je t'expliquerai ce que j'observe et pourquoi.";
  }
  return `Content de te retrouver. On continue sur ${ctx.mission.primarySkill} — tu progresses bien depuis ta dernière mission.`;
}

const FALLBACK_SCENE_OPENING = (ctx: MissionContext) =>
  `${ctx.mission.context}

Tu es face à ${ctx.mission.coachRole}. L'atmosphère est tendue — la décision doit être prise rapidement.

Il croise les bras et dit :
« Votre solution est intéressante, mais franchement, c'est beaucoup trop cher pour notre budget. »

Que réponds-tu ?`;

const FALLBACK_INSIGHTS: CoachInsight[] = [
  {
    whyAsked: "Je voulais voir comment tu réagis face à une objection prix — c'est un classique en situation professionnelle.",
    whatObserved: "Tu as répondu sur le prix sans fuir le sujet.",
    whyThink: "C'est un bon réflexe, mais tu n'as pas encore cherché à comprendre le besoin réel derrière l'objection.",
    howEvaluated: "J'ai regardé si tu questionnais avant d'argumenter, et si tu restais dans le contexte de la scène.",
  },
  {
    whyAsked: "J'ai voulu tester ta capacité à structurer un argument sous pression.",
    whatObserved: "Tu commences à structurer ton argument de façon plus claire.",
    whyThink: "Tu prends davantage le temps de comprendre ton interlocuteur qu'en début de mission.",
    howEvaluated: "Je compare la clarté et la progression de tes réponses depuis le début de l'échange.",
  },
  {
    whyAsked: "C'était le moment de conclure — voir si tu obtiens l'objectif de la mission.",
    whatObserved: "Tu as tenté de conclure l'échange de manière professionnelle.",
    whyThink: "Tu montres une vraie volonté d'obtenir ce deuxième rendez-vous.",
    howEvaluated: "J'évalue ta capacité à proposer une prochaine étape concrète sans être insistant.",
  },
];

const FALLBACK_SCENE_TURNS = [
  "Il hausse un sourcil. « Et vos concurrents proposent 30 % de moins. Pourquoi je vous choisirais ? »",
  "Il consulte sa montre. « Montrez-moi le retour sur investissement en 6 mois. Un chiffre, pas des promesses. »",
  "Il se lève presque. « Dernière question : pourquoi un deuxième rendez-vous changerait-il ma décision ? »",
];

function fallbackCoachReply(ctx: MissionContext, messages: MissionChatMessage[]): MissionCoachReply {
  const userTurns = messages.filter((m) => m.role === "user").length;
  if (messages.length === 0) {
    return {
      coachIntro: fallbackCoachIntro(ctx),
      sceneReply: FALLBACK_SCENE_OPENING(ctx),
    };
  }
  const idx = Math.min(userTurns - 1, FALLBACK_SCENE_TURNS.length - 1);
  const insight = FALLBACK_INSIGHTS[Math.max(0, idx)];
  const scene = FALLBACK_SCENE_TURNS[Math.max(0, idx)];
  const memoryNote =
    ctx.coachMemory?.lastMission && userTurns === 1
      ? ` Je retrouve une dynamique différente de ta mission ${ctx.coachMemory.lastMission.skill} — tu sembles plus posé.`
      : "";
  return {
    coachInsight: {
      ...insight,
      whyThink: insight.whyThink + memoryNote,
    },
    sceneReply: scene,
  };
}

function parseCoachReply(raw: Record<string, unknown>, ctx: MissionContext, messages: MissionChatMessage[]): MissionCoachReply {
  const sceneReply = String(raw.sceneReply ?? "").trim();
  if (!sceneReply) return fallbackCoachReply(ctx, messages);

  const result: MissionCoachReply = { sceneReply };

  const intro = String(raw.coachIntro ?? "").trim();
  if (intro) result.coachIntro = intro.slice(0, 600);

  const insight = raw.coachInsight;
  if (insight && typeof insight === "object") {
    const i = insight as Record<string, unknown>;
    result.coachInsight = {
      whyAsked: String(i.whyAsked ?? "").slice(0, 400),
      whatObserved: String(i.whatObserved ?? "").slice(0, 400),
      whyThink: String(i.whyThink ?? "").slice(0, 400),
      howEvaluated: String(i.howEvaluated ?? "").slice(0, 400),
    };
  }

  return result;
}

/* ------------------------------ Coach reply ------------------------------- */

export async function getMissionCoachReply(
  ctx: MissionContext,
  messages: MissionChatMessage[],
): Promise<MissionCoachReply> {
  const client = getOpenAIClient();
  if (!client) return fallbackCoachReply(ctx, messages);

  try {
    const isOpening = messages.length === 0;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");

    const userPrompt = isOpening
      ? buildOpeningUserPrompt(ctx)
      : buildTurnUserPrompt(ctx, lastUser?.content ?? "");

    const transcript = messages
      .map((m) => {
        const who = m.role === "user" ? "Apprenant" : m.kind === "coach" ? "Coach EDGE" : ctx.mission.coachRole;
        return `${who} : ${m.content}`;
      })
      .join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildMissionSystemPrompt(ctx) },
        ...(transcript ? [{ role: "user" as const, content: `Historique :\n${transcript}` }] : []),
        {
          role: "user",
          content: `${userPrompt}\n\nRenvoie UNIQUEMENT un JSON valide avec les champs demandés.`,
        },
      ],
      max_tokens: 520,
      temperature: 0.82,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return fallbackCoachReply(ctx, messages);
    }
    return parseCoachReply(parsed, ctx, messages);
  } catch (error) {
    console.error("[edge-mission] coach reply error", error);
    return fallbackCoachReply(ctx, messages);
  }
}

/* -------------------------------- Débrief -------------------------------- */

function clampLevel(level: string, fallback: string): string {
  const found = LEVELS.find((l) => l.toLowerCase() === level.trim().toLowerCase());
  return found ?? fallback ?? "Intermédiaire";
}

function buildCelebration(ctx: MissionContext, progressHighlight: string): string {
  const name = ctx.coachMemory?.firstName;
  const greeting = name && name !== "toi" ? `Bravo ${name}.` : "Bravo.";
  return `${greeting}\n\nTu viens de terminer « ${ctx.mission.title} ».\n\nAujourd'hui tu as particulièrement progressé sur ${progressHighlight}. Je suis fier de voir cette évolution.`;
}

function fallbackDebrief(
  ctx: MissionContext,
  messages: MissionChatMessage[],
  proofText: string,
): MissionDebrief {
  const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content);
  const richness = userMsgs.join(" ").length + proofText.length;
  const base = ctx.levelCurrent && LEVELS.includes(ctx.levelCurrent) ? ctx.levelCurrent : "Intermédiaire";
  const confidence = Math.min(88, 55 + Math.floor(richness / 45));
  const validated = richness > 450;
  const progressHighlight = ctx.mission.primarySkill;

  return {
    strengths: [
      "Tu as su rester dans le contexte de la mission et répondre de manière professionnelle.",
      "Tu as montré une volonté de structurer ta réponse face à l'objection.",
    ],
    improvements: [
      "Creuser davantage le besoin de l'interlocuteur avant de défendre ton prix.",
      "Appuyer ton argumentation sur des chiffres ou des preuves concrètes.",
    ],
    levelEstimated: base,
    confidence,
    nextAction: `Poursuivre avec une nouvelle Mission EDGE sur « ${ctx.skillName} » pour consolider.`,
    skillValidated: validated,
    summary: `Mission « ${ctx.mission.title} » : échanges contextualisés sur ${ctx.skillName}.`,
    observations: [
      "Tu as répondu directement à l'objection prix sans fuir le sujet.",
      "Tu pourrais davantage questionner avant d'argumenter.",
    ],
    whyThink:
      "Ces observations s'appuient sur la façon dont tu as répondu aux objections et structuré ton argumentaire dans la mission.",
    examplesFromAnswers: userMsgs.slice(0, 2).map((t) => `« ${t.slice(0, 120)}${t.length > 120 ? "…" : ""} »`),
    whatToWorkNext: ["Quantifier la valeur de ta proposition", "Pratiquer la reformulation du besoin client"],
    recommendedMissionTitle: `Affronter une nouvelle objection en ${ctx.skillName}`,
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
): Promise<MissionDebrief> {
  const transcript = messages
    .map((m) => {
      const who = m.role === "user" ? "Apprenant" : m.kind === "coach" ? "Coach EDGE" : ctx.mission.coachRole;
      return `${who} : ${m.content}`;
    })
    .join("\n");

  const memory = ctx.coachMemory ? memoryBlockForPrompt(ctx.coachMemory) : "";

  const prompt = `Analyse cette Mission EDGE terminée.

${missionBlock(ctx)}
${memory ? `Mémoire coach :\n${memory}` : ""}
Preuve déposée : ${proofText || "aucune"}

Transcript :
${transcript}

Renvoie un débrief enrichi en français. levelEstimated ∈ {Débutant, Intermédiaire, Confirmé, Expert}.
skillValidated = true seulement si démonstration solide.
celebrationMessage = message personnel chaleureux ("Bravo…", "Tu viens de terminer…", "Aujourd'hui tu as progressé sur…").
progressHighlight = compétence ou axe sur lequel l'apprenant a le plus progressé aujourd'hui.
Cite des extraits dans examplesFromAnswers.`;

  const raw = await generateJSON(
    prompt,
    DEBRIEF_SCHEMA,
    "Tu es le Coach EDGE, bienveillant et personnel. JSON uniquement.",
  );

  if (!raw || typeof raw !== "object") {
    return fallbackDebrief(ctx, messages, proofText);
  }

  const fallbackLevel = ctx.levelCurrent && LEVELS.includes(ctx.levelCurrent) ? ctx.levelCurrent : "Intermédiaire";
  const progressHighlight = String(raw.progressHighlight ?? ctx.skillName).slice(0, 120);

  return {
    strengths: Array.isArray(raw.strengths) ? raw.strengths.map(String).slice(0, 4) : [],
    improvements: Array.isArray(raw.improvements) ? raw.improvements.map(String).slice(0, 4) : [],
    levelEstimated: clampLevel(String(raw.levelEstimated ?? ""), fallbackLevel),
    confidence: Math.max(0, Math.min(100, Math.round(Number(raw.confidence) || 60))),
    nextAction: String(raw.nextAction ?? `Nouvelle Mission EDGE sur « ${ctx.skillName} ».`),
    skillValidated: Boolean(raw.skillValidated),
    summary: String(raw.summary ?? "").slice(0, 500),
    observations: Array.isArray(raw.observations) ? raw.observations.map(String).slice(0, 4) : [],
    whyThink: String(raw.whyThink ?? "").slice(0, 500),
    examplesFromAnswers: Array.isArray(raw.examplesFromAnswers)
      ? raw.examplesFromAnswers.map(String).slice(0, 3)
      : [],
    whatToWorkNext: Array.isArray(raw.whatToWorkNext) ? raw.whatToWorkNext.map(String).slice(0, 4) : [],
    recommendedMissionTitle: String(raw.recommendedMissionTitle ?? `Mission ${ctx.skillName}`).slice(0, 120),
    celebrationMessage: String(raw.celebrationMessage ?? buildCelebration(ctx, progressHighlight)).slice(0, 600),
    progressHighlight,
  };
}

/* ---------------------------------- XP ----------------------------------- */

const MISSION_BASE_XP = 50;
const PROOF_BONUS_XP = 20;

export function computeMissionXp(hasProof: boolean): number {
  return MISSION_BASE_XP + (hasProof ? PROOF_BONUS_XP : 0);
}

export type { CoachMemory };
