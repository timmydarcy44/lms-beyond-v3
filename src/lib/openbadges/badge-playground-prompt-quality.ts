export type PlaygroundPromptQuality = "valid" | "insufficient";

const PLACEHOLDER_TOKENS = new Set([
  "prompt",
  "prompts",
  "test",
  "tests",
  "essai",
  "essais",
  "ok",
  "oui",
  "non",
  "hello",
  "salut",
  "coucou",
  "bonjour",
  "aze",
  "azerty",
  "qwerty",
  "abc",
  "xxx",
  "rien",
  "vide",
  "null",
  "undefined",
  "lorem",
  "ipsum",
  "bla",
  "blabla",
  "teste",
  "testing",
  "demo",
  "exemple",
  "example",
  "réponse",
  "reponse",
  "article",
  "texte",
  "help",
  "aide",
]);

function normalizedWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[\s,.;:!?()[\]{}"']+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

/** Détection locale rapide — retourne null si l'IA doit trancher. */
export function heuristicPlaygroundPromptQuality(
  prompt: string,
  consigne?: string,
): PlaygroundPromptQuality | null {
  const trimmed = prompt.trim();
  if (!trimmed) return "insufficient";

  const compact = trimmed.replace(/\s+/g, " ");
  const words = normalizedWords(compact);
  const lettersOnly = compact.replace(/[^a-zA-ZÀ-ÿ0-9]/g, "");

  if (lettersOnly.length < 8) return "insufficient";
  if (words.length === 1 && PLACEHOLDER_TOKENS.has(words[0]!)) return "insufficient";
  if (words.length <= 2 && compact.length < 28) {
    const allPlaceholders = words.every((w) => PLACEHOLDER_TOKENS.has(w) || w.length <= 2);
    if (allPlaceholders) return "insufficient";
  }

  if (/^(.)\1{5,}$/i.test(lettersOnly)) return "insufficient";
  if (/^(ha){3,}$/i.test(lettersOnly)) return "insufficient";

  const consigneNorm = (consigne ?? "").trim().toLowerCase().slice(0, 200);
  if (
    consigneNorm.length > 40 &&
    compact.toLowerCase() === consigneNorm.slice(0, compact.length) &&
    compact.length < consigneNorm.length * 0.85
  ) {
    return "insufficient";
  }

  if (words.length >= 4 && lettersOnly.length >= 40) return "valid";
  if (compact.length >= 80) return "valid";

  return null;
}

export function buildInsufficientPlaygroundFeedback(params: {
  learnerPrompt: string;
  consigne: string;
  attemptNumber: number;
  reason?: string;
}): string {
  const { learnerPrompt, consigne, attemptNumber, reason } = params;
  const preview =
    learnerPrompt.length > 120 ? `${learnerPrompt.slice(0, 120)}…` : learnerPrompt;

  return `**Ce prompt n'est pas exploitable pour l'essai ${attemptNumber}.**

${reason ? `${reason}\n\n` : ""}Vous avez envoyé : « ${preview} »

Un mot isolé, un placeholder ou une saisie sans intention ne permet pas d'évaluer votre maîtrise. Je ne produis pas de livrable fictif dans ce cas.

**Pour reformuler**, votre prochain prompt devrait préciser, en lien avec la consigne :
- le **rôle** de l'IA (ex. expert, formateur, rédacteur…) ;
- le **contexte** et l'objectif concret ;
- le **format** attendu (liste, plan, texte court, étapes…) ;
- les **contraintes** utiles (ton, longueur, public).

**Rappel de la consigne :**
${consigne.slice(0, 500)}${consigne.length > 500 ? "…" : ""}

Reprenez avec un prompt complet — c'est ce qui sera analysé pour votre badge.`;
}
