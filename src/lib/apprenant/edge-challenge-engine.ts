/**
 * Moteur IA du Défi EDGE (serveur).
 *
 * Objectif : un entretien interactif, jamais un questionnaire figé. L'IA
 * adapte ses questions (raconter une expérience, justifier une décision,
 * convaincre, jouer un recruteur/client/manager) puis produit un débrief
 * structuré + un niveau estimé. Tout fonctionne aussi en mode dégradé
 * (sans clé OpenAI) pour rester testable.
 */

import { getOpenAIClient, generateJSON } from "@/lib/ai/openai-client";
import type {
  ChallengeChatMessage,
  ChallengeContext,
  ChallengeDebrief,
  ChallengeFormatId,
} from "@/lib/apprenant/edge-challenge-types";

const LEVELS = ["Débutant", "Intermédiaire", "Confirmé", "Expert"];

const FORMAT_INSTRUCTIONS: Record<ChallengeFormatId, string> = {
  story:
    "Demande à la personne de RACONTER une expérience vécue et concrète liée à cette compétence. Relance sur les détails (contexte, actions précises, résultat).",
  situation:
    "Propose une SITUATION PROFESSIONNELLE réaliste et demande comment la personne réagirait, puis challenge sa réponse avec une contrainte ou une objection.",
  proof:
    "Demande à la personne de décrire une PREUVE concrète (résultat chiffré, projet, livrable) et de justifier en quoi elle démontre la compétence.",
  video:
    "Défi à l'oral simulé en texte : demande une prise de parole structurée (comme si c'était filmé), puis fais un retour sur la clarté et la structure.",
  ai:
    "Mène un ENTRETIEN dynamique : alterne questions ouvertes, demandes d'exemple concret et relances. Ne répète jamais deux fois la même question.",
  quickchallenge:
    "Lance un DÉFI minuté de 10 minutes : une mise en situation précise avec une consigne claire et un objectif à atteindre.",
};

const ROLEPLAY_ANGLES = [
  "Joue un recruteur exigeant mais bienveillant.",
  "Joue un client sceptique qu'il faut convaincre.",
  "Joue un manager qui demande de justifier une décision.",
  "Adopte la posture d'un coach qui pousse à approfondir.",
];

function pickAngle(ctx: ChallengeContext): string {
  let hash = 0;
  const seed = `${ctx.skillName}${ctx.format}`;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i)) % ROLEPLAY_ANGLES.length;
  return ROLEPLAY_ANGLES[hash];
}

export function buildSystemPrompt(ctx: ChallengeContext): string {
  return `Tu es EDGE, un coach IA qui fait progresser une personne sur une compétence précise.
Tu n'es PAS un examinateur : tu accompagnes, tu challenges avec bienveillance, tu personnalises.

Compétence travaillée : ${ctx.skillName}
Objectif professionnel de la personne : ${ctx.objective || "non précisé"}
Niveau actuel estimé : ${ctx.levelCurrent || "à évaluer"}
Niveau visé : ${ctx.levelExpected || "supérieur"}

Format du défi : ${FORMAT_INSTRUCTIONS[ctx.format]}
${pickAngle(ctx)}

Règles :
- Pose UNE seule question ou consigne à la fois, courte (2-4 phrases max).
- Ne répète jamais une question déjà posée ; rebondis toujours sur la réponse précédente.
- Reste concret : demande des exemples, des chiffres, des situations réelles.
- Français, ton chaleureux et motivant, tutoiement.
- Ne donne PAS le débrief final ici (il sera généré séparément).`;
}

function buildOpeningPrompt(ctx: ChallengeContext): string {
  return `Démarre le défi sur la compétence « ${ctx.skillName} ». Accueille brièvement la personne, explique en une phrase l'enjeu, puis pose ta première question ou consigne selon le format.`;
}

/* ------------------------------ Mode dégradé ------------------------------ */

const FALLBACK_QUESTIONS: Record<ChallengeFormatId, string[]> = {
  story: [
    "Raconte-moi une situation récente où tu as mobilisé cette compétence. Que s'est-il passé ?",
    "Quelles actions précises as-tu menées, étape par étape ?",
    "Quel a été le résultat concret, et qu'en as-tu retiré ?",
  ],
  situation: [
    "Voici une situation : un dossier important prend du retard et l'équipe est tendue. Comment réagis-tu ?",
    "Et si un collègue conteste ta décision devant les autres, que fais-tu ?",
    "Quel indicateur te dirait que tu as bien géré la situation ?",
  ],
  proof: [
    "Décris une réalisation concrète qui démontre cette compétence (projet, résultat chiffré…).",
    "En quoi cette réalisation prouve-t-elle précisément la compétence ?",
    "Qu'aurais-tu pu améliorer pour aller encore plus loin ?",
  ],
  video: [
    "Présente-toi en 30 secondes comme si tu passais un entretien pour un poste clé.",
    "Structure maintenant ton argument principal en 3 points.",
    "Conclus par un message fort et mémorable.",
  ],
  ai: [
    "Pour commencer, comment définirais-tu cette compétence avec tes propres mots ?",
    "Donne-moi un exemple concret où elle a fait la différence pour toi.",
    "Qu'est-ce qui te reste le plus difficile sur ce sujet aujourd'hui ?",
  ],
  quickchallenge: [
    "Défi 10 min : tu dois convaincre un décideur en 3 arguments. Quel est ton premier argument ?",
    "Bien. Quel serait le contre-argument le plus dur, et comment y réponds-tu ?",
    "Termine par ta phrase de closing la plus percutante.",
  ],
};

function fallbackReply(ctx: ChallengeContext, messages: ChallengeChatMessage[]): string {
  const userTurns = messages.filter((m) => m.role === "user").length;
  const questions = FALLBACK_QUESTIONS[ctx.format];
  if (messages.length === 0) {
    return `Prêt pour ton Défi EDGE sur « ${ctx.skillName} » ? ${questions[0]}`;
  }
  const idx = Math.min(userTurns, questions.length - 1);
  return questions[idx];
}

/* ------------------------------ Coach reply ------------------------------- */

export async function getCoachReply(
  ctx: ChallengeContext,
  messages: ChallengeChatMessage[],
): Promise<string> {
  const client = getOpenAIClient();
  if (!client) return fallbackReply(ctx, messages);

  try {
    const openAiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: buildSystemPrompt(ctx) },
    ];
    if (messages.length === 0) {
      openAiMessages.push({ role: "user", content: buildOpeningPrompt(ctx) });
    } else {
      for (const m of messages) {
        openAiMessages.push({ role: m.role, content: String(m.content ?? "").slice(0, 4000) });
      }
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAiMessages,
      max_tokens: 320,
      temperature: 0.8,
    });
    const text = String(completion.choices[0]?.message?.content ?? "").trim();
    return text || fallbackReply(ctx, messages);
  } catch (error) {
    console.error("[edge-challenge] coach reply error", error);
    return fallbackReply(ctx, messages);
  }
}

/* -------------------------------- Débrief -------------------------------- */

function clampLevel(level: string, fallback: string): string {
  const found = LEVELS.find((l) => l.toLowerCase() === level.trim().toLowerCase());
  return found ?? fallback ?? "Intermédiaire";
}

function nextLevel(level: string): string {
  const idx = LEVELS.indexOf(level);
  if (idx < 0 || idx >= LEVELS.length - 1) return level;
  return LEVELS[idx + 1];
}

function fallbackDebrief(
  ctx: ChallengeContext,
  messages: ChallengeChatMessage[],
  proofText: string,
): ChallengeDebrief {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");
  const richness = (userText + proofText).length;
  const base = ctx.levelCurrent && LEVELS.includes(ctx.levelCurrent) ? ctx.levelCurrent : "Intermédiaire";
  const estimated = richness > 400 ? nextLevel(base) : base;
  const confidence = Math.min(90, 55 + Math.floor(richness / 40));
  const validated = richness > 500 && estimated !== "Débutant";
  return {
    strengths: [
      "Tu as pris le temps d'illustrer avec des éléments concrets.",
      "Ton raisonnement est structuré et orienté résultat.",
    ],
    improvements: [
      "Quantifie davantage tes résultats (chiffres, impact).",
      "Anticipe les objections pour renforcer ta démonstration.",
    ],
    levelEstimated: estimated,
    confidence,
    nextAction: `Relève un nouveau Défi EDGE sur « ${ctx.skillName} » pour consolider ce niveau.`,
    skillValidated: validated,
    summary: `Défi ${ctx.format} sur « ${ctx.skillName} » : ${richness > 400 ? "démonstration solide" : "première démonstration"} avec des exemples concrets.`,
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
  },
  required: [
    "strengths",
    "improvements",
    "levelEstimated",
    "confidence",
    "nextAction",
    "skillValidated",
    "summary",
  ],
};

export async function generateDebrief(
  ctx: ChallengeContext,
  messages: ChallengeChatMessage[],
  proofText = "",
): Promise<ChallengeDebrief> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Apprenant" : "Coach"} : ${m.content}`)
    .join("\n");

  const prompt = `Voici un entretien de Défi EDGE sur la compétence « ${ctx.skillName} ».
Objectif professionnel : ${ctx.objective || "non précisé"}
Niveau de départ : ${ctx.levelCurrent || "à évaluer"} — niveau visé : ${ctx.levelExpected || "supérieur"}
Preuve déposée : ${proofText || "aucune"}

Entretien :
${transcript}

Analyse la performance et renvoie un débrief. Le niveau estimé doit être l'un de : Débutant, Intermédiaire, Confirmé, Expert. La confidence est un entier 0-100. skillValidated = true seulement si la démonstration est claire et suffisante. Les listes strengths/improvements contiennent 2 à 4 éléments concrets et personnalisés. summary sert de preuve exploitable (2 phrases).`;

  const raw = await generateJSON(
    prompt,
    DEBRIEF_SCHEMA,
    "Tu es un évaluateur EDGE bienveillant. Tu renvoies UNIQUEMENT un JSON valide correspondant au schéma.",
  );

  if (!raw || typeof raw !== "object") {
    return fallbackDebrief(ctx, messages, proofText);
  }

  const fallbackLevel = ctx.levelCurrent && LEVELS.includes(ctx.levelCurrent) ? ctx.levelCurrent : "Intermédiaire";
  return {
    strengths: Array.isArray(raw.strengths) ? raw.strengths.map(String).slice(0, 4) : [],
    improvements: Array.isArray(raw.improvements) ? raw.improvements.map(String).slice(0, 4) : [],
    levelEstimated: clampLevel(String(raw.levelEstimated ?? ""), fallbackLevel),
    confidence: Math.max(0, Math.min(100, Math.round(Number(raw.confidence) || 60))),
    nextAction: String(raw.nextAction ?? `Relève un nouveau Défi EDGE sur « ${ctx.skillName} ».`),
    skillValidated: Boolean(raw.skillValidated),
    summary: String(raw.summary ?? "").slice(0, 500) || `Défi sur « ${ctx.skillName} ».`,
  };
}

/* ---------------------------------- XP ----------------------------------- */

const FORMAT_BASE_XP: Record<ChallengeFormatId, number> = {
  story: 50,
  situation: 60,
  proof: 55,
  video: 70,
  ai: 50,
  quickchallenge: 65,
};

export function computeChallengeXp(format: ChallengeFormatId, debrief: ChallengeDebrief): number {
  let xp = FORMAT_BASE_XP[format] ?? 50;
  const levelIdx = LEVELS.indexOf(debrief.levelEstimated);
  if (levelIdx > 0) xp += levelIdx * 15;
  if (debrief.skillValidated) xp += 40;
  if (debrief.confidence >= 80) xp += 15;
  return xp;
}
