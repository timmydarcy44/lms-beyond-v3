import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";
import { PDFParse } from "pdf-parse";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractCourseText(snapshot: any): string {
  const sections = Array.isArray(snapshot?.sections) ? snapshot.sections : [];
  const lines: string[] = [];
  for (const s of sections) {
    if (s?.title) lines.push(`# ${String(s.title)}`);
    const chapters = Array.isArray(s?.chapters) ? s.chapters : [];
    for (const ch of chapters) {
      if (ch?.title) lines.push(`## ${String(ch.title)}`);
      if (ch?.content) lines.push(String(ch.content));
      const subs = Array.isArray(ch?.subchapters) ? ch.subchapters : [];
      for (const sub of subs) {
        if (sub?.title) lines.push(`### ${String(sub.title)}`);
        if (sub?.content) lines.push(String(sub.content));
      }
    }
  }
  return lines.join("\n").slice(0, 12000);
}

export async function POST(request: Request) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ? String(auth.user.id) : null;
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const formData = await request.formData();
    const pdf = formData.get("pdf") as File | null;
    const pathId = String(formData.get("pathId") ?? "").trim();
    const stepId = String(formData.get("stepId") ?? "").trim();
    const prevCourseId = String(formData.get("prevCourseId") ?? "").trim() || null;
    const minScoreRaw = String(formData.get("minScore") ?? "").trim();
    const minScore = Number(minScoreRaw);
    const threshold = Number.isFinite(minScore) ? Math.max(0, Math.min(100, Math.round(minScore))) : 75;

    if (!pdf || !pathId || !stepId || !isUuid(pathId)) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const buf = Buffer.from(await pdf.arrayBuffer());
    const parser = new PDFParse({ data: buf });
    let extracted = "";
    try {
      const textResult = await parser.getText();
      extracted = String(textResult.text ?? "").trim().slice(0, 12000);
    } finally {
      await parser.destroy();
    }

    const client = getOpenAIClient();
    if (!client) return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 });

    let courseText = "";
    if (prevCourseId && isUuid(prevCourseId)) {
      const snap = await getCourseBuilderSnapshot(prevCourseId);
      courseText = snap ? extractCourseText(snap) : "";
    }

    const system = [
      "Tu es un évaluateur pédagogique bienveillant.",
      "Tu dois analyser un document PDF déposé par l'apprenant.",
      "Source 1 = contenu de la formation précédente (si fourni).",
      "Tolère les reformulations et une structure différente.",
      "Retourne uniquement un JSON { score: number(0..100), feedback: string }.",
    ].join(" ");

    const user = `Seuil de validation: ${threshold}%.\n\nSOURCE 1 (formation):\n${courseText || "(non fournie)"}\n\nTEXTE EXTRAIT DU PDF:\n${extracted || "(vide)"}`;

    const evalRes = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 350,
      response_format: { type: "json_object" },
    });

    const raw = evalRes.choices[0]?.message?.content || "{}";
    let parsed: { score?: number; feedback?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const score = typeof parsed.score === "number" && Number.isFinite(parsed.score) ? Math.round(parsed.score) : 0;
    const feedback = String(parsed.feedback ?? "").trim();
    const passed = score >= threshold;

    await supabase.from("path_trigger_submissions").insert({
      path_id: pathId,
      step_id: stepId,
      user_id: userId,
      type: "file_pdf",
      status: passed ? "passed" : "failed",
      score,
      feedback,
      extracted_text: extracted,
      mime_type: pdf.type || "application/pdf",
    } as any);

    return NextResponse.json({ passed, score, feedback });
  } catch (error) {
    console.error("[api/path-triggers/submit-pdf] error", error);
    return NextResponse.json({ error: "Erreur d'analyse PDF" }, { status: 500 });
  }
}
