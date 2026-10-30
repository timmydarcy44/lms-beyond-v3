import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";

type Turn = { question?: string; answer?: string };

export async function POST(request: Request) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    courseTitle?: string;
    material?: string;
    history?: Turn[];
  } | null;
  const material = String(body?.material ?? "").trim().slice(0, 12000);
  if (!material) {
    return NextResponse.json({ error: "Aucun contenu lu pour le moment." }, { status: 400 });
  }

  const courseTitle = String(body?.courseTitle ?? "cette formation").trim().slice(0, 180);
  const history = (Array.isArray(body?.history) ? body.history : [])
    .slice(-6)
    .map((turn) => `Question : ${String(turn.question ?? "").slice(0, 400)}\nRéponse : ${String(turn.answer ?? "").slice(0, 800)}`)
    .join("\n\n");

  const result = await generateJSON(
    [
      `Formation : ${courseTitle}`,
      "Contenu déjà lu par l'apprenant :",
      material,
      history ? `Échanges déjà eus :\n${history}` : "C'est la première question.",
      "Pose une seule question courte sur ce contenu déjà lu. Si une réponse vient d'être donnée, commence par un retour bienveillant de deux phrases, puis la question suivante. N'invente pas de notions absentes du contenu.",
    ].join("\n\n"),
    {
      type: "object",
      properties: {
        question: { type: "string" },
        feedback: { type: "string" },
      },
      required: ["question", "feedback"],
    },
    "Tu es le coach de révision d'une formation. Tu tutoies l'apprenant. Tu ne parles que du contenu fourni. Réponds en JSON { question, feedback }.",
  );

  const question = String(result?.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Le coach est indisponible pour le moment." }, { status: 503 });
  }
  return NextResponse.json({
    question,
    feedback: String(result?.feedback ?? "").trim(),
  });
}
