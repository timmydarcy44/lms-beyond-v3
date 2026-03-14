import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOpenAIClient } from "@/lib/ai/openai-client";

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
        messages: [{ role: "system", content: searchPrompt }, ...messages],
        max_tokens: 200,
      });
      return NextResponse.json({
        response: completion.choices[0]?.message?.content || "null",
      });
    }

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
Cours : ${extractedText?.slice(0, 8000) || ""}`;

    const lastMessage = messages[messages.length - 1]?.content || "";
    if (lastMessage) {
      const intentPrompt = `L'utilisateur dit : "${lastMessage}". 
Est-ce une demande d'action parmi : quiz, revision-sheet, reformulate, diagram, translate, flashcards, audio ?
Réponds UNIQUEMENT en JSON : { "action": "quiz" | "revision-sheet" | "reformulate" | "diagram" | "translate" | "flashcards" | "audio" | null }
Si c'est juste une question sur le cours, action = null.`;
      try {
        const intentCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: intentPrompt }],
          max_tokens: 200,
        });
        const intentContent = intentCompletion.choices[0]?.message?.content || "";
        const intentData = JSON.parse(intentContent);
        if (intentData?.action) {
          return NextResponse.json({
            action: intentData.action,
            response: "Je lance ça pour toi !",
          });
        }
      } catch {
        // ignore intent errors and fallback to normal response
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
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
