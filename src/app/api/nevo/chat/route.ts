import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { AI_CONTEXT_LIMITS, truncateText } from "@/lib/ai/context-limits";

type NevoAction =
  | "quiz"
  | "revision-sheet"
  | "reformulate"
  | "diagram"
  | "translate"
  | "flashcards"
  | "audio";

/** Détection locale des intentions — évite un appel API supplémentaire par message. */
function detectNevoAction(message: string): NevoAction | null {
  const m = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/\b(quiz|qcm|questionnaire)\b/.test(m)) return "quiz";
  if (/\b(fiche de revision|fiche revision|revision sheet|resume)\b/.test(m)) return "revision-sheet";
  if (/\b(reformule|reformuler|rephrase)\b/.test(m)) return "reformulate";
  if (/\b(schema|diagramme|mindmap|carte mentale)\b/.test(m)) return "diagram";
  if (/\b(tradui|translate|traduction)\b/.test(m)) return "translate";
  if (/\b(flashcard|carte memoire)\b/.test(m)) return "flashcards";
  if (/\b(audio|ecoute|lire a voix haute|tts)\b/.test(m)) return "audio";
  return null;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const { messages = [], extractedText, subject, level, context } = await request.json();
    const openai = getOpenAIClient();
    if (!openai) return NextResponse.json({ error: "OpenAI non configuré" }, { status: 500 });

    const isLibrary = context === "library" || !extractedText || extractedText.trim().length < 50;
    const isSearch = context === "search";

    if (isSearch) {
      const searchPrompt =
        "Tu es un moteur de recherche. Réponds UNIQUEMENT avec l'ID du document demandé, rien d'autre.";
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: searchPrompt }, ...messages.slice(-5)],
        max_tokens: 200,
      });
      return NextResponse.json({
        response: completion.choices[0]?.message?.content || "null",
      });
    }

    const courseExcerpt = truncateText(
      String(extractedText ?? ""),
      AI_CONTEXT_LIMITS.NEVO_COURSE_TEXT_MAX,
    );

    const systemPrompt = isLibrary
      ? `Tu es Neo, un assistant d'apprentissage bienveillant intégré dans Nevo.
Tu es sur la page bibliothèque — tu peux aider l'utilisateur à naviguer.
Tu réponds de manière naturelle et orale, sans markdown.
Phrases courtes et naturelles, maximum 3-4 phrases.
Tu peux suggérer d'ouvrir un cours, créer une note, ou expliquer les fonctionnalités de Nevo.
Si l'utilisateur demande d'ouvrir un fichier, dis-lui que tu vas l'ouvrir.
Tu ne mentionnes jamais OpenAI, GPT ou Anthropic.
Si on te demande qui tu es : "Je suis Neo, ton assistant Nevo."`
      : `Tu es Neo, un assistant pédagogique conversationnel et bienveillant.
Tu réponds de manière naturelle et orale — comme si tu parlais à voix haute.
RÈGLES ABSOLUES :
- Jamais de markdown : pas de **, ##, -, 1., listes numérotées
- Phrases courtes et naturelles, ton conversationnel
- Maximum 3-4 phrases par réponse sauf si on te demande plus
- Tu réponds UNIQUEMENT sur le contenu du cours fourni
- Si hors sujet : "Je me concentre sur ce cours, pose-moi une question dessus !"
- Tu es encourageant, jamais condescendant
${subject ? "Matière : " + subject : ""}
Cours : ${courseExcerpt}`;

    const lastMessage = String(messages[messages.length - 1]?.content ?? "");
    if (lastMessage && !isLibrary) {
      const action = detectNevoAction(lastMessage);
      if (action) {
        return NextResponse.json({
          action,
          response: "Je lance ça pour toi !",
        });
      }
    }

    const recentMessages = messages.slice(-AI_CONTEXT_LIMITS.NEVO_MAX_MESSAGES);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
      max_tokens: 1024,
    });

    return NextResponse.json({
      response: completion.choices[0]?.message?.content || "Erreur",
    });
  } catch (e) {
    console.error("[chat] error:", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
