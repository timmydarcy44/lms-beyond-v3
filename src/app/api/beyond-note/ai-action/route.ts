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
  | "grade-answer";

const getSubjectContext = (subject: string): string => {
  const contexts: Record<string, string> = {
    "Math+®matiques":
      "Ce contenu est un cours de math+®matiques. Sois toujours pr+®cis, +®tape par +®tape. Utilise des exemples concrets du quotidien (argent, partage, distances, temps). Ne saute jamais d'+®tape dans les raisonnements.",
    "Fran+ºais":
      "Ce contenu est un cours de fran+ºais. Sois riche et nuanc+®. Explique le sens profond, la structure des id+®es. Utilise des exemples litt+®raires accessibles +á un jeune.",
    "Histoire-G+®o":
      "Ce contenu est un cours d'histoire-g+®ographie. Adopte un style narratif et immersif. Raconte comme une histoire avec des personnages, des lieux, des dates qui font sens. Cr+®e de l'immersion : 'Imagine-toi en...'",
    "Sciences":
      "Ce contenu est un cours de sciences. Utilise des analogies visuelles avec la nature ou le corps humain. Explique toujours la cha+«ne cause ÔåÆ effet. Rends chaque m+®canisme visible mentalement.",
    "SVT":
      "Ce contenu est un cours de SVT. M+¬me approche que les sciences, avec focus sur le vivant. Utilise des comparaisons avec le corps de l'+®l+¿ve ou des animaux familiers.",
    "Physique-Chimie":
      "Ce contenu est un cours de physique-chimie. Sois rigoureux sur les unit+®s et les formules. Illustre chaque concept avec un exemple du quotidien (cuisine, sport, voiture).",
    "Anglais":
      "Ce contenu est un cours d'anglais. Int+¿gre des comparaisons fran+ºais/anglais. Aide +á m+®moriser le vocabulaire par association d'id+®es. Reste accessible.",
    "Management":
      "Ce contenu est un cours de management. Ancre chaque concept dans des situations professionnelles r+®elles et concr+¿tes. Utilise des mini cas pratiques : 'Dans ton +®quipe de 5 personnes...'",
    "N+®gociation":
      "Ce contenu est un cours de n+®gociation. Transforme les concepts en dialogues et jeux de r+¦le. Montre toujours les deux c+¦t+®s : ce que dit le client, ce que tu r+®ponds. Rends +ºa actionnable.",
    "Marketing":
      "Ce contenu est un cours de marketing. Illustre avec des marques et campagnes connues. Connecte chaque concept +á des exemples r+®cents et concrets que l'+®l+¿ve a d+®j+á vus.",
    "Finance":
      "Ce contenu est un cours de finance. Sois pr+®cis sur les chiffres et les ratios. Illustre avec des exemples d'entreprises r+®elles. Explique l'impact concret de chaque d+®cision financi+¿re.",
    "Droit":
      "Ce contenu est un cours de droit. Sois pr+®cis sur les termes juridiques mais explique-les en langage simple. Illustre chaque r+¿gle avec un cas concret de la vie quotidienne.",
    "Commercial":
      "Ce contenu est un cours commercial. Focus sur les techniques terrain et les situations client r+®elles. Donne des formulations concr+¿tes, des scripts, des r+®flexes.",
    "RH":
      "Ce contenu est un cours de ressources humaines. Ancre dans des situations manag+®riales r+®elles. Illustre avec des cas de recrutement, conflits, motivation d'+®quipe.",
  };
  return contexts[subject] || "";
};

const getLevelContext = (level: string): string => {
  const contexts: Record<string, string> = {
    primaire:
      "Langage tr+¿s simple, phrases courtes, exemples avec des animaux ou objets du quotidien. Maximum 3 id+®es par explication.",
    college:
      "Langage accessible, exemples du quotidien ado (sport, jeux vid+®o, r+®seaux sociaux). +ëvite le jargon.",
    lycee:
      "Langage interm+®diaire, exemples concrets, connecte avec l'actualit+® ou la culture pop.",
    superieur:
      "Langage pr+®cis, exemples professionnels, r+®f+®rences acad+®miques accept+®es.",
    professionnel:
      "Langage business, cas pratiques terrain, ROI et r+®sultats concrets.",
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
  }
): string => {
  switch (action) {
    case "revision-sheet":
      return `Cr+®e une fiche de r+®vision structur+®e et compl+¿te +á partir du texte suivant. La fiche doit inclure :
- Un r+®sum+® des points cl+®s
- Les concepts importants avec leurs d+®finitions
- Des exemples concrets si applicable
- Des questions de r+®vision

Texte +á traiter :
${text}`;

    case "reformulate": {
      const stylePrompts: Record<string, string> = {
        examples: "Reformule ce texte en ajoutant des exemples concrets et parlants pour illustrer chaque id+®e.",
        metaphore: "Reformule ce texte en utilisant une m+®taphore puissante et m+®morable pour illustrer le concept principal.",
        enfant:
          "Reformule ce texte comme si tu l'expliquais +á un enfant de 8 ans : mots simples, phrases courtes, analogies du quotidien.",
        simple:
          "Reformule ce texte de mani+¿re plus simple : phrases courtes, vocabulaire accessible, va +á l'essentiel.",
        situation: "Reformule ce texte sous forme de mise en situation concr+¿te avec un sc+®nario r+®aliste.",
        "5ans":
          "Reformule ce texte comme si tu l'expliquais +á un enfant de 5 ans : mots tr+¿s simples, analogies du quotidien.",
      };
      const style = options?.style || "simple";
      const subjectContext = options?.subjectContext ?? "";
      const levelContext = options?.levelContext ?? "";
      return `${subjectContext}${levelContext}${
        stylePrompts[style] || stylePrompts.simple
      }\n\nTexte +á reformuler :\n${text}`;
    }

    case "translate":
      return `Traduis le texte suivant en fran+ºais (si ce n'est pas d+®j+á le cas) ou en anglais. Assure-toi que la traduction soit pr+®cise et naturelle.

Texte +á traduire :
${text}`;

    case "diagram":
      return buildSchemaPrompt(text);

    case "cleanup":
      return `Nettoie et structure le texte suivant. Corrige les erreurs, am+®liore la ponctuation, organise les paragraphes de mani+¿re logique et assure une coh+®rence globale.

Texte +á nettoyer :
${text}`;

    case "audio":
      return `Pr+®pare ce texte pour une conversion en audio. Adapte-le pour qu'il soit fluide +á l'oral : simplifie les phrases complexes, ajoute des pauses naturelles, et assure une bonne compr+®hension +á l'+®coute.

Texte +á adapter :
${text}`;
    case "flashcards":
      return `G+®n+¿re 8 flashcards depuis ce cours.
R+®ponds UNIQUEMENT en JSON valide :
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
        qcm: `G+®n+¿re ${count} questions QCM avec 4 choix chacune, une seule bonne r+®ponse.
Format JSON : [{"question":"...","options":["A","B","C","D"],"correct_index":0}]`,
        "vrai-faux": `G+®n+¿re ${count} affirmations Vrai/Faux avec justification.
Format JSON : [{"statement":"...","answer":true,"justification":"..."}]`,
        trou: `G+®n+¿re ${count} phrases importantes du cours avec UN mot cl+® remplac+® par ___.
Format JSON : { "sentences": [{ "text": "La ___ est...", "answer": "photosynth+¿se", "hint": "processus v+®g+®tal" }] }`,
      };
      return `${quizTypePrompt[quizType] || quizTypePrompt.qcm}
Niveau de difficult+® : ${difficulty}.
R+®ponds UNIQUEMENT en JSON valide, sans markdown ni commentaire.

Texte :
${text}`;
    }

    case "grade-answer": {
      const question = options?.question ?? "";
      const expectedAnswer = options?.expected_answer ?? "";
      const studentAnswer = options?.student_answer ?? "";
      return `Tu es un professeur bienveillant et encourageant. Voici une question : "${question}".
La r+®ponse attendue : "${expectedAnswer}".
La r+®ponse de l'+®l+¿ve : "${studentAnswer}".

+ëvalue la r+®ponse selon ces crit+¿res :
- Compr+®hension totale (la r+®ponse est juste et compl+¿te) ÔåÆ score: 1
- Compr+®hension partielle (la r+®ponse est partiellement juste) ÔåÆ score: 0.5
- Pas de compr+®hension (la r+®ponse est fausse ou hors sujet) ÔåÆ score: 0

Ton feedback doit +¬tre :
- Encourageant et bienveillant, m+¬me si la r+®ponse est fausse
- Constructif : explique ce qui manque ou ce qui est bien
- Court : 2-3 phrases maximum
- En fran+ºais

R+®ponds UNIQUEMENT en JSON : { "score": 0 | 0.5 | 1, "feedback": "string" }`;
    }

    default:
      return text;
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifi+®" }, { status: 401 });
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
        throw new Error("OpenAI non configur+®");
      }

      const conceptPrompt = `${levelContext}${subjectContext}En une phrase courte, quel est le concept visuel principal de ce texte ?
R+®ponds uniquement avec le concept, ex: \"une asym+®trie de courbe math+®matique\". Texte : ${text}`;

      const concept = (await generateTextWithAnthropic(conceptPrompt)) || text.slice(0, 100);

      const imageRes = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Sch+®ma p+®dagogique +®pur+® illustrant : ${concept}.
Style : illustration +®ducative minimaliste, fond blanc ou sombre,
traits clairs, adapt+® +á un cours scolaire. Sans texte superflu.`,
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
    });
    if (!prompt) {
      return NextResponse.json({ error: "Erreur lors de la g+®n+®ration du prompt" }, { status: 400 });
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

    const result = response.choices[0]?.message?.content || "Erreur lors de la g+®n+®ration";

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




