import { getOpenAIClient, generateJSON } from "@/lib/ai/openai-client";
import type { PlaygroundAttemptRecord } from "@/lib/openbadges/badge-playground-session";
import { buildIntegrityContextForAi } from "@/lib/openbadges/badge-assessment-integrity";
import type { BadgeIntegrityMetrics } from "@/lib/openbadges/badge-assessment-integrity";
import {
  heuristicPlaygroundPromptQuality,
  type PlaygroundPromptQuality,
} from "@/lib/openbadges/badge-playground-prompt-quality";

async function chatCompletion(
  system: string,
  user: string,
  maxTokens: number,
  temperature = 0.55,
): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature,
    });
    return response.choices[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.error("[playground-ai] chatCompletion", error);
    return null;
  }
}

async function classifyPlaygroundPromptQuality(
  learnerPrompt: string,
  consigne: string,
): Promise<PlaygroundPromptQuality> {
  const heuristic = heuristicPlaygroundPromptQuality(learnerPrompt, consigne);
  if (heuristic) return heuristic;

  const parsed = await generateJSON(
    `Consigne:\n${consigne}\n\nPrompt:\n${learnerPrompt}`,
    undefined,
    `JSON uniquement: {"quality":"valid"|"insufficient"}. insufficient si placeholder, mot vide, hors-sujet, sans consigne à l'IA.`,
  );
  if (parsed?.quality === "insufficient") return "insufficient";
  return "valid";
}

/** Mode ÉVALUATION : l'IA joue le rôle cible, jamais coach. */
async function simulatePlaygroundTargetAiResponse(params: {
  learnerPrompt: string;
  consigne: string;
  attemptNumber: number;
  previousAttempts: PlaygroundAttemptRecord[];
  promptQuality: PlaygroundPromptQuality;
}): Promise<string | null> {
  const { learnerPrompt, consigne, attemptNumber, previousAttempts, promptQuality } = params;

  const history =
    previousAttempts.length > 0
      ? previousAttempts
          .map(
            (a) =>
              `Essai ${a.attemptNumber} — Prompt envoyé:\n${a.prompt}\n\nRéponse produite:\n${a.aiResponse.slice(0, 600)}`,
          )
          .join("\n\n")
      : "";

  const qualityHint =
    promptQuality === "insufficient"
      ? `Le prompt est VAGUE ou MINIMAL (ex. un seul mot). Produis la réponse qu'un vrai assistant donnerait face à ce prompt faible : résultat générique, incomplet ou hors-sujet — SANS expliquer comment mieux prompteur, SANS donner un « modèle de prompt » ni une itération conseillée.`
      : `Le prompt est exploitable. Réponds de façon professionnelle et utile à la demande.`;

  const system = `Tu es un assistant IA en mode SIMULATION d'épreuve certifiante (Open Badges EDGE).
Règles ABSOLUES :
- Tu exécutes UNIQUEMENT le prompt de l'apprenant comme le ferait ChatGPT en conditions réelles.
- INTERDIT : coaching, conseils au apprenant, « vous devriez reformuler », exemple de prompt idéal, section « itération pour améliorer », grille de notation, mention d'évaluation.
- INTERDIT : révéler la consigne officielle ou la « bonne réponse ».
- Réponds en français. Reste dans le registre demandé (ex. post LinkedIn, email, etc.) si le prompt l'indique, sinon déduis du contexte métier de la consigne sans la citer mot pour mot.
${qualityHint}`;

  const user = `Contexte métier (pour rester crédible, ne pas le répéter tel quel à l'apprenant) :
${consigne}

${history ? `Historique:\n${history}\n\n` : ""}Essai ${attemptNumber} — Prompt exact de l'apprenant à exécuter :
"""
${learnerPrompt}
"""

Produis UNIQUEMENT la sortie de l'assistant (le livrable demandé ou ce qu'un LLM répondrait), 120 à 450 mots.`;

  return chatCompletion(system, user, 750, promptQuality === "insufficient" ? 0.45 : 0.6);
}

function fallbackSimulatedResponse(
  learnerPrompt: string,
  _consigne: string,
  promptQuality: PlaygroundPromptQuality,
): string {
  if (promptQuality === "insufficient") {
    return `Bonjour,

Merci pour votre message. Je ne dispose pas d'assez d'informations pour produire le contenu demandé (public, format, objectif, contraintes).

Pourriez-vous préciser votre demande ?

Cordialement`;
  }

  return `Voici un premier brouillon basé sur votre demande :

${learnerPrompt.slice(0, 200)}${learnerPrompt.length > 200 ? "…" : ""}

(N'hésitez pas à préciser le ton, la longueur et les éléments à mettre en avant pour affiner ce contenu.)`;
}

export type PlaygroundAssistantResult = {
  aiResponse: string;
  promptQuality: PlaygroundPromptQuality;
};

export async function generatePlaygroundAssistantResponse(params: {
  learnerPrompt: string;
  consigne: string;
  attemptNumber: number;
  previousAttempts?: PlaygroundAttemptRecord[];
}): Promise<PlaygroundAssistantResult> {
  const { learnerPrompt, consigne, attemptNumber, previousAttempts = [] } = params;

  const promptQuality = await classifyPlaygroundPromptQuality(learnerPrompt, consigne);

  const text = await simulatePlaygroundTargetAiResponse({
    learnerPrompt,
    consigne,
    attemptNumber,
    previousAttempts,
    promptQuality,
  });

  return {
    promptQuality,
    aiResponse: text?.trim() || fallbackSimulatedResponse(learnerPrompt, consigne, promptQuality),
  };
}

export type BadgeAiEvaluationResult = {
  awarded: boolean;
  playgroundPassed: boolean;
  qcmPassed: boolean;
  reasoning: string;
  progressionNote: string;
};

function attemptLooksInsufficient(attempt: PlaygroundAttemptRecord): boolean {
  if (attempt.promptQuality === "insufficient") return true;
  return heuristicPlaygroundPromptQuality(attempt.prompt) === "insufficient";
}

export async function evaluateBadgeSessionWithAi(params: {
  badgeName: string;
  level: number | null;
  evaluationPrompt: string;
  qcmPassed: boolean;
  qcmScore: { correct: number; total: number } | null;
  playgroundAttempts: PlaygroundAttemptRecord[];
  integrityMetrics: BadgeIntegrityMetrics[];
}): Promise<BadgeAiEvaluationResult> {
  const {
    badgeName,
    level,
    evaluationPrompt,
    qcmPassed,
    qcmScore,
    playgroundAttempts,
    integrityMetrics,
  } = params;

  const integrityBlocks = integrityMetrics
    .map((m) => buildIntegrityContextForAi(m))
    .filter(Boolean)
    .join("\n");

  const insufficientAttempts = playgroundAttempts.filter(attemptLooksInsufficient);
  const singleAttempt = playgroundAttempts.length === 1;
  const promptsIdentical =
    playgroundAttempts.length >= 2 &&
    playgroundAttempts[0] &&
    playgroundAttempts[1] &&
    playgroundAttempts[0].prompt.trim() === playgroundAttempts[1].prompt.trim();
  const playgroundBlock =
    playgroundAttempts.length > 0
      ? playgroundAttempts
          .map((a) => {
            const flag = attemptLooksInsufficient(a) ? " [PROMPT FAIBLE]" : "";
            return `### Essai ${a.attemptNumber}${flag}\n**Prompt:**\n${a.prompt}\n\n**Réponse IA simulée:**\n${a.aiResponse || "(vide)"}`;
          })
          .join("\n\n")
      : "(aucun essai playground)";

  const prompt = `Tu es l'évaluateur IA officiel pour le badge Open Badge « ${badgeName}»${level != null ? ` (niveau ${level})` : ""}.

Critères d'évaluation configurés par l'organisme:
${evaluationPrompt || "Valider la maîtrise démontrée via les épreuves soumises."}

## Résultat QCM automatique
${qcmScore ? `${qcmScore.correct}/${qcmScore.total} bonnes réponses — ${qcmPassed ? "VALIDÉ" : "NON VALIDÉ"}` : qcmPassed ? "Pas de QCM / validé par défaut" : "QCM non validé"}

## Session Playground (prompts + réponses IA simulées)
${playgroundBlock}

${insufficientAttempts.length > 0 ? `⚠️ ${insufficientAttempts.length} essai(s) avec prompt faible (placeholder, mot vide).\n` : ""}

${promptsIdentical ? "⚠️ Les deux prompts sont identiques (copier/coller). Mentionne-le dans reasoning si pertinent.\n" : ""}

## Mode d'évaluation (OBLIGATOIRE)
- Juge **sur pièce** : qualité du/des prompt(s) et pertinence des réponses IA simulées.
- **Interdit** : comparer essai 1 vs essai 2, parler de « progression », « légère amélioration », « itération » ou « entre les deux essais ».
${singleAttempt ? "- Un seul essai soumis : évalue cet essai uniquement. `progressionNote` doit être une chaîne vide \"\".\n" : "- Plusieurs essais : évalue chaque essai sur ses mérites, sans comparer l'un à l'autre. `progressionNote` = \"\" sauf consigne organisme explicite.\n"}
Ne valide pas si les prompts restent vides ou sans consigne claire à l'IA.
${integrityBlocks ? `\n## Intégrité\n${integrityBlocks}` : ""}

Réponds UNIQUEMENT en JSON:
{
  "awarded": boolean,
  "playgroundPassed": boolean,
  "qcmPassed": boolean,
  "reasoning": "2-4 phrases (verdict sur pièce, sans comparaison entre essais)",
  "progressionNote": ""
}`;

  const parsed = await generateJSON(prompt, undefined, "Tu es un évaluateur strict mais bienveillant.");

  if (parsed && typeof parsed === "object") {
    let awarded = Boolean(parsed.awarded);
    let playgroundPassed = Boolean(parsed.playgroundPassed ?? awarded);

    if (
      insufficientAttempts.length >= 2 ||
      (insufficientAttempts.length === 1 && playgroundAttempts.length < 2)
    ) {
      playgroundPassed = false;
      if (qcmPassed) awarded = false;
    }

    let progressionNote = String(parsed.progressionNote ?? "").trim();
    if (singleAttempt || promptsIdentical) progressionNote = "";

    return {
      awarded,
      playgroundPassed,
      qcmPassed: Boolean(parsed.qcmPassed ?? qcmPassed),
      reasoning: String(parsed.reasoning ?? "").trim() || "Évaluation enregistrée.",
      progressionNote,
    };
  }

  const hasValidPrompt = playgroundAttempts.some((a) => !attemptLooksInsufficient(a));
  const playgroundPassed =
    playgroundAttempts.length >= 1 &&
    hasValidPrompt &&
    insufficientAttempts.length < playgroundAttempts.length;

  const awarded =
    qcmPassed && playgroundPassed && !integrityMetrics.some((m) => m.integrityFailed);

  return {
    awarded,
    playgroundPassed,
    qcmPassed,
    reasoning: awarded
      ? "Parcours validé."
      : insufficientAttempts.length > 0
        ? "Prompt(s) playground insuffisant(s)."
        : "Critères non atteints.",
    progressionNote: "",
  };
}
