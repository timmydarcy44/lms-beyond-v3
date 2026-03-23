import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";

const systemPrompt =
  "Compare la phrase dite par l'élève avec la phrase modèle. Donne un feedback court, conversationnel et bienveillant en français (2 à 3 phrases maximum). Indique les mots mal prononcés ou manquants si nécessaire. Tu es Neo, un coach d'anglais ultra-précis. Ton but n'est pas seulement de comprendre, mais d'atteindre une prononciation native. Sois particulièrement attentif aux erreurs typiques des francophones (sons \"th\", \"h\" aspirés, voyelles courtes/longues, accent tonique). Si l'accent est trop marqué, même si la phrase est correcte, indique-le fermement mais avec encouragement. Retourne uniquement un JSON avec { feedback: string, score: number }.";

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getEducationContext = (level?: string | null) => {
  if (!level) return "";
  const key = normalizeKey(level);
  if (key.includes("cp") || key.includes("ce1") || key.includes("ce2") || key.includes("cm1") || key.includes("cm2")) {
    return "Niveau primaire: phrases très simples, consignes douces, encouragements très clairs.";
  }
  if (key.includes("6e") || key.includes("5e") || key.includes("4e") || key.includes("3e") || key.includes("college")) {
    return "Niveau collège: vocabulaire accessible, correction précise mais pédagogique.";
  }
  if (key.includes("seconde") || key.includes("premiere") || key.includes("terminale") || key.includes("lycee")) {
    return "Niveau lycée: correction exigeante, explications concises.";
  }
  if (key.includes("bac+1") || key.includes("bac+2") || key.includes("bac+3") || key.includes("licence")) {
    return "Niveau supérieur: correction technique, exigences élevées.";
  }
  if (key.includes("bac+4") || key.includes("bac+5") || key.includes("master")) {
    return "Niveau avancé: correction très précise, niveau quasi natif.";
  }
  if (key.includes("doctorat") || key.includes("bac+8") || key.includes("phd")) {
    return "Niveau doctorat: exigence maximale, niveau natif attendu.";
  }
  return "";
};

const normalize = (input: string) =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const targetText = typeof formData.get("targetText") === "string" ? String(formData.get("targetText")) : "";

    if (!audioFile || !targetText.trim()) {
      return NextResponse.json({ error: "Audio ou phrase cible manquante" }, { status: 400 });
    }

    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 });
    }

    let educationLevel: string | null = null;
    const session = await getSession();
    if (session?.id) {
      const supabase = await getServerClient();
      if (supabase) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("education_level")
          .eq("id", session.id)
          .maybeSingle();
        educationLevel = profile?.education_level ?? null;
      }
    }

    const educationContext = getEducationContext(educationLevel);

    const transcriptionResponse = await client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text",
    });

    const transcription =
      typeof transcriptionResponse === "string"
        ? transcriptionResponse
        : (transcriptionResponse as { text?: string })?.text || "";

    const feedbackResponse = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `${systemPrompt}\n${educationContext}`.trim() },
        {
          role: "user",
          content: `Phrase modèle : "${targetText}"\nPhrase dite : "${transcription}"`,
        },
      ],
      temperature: 0.4,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const raw = feedbackResponse.choices[0]?.message?.content || "";
    let parsed: { feedback?: string; score?: number } = {};
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      console.error("[api/audio/transcribe-and-feedback] JSON parse error", error, raw);
    }

    const feedback = parsed.feedback?.trim() || "";
    const score = typeof parsed.score === "number" ? parsed.score : 0;
    const correct = normalize(transcription) === normalize(targetText);

    return NextResponse.json({ transcription, feedback, correct, score });
  } catch (error) {
    console.error("[api/audio/transcribe-and-feedback] Error", error);
    return NextResponse.json({ error: "Erreur de transcription" }, { status: 500 });
  }
}
