import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { generateJSON, generateSpeech, getOpenAIClient } from "@/lib/ai/openai-client";
import { generateTextWithAnthropic } from "@/lib/ai/anthropic-client";
import { buildAudioPrompt, buildSchemaPrompt } from "@/lib/ai/prompts/text-transformation";

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
  | "grade-answer";

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const getSubjectContext = (subject: string): string => {
  const key = normalizeKey(subject);
  const contexts: Record<string, string> = {
    Mathematiques:
      "Cours de mathematiques. Etapes claires, exemples concrets du quotidien.",
    Francais:
      "Cours de francais. Explications nuancees et structure des idees.",
    "Histoire-Geo":
      "Cours d histoire-geo. Style narratif, dates et lieux clairs.",
    Sciences:
      "Cours de sciences. Cause -> effet et analogies visuelles.",
    SVT:
      "Cours de SVT. Focus vivant, analogies simples.",
    "Physique-Chimie":
      "Cours de physique-chimie. Rigueur sur unites, exemples du quotidien.",
    Anglais:
      "Cours d anglais. Comparaisons FR/EN, vocabulaire memorisable.",
    Management:
      "Cours de management. Cas pratiques concrets.",
    Negotiation:
      "Cours de negociation. Dialogues et situations client.",
    Marketing:
      "Cours de marketing. Exemples de marques et campagnes.",
    Finance:
      "Cours de finance. Chiffres, ratios, impacts concrets.",
    Droit:
      "Cours de droit. Termes precis, cas pratiques.",
    Commercial:
      "Cours commercial. Scripts terrain et situations client.",
    RH:
      "Cours RH. Cas de recrutement, conflits, motivation d equipe.",
  };
  return contexts[key] || "";
};

const getLevelContext = (level: string): string => {
  const key = normalizeKey(level).toLowerCase();
  const contexts: Record<string, string> = {
    primaire: "Langage tres simple, phrases courtes, exemples concrets.",
    college: "Langage accessible, exemples du quotidien ado.",
    lycee: "Langage intermediaire, exemples concrets.",
    superieur: "Langage precis, exemples professionnels.",
    professionnel: "Langage business, cas terrain, ROI.",
  };
  return contexts[key] || "";
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
  },
): string => {
  switch (action) {
    case "revision-sheet":
      return `Cree une fiche de revision structuree a partir du texte suivant.
- Resume des points cles
- Concepts importants avec definition
- Exemples concrets
- Questions de revision

Texte:
${text}`;
    case "reformulate": {
      const stylePrompts: Record<string, string> = {
        examples: "Reformule avec des exemples concrets.",
        metaphore: "Reformule avec une metaphore claire.",
        enfant: "Explique comme a un enfant de 8 ans.",
        simple: "Reformule simplement, phrases courtes.",
        situation: "Reformule sous forme de situation.",
      };
      const style = options?.style || "simple";
      const subjectContext = options?.subjectContext ?? "";
      const levelContext = options?.levelContext ?? "";
      return `${subjectContext}${levelContext}${stylePrompts[style] || stylePrompts.simple}

Texte:
${text}`;
    }
    case "translate":
      return `Traduis le texte en francais ou en anglais. Traduction naturelle.

Texte:
${text}`;
    case "diagram":
      return buildSchemaPrompt(text);
    case "cleanup":
      return `Nettoie et structure le texte: corrige, ponctue, organise.

Texte:
${text}`;
    case "audio":
      return `Prepare le texte pour une lecture audio fluide.

Texte:
${text}`;
    case "flashcards":
      return `Genere 8 flashcards depuis ce cours.
Reponds UNIQUEMENT en JSON valide:
[{"question":"...","answer":"..."}]
Sans markdown.

Texte:
${text}`;
    case "quiz": {
      const quizType = options?.quiz?.type || "qcm";
      const defaultCount = quizType === "vrai-faux" ? 10 : 5;
      const count = options?.quiz?.count || defaultCount;
      const difficulty = options?.quiz?.difficulty || "Moyen";
      const quizTypePrompt: Record<string, string> = {
        qcm: `Genere ${count} QCM avec 4 choix, une bonne reponse.
Format JSON: [{"question":"...","options":["A","B","C","D"],"correct_index":0}]`,
        "vrai-faux": `Genere ${count} affirmations Vrai/Faux avec justification.
Format JSON: [{"statement":"...","answer":true,"justification":"..."}]`,
        trou: `Genere ${count} phrases avec un mot cle remplace par ___.
Format JSON: {"sentences":[{"text":"La ___ est...","answer":"mot","hint":"indice"}]}`,
        open: `Genere ${count} questions reponse libre.
Format JSON: [{"question":"...","expected_answer":"..."}]`,
      };
      return `${quizTypePrompt[quizType] || quizTypePrompt.qcm}
Niveau: ${difficulty}.
Reponds UNIQUEMENT par un objet JSON pur, sans aucun texte avant ou apres.
Sans markdown.

Texte:
${text}`;
    }
    case "grade-answer": {
      const question = options?.question ?? "";
      const expectedAnswer = options?.expected_answer ?? "";
      const studentAnswer = options?.student_answer ?? "";
      return `Tu es un professeur bienveillant. Question: "${question}".
Reponse attendue: "${expectedAnswer}".
Reponse eleve: "${studentAnswer}".

Attribue un score:
- 1: comprehension totale
- 0.5: comprehension partielle
- 0: hors sujet

Donne un feedback court (2-3 phrases) en francais.
Reponds UNIQUEMENT en JSON: {"score":0|0.5|1,"feedback":"..."} `;
    }
    default:
      return text;
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
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
      return NextResponse.json({ error: "Action et texte requis" }, { status: 400 });
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
        throw new Error("OpenAI non configure");
      }

      const conceptPrompt = `${levelContext}${subjectContext}En une phrase courte, quel est le concept visuel principal de ce texte ? Reponds uniquement avec le concept. Texte: ${text}`;
      const concept = (await generateTextWithAnthropic(conceptPrompt)) || text.slice(0, 100);

      const imageRes = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Schema educatif minimaliste: ${concept}. Fond clair, style propre.`,
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
        return NextResponse.json({ error: "Erreur IA" }, { status: 500 });
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
    });
    if (!prompt) {
      return NextResponse.json({ error: "Prompt invalide" }, { status: 400 });
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

    const result = response.choices[0]?.message?.content || "Erreur lors de la generation";

    return NextResponse.json({
      result,
      action,
      documentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
