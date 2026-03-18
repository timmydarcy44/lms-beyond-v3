import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { generateJSON, generateSpeech, getOpenAIClient } from "@/lib/ai/openai-client";
import { generateTextWithAnthropic } from "@/lib/ai/anthropic-client";
import { buildAudioPrompt, buildRephrasePrompt, buildSchemaPrompt } from "@/lib/ai/prompts/text-transformation";

type AIAction = 
  | "revision-sheet"
  | "reformulate"
  | "translate"
  | "diagram"
  | "cleanup"
  | "audio"
  | "generate-image"
  | "flashcards"
  | "quiz"
  | "quiz-neo"
  | "quiz-analysis"
  | "grade-answer";

const getSubjectContext = (subject: string): string => {
  const contexts: Record<string, string> = {
    "Mathématiques":
      "Ce contenu est un cours de mathématiques. Sois toujours précis, étape par étape. Utilise des exemples concrets du quotidien (argent, partage, distances, temps). Ne saute jamais d'étape dans les raisonnements.",
    "Français":
      "Ce contenu est un cours de français. Sois riche et nuancé. Explique le sens profond, la structure des idées. Utilise des exemples littéraires accessibles à un jeune.",
    "Histoire-Géo":
      "Ce contenu est un cours d'histoire-géographie. Adopte un style narratif et immersif. Raconte comme une histoire avec des personnages, des lieux, des dates qui font sens. Crée de l'immersion : 'Imagine-toi en...'",
    "Sciences":
      "Ce contenu est un cours de sciences. Utilise des analogies visuelles avec la nature ou le corps humain. Explique toujours la chaîne cause → effet. Rends chaque mécanisme visible mentalement.",
    "SVT":
      "Ce contenu est un cours de SVT. Même approche que les sciences, avec focus sur le vivant. Utilise des comparaisons avec le corps de l'élève ou des animaux familiers.",
    "Physique-Chimie":
      "Ce contenu est un cours de physique-chimie. Sois rigoureux sur les unités et les formules. Illustre chaque concept avec un exemple du quotidien (cuisine, sport, voiture).",
    "Anglais":
      "Ce contenu est un cours d'anglais. Intègre des comparaisons français/anglais. Aide à mémoriser le vocabulaire par association d'idées. Reste accessible.",
    "Management":
      "Ce contenu est un cours de management. Ancre chaque concept dans des situations professionnelles réelles et concrètes. Utilise des mini cas pratiques : 'Dans ton équipe de 5 personnes...'",
    "Négociation":
      "Ce contenu est un cours de négociation. Transforme les concepts en dialogues et jeux de rôle. Montre toujours les deux côtés : ce que dit le client, ce que tu réponds. Rends ça actionnable.",
    "Marketing":
      "Ce contenu est un cours de marketing. Illustre avec des marques et campagnes connues. Connecte chaque concept à des exemples récents et concrets que l'élève a déjà vus.",
    "Finance":
      "Ce contenu est un cours de finance. Sois précis sur les chiffres et les ratios. Illustre avec des exemples d'entreprises réelles. Explique l'impact concret de chaque décision financière.",
    "Droit":
      "Ce contenu est un cours de droit. Sois précis sur les termes juridiques mais explique-les en langage simple. Illustre chaque règle avec un cas concret de la vie quotidienne.",
    "Commercial":
      "Ce contenu est un cours commercial. Focus sur les techniques terrain et les situations client réelles. Donne des formulations concrètes, des scripts, des réflexes.",
    "RH":
      "Ce contenu est un cours de ressources humaines. Ancre dans des situations managériales réelles. Illustre avec des cas de recrutement, conflits, motivation d'équipe.",
  };
  return contexts[subject] || "";
};

const getLevelContext = (level: string): string => {
  const contexts: Record<string, string> = {
    primaire:
      "Langage très simple, phrases courtes, exemples avec des animaux ou objets du quotidien. Maximum 3 idées par explication.",
    college:
      "Langage accessible, exemples du quotidien ado (sport, jeux vidéo, réseaux sociaux). Évite le jargon.",
    lycee:
      "Langage intermédiaire, exemples concrets, connecte avec l'actualité ou la culture pop.",
    superieur:
      "Langage précis, exemples professionnels, références académiques acceptées.",
    professionnel:
      "Langage business, cas pratiques terrain, ROI et résultats concrets.",
  };
  return contexts[level] || "";
};

const getPromptForAction = (
  action: AIAction,
  text: string,
  options?: {
    style?: string;
    quiz?: { count?: number; difficulty?: string; type?: string };
    subjectContext?: string;
    levelContext?: string;
    question?: string;
    expected_answer?: string;
    student_answer?: string;
    weakTopics?: string[];
  }
): string => {
  switch (action) {
    case "revision-sheet":
      return `Crée une fiche de révision structurée et complète à partir du texte suivant. La fiche doit inclure :
- Un résumé des points clés
- Les concepts importants avec leurs définitions
- Des exemples concrets si applicable
- Des questions de révision

Texte à traiter :
${text}`;

    case "reformulate": {
      const stylePrompts: Record<string, string> = {
        examples: "Reformule ce texte en ajoutant des exemples concrets et parlants pour illustrer chaque idée.",
        metaphore: "Reformule ce texte en utilisant une métaphore puissante et mémorable pour illustrer le concept principal.",
        enfant:
          "Reformule ce texte comme si tu l'expliquais à un enfant de 8 ans : mots simples, phrases courtes, analogies du quotidien.",
        simple:
          "Reformule ce texte de manière plus simple : phrases courtes, vocabulaire accessible, va à l'essentiel.",
        situation: "Reformule ce texte sous forme de mise en situation concrète avec un scénario réaliste.",
        "5ans":
          "Reformule ce texte comme si tu l'expliquais à un enfant de 5 ans : mots très simples, analogies du quotidien.",
      };
      const style = options?.style || "simple";
      const subjectContext = options?.subjectContext ?? "";
      const levelContext = options?.levelContext ?? "";
      return `${subjectContext}${levelContext}${
        stylePrompts[style] || stylePrompts.simple
      }\n\nTexte à reformuler :\n${text}`;
    }

    case "translate":
      return `Traduis le texte suivant en français (si ce n'est pas déjà le cas) ou en anglais. Assure-toi que la traduction soit précise et naturelle.

Texte à traduire :
${text}`;

    case "diagram":
      return buildSchemaPrompt(text);

    case "cleanup":
      return `Nettoie et structure le texte suivant. Corrige les erreurs, améliore la ponctuation, organise les paragraphes de manière logique et assure une cohérence globale.

Texte à nettoyer :
${text}`;

    case "audio":
      return `Prépare ce texte pour une conversion en audio. Adapte-le pour qu'il soit fluide à l'oral : simplifie les phrases complexes, ajoute des pauses naturelles, et assure une bonne compréhension à l'écoute.

Texte à adapter :
${text}`;
    case "flashcards":
      return `Génère 8 flashcards depuis ce cours.
Réponds UNIQUEMENT en JSON valide :
[{"question": "...", "answer": "..."}]
Sans markdown, sans commentaire, juste le JSON.

Texte :
${text}`;
    case "quiz": {
      const quizType = options?.quiz?.type || "qcm";
      const defaultCount = quizType === "vrai-faux" ? 10 : 5;
      const count = options?.quiz?.count || defaultCount;
      const difficulty = options?.quiz?.difficulty || "Moyen";
      const quizTypePrompt: Record<string, string> = {
        qcm: `Génère ${count} questions QCM avec 4 choix chacune, une seule bonne réponse.
Format JSON : [{"question":"...","options":["A","B","C","D"],"correct_index":0}]`,
        "vrai-faux": `Génère ${count} affirmations Vrai/Faux avec justification.
Format JSON : [{"statement":"...","answer":true,"justification":"..."}]`,
        trou: `Génère ${count} phrases importantes du cours avec UN mot clé remplacé par ___.
Format JSON : { "sentences": [{ "text": "La ___ est...", "answer": "photosynthèse", "hint": "processus végétal" }] }`,
      };
      return `${quizTypePrompt[quizType] || quizTypePrompt.qcm}
Niveau de difficulté : ${difficulty}.
Réponds UNIQUEMENT en JSON valide, sans markdown ni commentaire.

Texte :
${text}`;
    }

    case "quiz-neo": {
      const count = options?.quiz?.count || 8;
      const difficulty = options?.quiz?.difficulty || "Moyen";
      const weakTopics = options?.weakTopics?.length
        ? `Priorise les sujets suivants car l'élève a eu des erreurs: ${options.weakTopics.join(", ")}.`
        : "Répartis les questions sur les notions clés du texte.";
      return `Tu es Néo, un coach d'apprentissage. Génère un quiz MIXTE de ${count} questions.
Le quiz doit mélanger : QCM, Vrai/Faux et Réponse libre.
${weakTopics}

Réponds UNIQUEMENT en JSON valide (tableau).
Chaque élément doit avoir :
- "type": "qcm" | "vrai-faux" | "open"
- "question": string
- "topic": string (sujet principal de la question)
- Pour "qcm" et "vrai-faux": "options": string[] et "correct_index": number
- Pour "open": "expected_answer": string
- Optionnel: "explanation": string

Niveau : ${difficulty}.

Texte :
${text}`;
    }

    case "quiz-analysis": {
      const weakTopics = options?.weakTopics?.length
        ? options.weakTopics.join(", ")
        : "aucun sujet spécifique";
      return `Tu es Néo. Analyse rapide post-quiz.
Voici les sujets à renforcer: ${weakTopics}.
Donne un avis bref et encourageant, et une micro-explication utile en 2-3 phrases.
Réponds UNIQUEMENT en JSON : {"summary":"...","focus_topics":["..."]}`;
    }

    case "grade-answer": {
      const question = options?.question ?? "";
      const expectedAnswer = options?.expected_answer ?? "";
      const studentAnswer = options?.student_answer ?? "";
      return `Tu es un professeur bienveillant et encourageant. Voici une question : "${question}".
La réponse attendue : "${expectedAnswer}".
La réponse de l'élève : "${studentAnswer}".

Évalue la réponse selon ces critères :
- Compréhension totale (la réponse est juste et complète) → score: 1
- Compréhension partielle (la réponse est partiellement juste) → score: 0.5
- Pas de compréhension (la réponse est fausse ou hors sujet) → score: 0

Ton feedback doit être :
- Encourageant et bienveillant, même si la réponse est fausse
- Constructif : explique ce qui manque ou ce qui est bien
- Court : 2-3 phrases maximum
- En français

Réponds UNIQUEMENT en JSON : { "score": 0 | 0.5 | 1, "feedback": "string" }`;
    }

    default:
      return text;
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, action, text, style, subject, options } = body;

    let level: string | null = null;
    try {
      const supabase = await getServerClient();
      if (supabase) {
        const { data } = await supabase
          .from("beyond_note_accounts")
          .select("level")
          .eq("user_id", session.id)
          .single();
        level = data?.level ?? null;
      }
    } catch {
      level = null;
    }

    const levelContext = level ? `${getLevelContext(level)}\n\n` : "";
    const subjectContext = subject ? `${getSubjectContext(subject)}\n\n` : "";

    if (!action || !text) {
      return NextResponse.json(
        { error: "Action et texte requis" },
        { status: 400 }
      );
    }

    if (action === "audio") {
      const audioPlan = await generateJSON(levelContext + subjectContext + buildAudioPrompt(text));
      const script =
        audioPlan && typeof audioPlan === "object" && typeof audioPlan.script === "string" && audioPlan.script.trim().length > 0
          ? audioPlan.script.trim()
          : text.trim();

      const speech = await generateSpeech(script, { voice: "alloy", format: "mp3" });

      return NextResponse.json({
        result: script,
        action,
        documentId,
        audio_base64: speech?.buffer.toString("base64") ?? null,
        audio_mime_type: speech?.mimeType ?? null,
        audio_voice: speech?.voice ?? null,
      });
    }

    if (action === "generate-image") {
      const openai = getOpenAIClient();
      if (!openai) {
        throw new Error("OpenAI non configuré");
      }

      const conceptPrompt = `${levelContext}${subjectContext}En une phrase courte, quel est le concept visuel principal de ce texte ?
Réponds uniquement avec le concept, ex: \"une asymétrie de courbe mathématique\". Texte : ${text}`;

      const concept = (await generateTextWithAnthropic(conceptPrompt)) || text.slice(0, 100);

      const imageRes = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Schéma pédagogique épuré illustrant : ${concept}.
Style : illustration éducative minimaliste, fond blanc ou sombre,
traits clairs, adapté à un cours scolaire. Sans texte superflu.`,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });

      const imageUrl = imageRes.data?.[0]?.url || "";
      return NextResponse.json({
        result: imageUrl,
        action,
        type: "image",
      });
    }

    if (action === "diagram") {
      const json = await generateJSON(levelContext + subjectContext + buildSchemaPrompt(text));
      if (!json) {
        return NextResponse.json({ error: "Erreur lors du traitement IA" }, { status: 500 });
      }
      return NextResponse.json({
        result: JSON.stringify(json),
        action,
        documentId,
      });
    }

    const prompt = getPromptForAction(action as AIAction, text, {
      style,
      quiz: options?.quiz,
      subjectContext,
      levelContext,
      question: options?.question,
      expected_answer: options?.expected_answer,
      student_answer: options?.student_answer,
      weakTopics: options?.weakTopics,
    });
    if (!prompt) {
      return NextResponse.json({ error: "Erreur lors de la génération du prompt" }, { status: 400 });
    }
      
      const openai = getOpenAIClient();
      if (!openai) {
        throw new Error("Aucun provider IA disponible");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 4000,
      });

    const result = response.choices[0]?.message?.content || "Erreur lors de la génération";

    return NextResponse.json({
      result,
      action,
      documentId,
    });
  } catch (error) {
    console.error("[beyond-note/ai-action] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement IA" },
      { status: 500 }
    );
  }
}




