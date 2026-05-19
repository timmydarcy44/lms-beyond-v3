import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractCourseText(snapshot: unknown): string {
  const sections = Array.isArray((snapshot as { sections?: unknown })?.sections)
    ? (snapshot as { sections: unknown[] }).sections
    : [];
  const lines: string[] = [];
  for (const s of sections) {
    const sec = s as { title?: unknown; chapters?: unknown[] };
    if (sec?.title) lines.push(`# ${String(sec.title)}`);
    const chapters = Array.isArray(sec?.chapters) ? sec.chapters : [];
    for (const ch of chapters) {
      const chRow = ch as { title?: unknown; content?: unknown; subchapters?: unknown[] };
      if (chRow?.title) lines.push(`## ${String(chRow.title)}`);
      if (chRow?.content) lines.push(String(chRow.content));
      const subs = Array.isArray(chRow?.subchapters) ? chRow.subchapters : [];
      for (const sub of subs) {
        const subRow = sub as { title?: unknown; content?: unknown };
        if (subRow?.title) lines.push(`### ${String(subRow.title)}`);
        if (subRow?.content) lines.push(String(subRow.content));
      }
    }
  }
  return lines.join("\n").slice(0, 14000);
}

type Flashcard = { front: string; back: string };

export async function POST(request: Request) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const courseId = String(body?.courseId ?? "").trim();
    if (!courseId || !isUuid(courseId)) {
      return NextResponse.json({ error: "courseId invalide" }, { status: 400 });
    }

    const client = getOpenAIClient();
    if (!client) return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 });

    const snap = await getCourseBuilderSnapshot(courseId);
    const courseText = snap ? extractCourseText(snap) : "";
    if (!courseText.trim()) {
      return NextResponse.json({ error: "Contenu de formation introuvable" }, { status: 422 });
    }

    const system = [
      "Tu génères exactement 10 flashcards de révision en français pour un apprenant qui doit consolider le cours.",
      "Chaque carte : front = terme, notion ou question très courte (max ~120 caractères) ; back = explication ou réponse concise (max ~220 caractères).",
      "Couvre l’ensemble des thèmes du texte fourni (pas 10 fois le même sujet).",
      "Pas de markdown ; pas de numérotation dans les chaînes.",
      "Réponse JSON uniquement : { \"cards\": [ { \"front\": string, \"back\": string }, ... ] } avec exactement 10 éléments.",
    ].join(" ");

    const user = `Contenu du cours (extrait) :\n\n${courseText}`;

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.35,
      max_tokens: 1800,
      response_format: { type: "json_object" },
    });

    const raw = res.choices[0]?.message?.content || "{}";
    let cards: Flashcard[] = [];
    try {
      const parsed = JSON.parse(raw) as { cards?: unknown };
      const arr = Array.isArray(parsed?.cards) ? parsed.cards : [];
      cards = arr
        .map((row) => ({
          front: String((row as Flashcard)?.front ?? "").trim(),
          back: String((row as Flashcard)?.back ?? "").trim(),
        }))
        .filter((c) => c.front && c.back)
        .slice(0, 10);
    } catch {
      cards = [];
    }

    if (cards.length < 10) {
      return NextResponse.json({ error: "Génération incomplète des flashcards" }, { status: 502 });
    }

    return NextResponse.json({ cards });
  } catch (e) {
    console.error("[api/path-triggers/generate-oral-review-flashcards]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
