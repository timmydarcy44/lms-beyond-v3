import { NextRequest, NextResponse } from "next/server";
import { generateJSON, generateText } from "@/lib/ai/openai-client";
import { requireExpertWriter } from "@/lib/expert/formation-proposals";

export const dynamic = "force-dynamic";

const KINDS = new Set(["presentation", "content"]);

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const gate = await requireExpertWriter();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const body = await request.json().catch(() => null);
  const kind = String(body?.kind ?? "");
  if (!KINDS.has(kind)) return NextResponse.json({ error: "Type de texte inconnu." }, { status: 400 });
  const title = clip(body?.title, 160);
  const presentation = clip(body?.presentation, 4000);
  const objectives = clip(body?.objectives, 2000);
  if (title.length < 3) {
    return NextResponse.json({ error: "Indiquez d'abord le nom de la formation." }, { status: 400 });
  }
  if (kind === "content" && presentation.length < 40) {
    return NextResponse.json({ error: "Décrivez d'abord la formation." }, { status: 400 });
  }

  const prompt =
    kind === "presentation"
      ? `Titre : ${title}. Rédige la présentation d'une formation professionnelle pour le catalogue Byound. Deux paragraphes courts, en français, concrets. N'invente aucun chiffre, aucun client, aucun pourcentage.`
      : `Titre : ${title}. Présentation : ${presentation}. Objectifs : ${objectives || "non précisés"}. Propose le contenu en 4 à 6 modules. Chaque module commence par son titre, suivi d'une phrase. Français, concret. N'invente aucun chiffre.`;

  if (kind === "presentation") {
    const text = await generateText(prompt, { maxTokens: 500 });
    const clean = String(text ?? "").trim();
    if (clean.length < 40) return NextResponse.json({ error: "Byound AI n'a pas répondu." }, { status: 502 });
    return NextResponse.json({ text: clean });
  }

  const result = await generateJSON(
    prompt,
    { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
    "Tu réponds uniquement avec un JSON {\"text\": string}.",
  );
  const text = String(result?.text ?? "").trim();
  if (text.length < 40) return NextResponse.json({ error: "Byound AI n'a pas répondu." }, { status: 502 });
  return NextResponse.json({ text });
}
