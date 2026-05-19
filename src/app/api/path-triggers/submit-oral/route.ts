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
  return lines.join("\n").slice(0, 12000);
}

/** Titres sections / chapitres / sous-chapitres pour orienter les révisions sans donner le « script ». */
function extractCourseOutline(snapshot: unknown): string {
  const sections = Array.isArray((snapshot as { sections?: unknown })?.sections)
    ? (snapshot as { sections: unknown[] }).sections
    : [];
  const lines: string[] = [];
  for (const s of sections) {
    const sec = s as { title?: unknown; chapters?: unknown[] };
    if (sec?.title) lines.push(`Section : ${String(sec.title)}`);
    const chapters = Array.isArray(sec?.chapters) ? sec.chapters : [];
    for (const ch of chapters) {
      const chRow = ch as { title?: unknown; subchapters?: unknown[] };
      if (chRow?.title) lines.push(`- Chapitre : ${String(chRow.title)}`);
      const subs = Array.isArray(chRow?.subchapters) ? chRow.subchapters : [];
      for (const sub of subs) {
        const subRow = sub as { title?: unknown };
        if (subRow?.title) lines.push(`  · Sous-chapitre : ${String(subRow.title)}`);
      }
    }
  }
  return lines.join("\n").slice(0, 8000);
}

function coerceChaptersToReview(parsed: { chaptersToReview?: unknown }): string[] {
  const raw = Array.isArray(parsed.chaptersToReview) ? parsed.chaptersToReview : [];
  return raw
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

function coerceReviewQuestionsFirstPass(parsed: {
  reviewQuestions?: unknown;
  followUpQuestion?: string | null;
}): string[] {
  const fromArr = Array.isArray(parsed.reviewQuestions)
    ? parsed.reviewQuestions
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
  if (fromArr.length > 0) return fromArr;
  const fq =
    typeof parsed.followUpQuestion === "string" && parsed.followUpQuestion.trim().length > 0
      ? parsed.followUpQuestion.trim()
      : null;
  return fq ? [fq] : [];
}

export async function POST(request: Request) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ? String(auth.user.id) : null;
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const formData = await request.formData();
    const audio = formData.get("audio") as File | null;
    const pathId = String(formData.get("pathId") ?? "").trim();
    const stepId = String(formData.get("stepId") ?? "").trim();
    const prevCourseId = String(formData.get("prevCourseId") ?? "").trim() || null;
    const minScoreRaw = String(formData.get("minScore") ?? "").trim();
    const minScore = Number(minScoreRaw);
    const threshold = Number.isFinite(minScore) ? Math.max(0, Math.min(100, Math.round(minScore))) : 75;
    const textSupplement = String(formData.get("textSupplement") ?? "").trim();
    const priorTranscript = String(formData.get("priorTranscript") ?? "").trim();

    if (!pathId || !stepId || !isUuid(pathId)) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const hasAudioFile = Boolean(audio && typeof audio.size === "number" && audio.size > 0);
    const isSupplementEval =
      !hasAudioFile && textSupplement.length >= 15 && priorTranscript.length >= 20;

    if (!hasAudioFile && !isSupplementEval) {
      return NextResponse.json(
        { error: "Fichier audio ou vidéo requis, ou complément écrit (min. 15 caractères) avec transcription initiale." },
        { status: 400 },
      );
    }

    const submissionTypeRaw = String(formData.get("submissionType") ?? "").trim();
    const mime = hasAudioFile ? String(audio?.type || "").trim() : "";
    const inferredVideo =
      submissionTypeRaw === "video" || (hasAudioFile && mime.startsWith("video/"));

    const client = getOpenAIClient();
    if (!client) return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 });

    let transcript = "";
    if (isSupplementEval) {
      transcript = [
        "TRANSCRIPTION ORALE INITIALE :",
        priorTranscript.trim(),
        "",
        "RÉPONSE ÉCRITE COMPLÉMENTAIRE (suite aux questions posées) :",
        textSupplement.trim(),
      ].join("\n");
    } else {
      const transcriptionResponse = await client.audio.transcriptions.create({
        file: audio as File,
        model: "whisper-1",
        response_format: "text",
      });
      transcript =
        typeof transcriptionResponse === "string"
          ? transcriptionResponse
          : (transcriptionResponse as { text?: string })?.text || "";
    }

    let courseText = "";
    let courseOutline = "";
    if (prevCourseId && isUuid(prevCourseId)) {
      const snap = await getCourseBuilderSnapshot(prevCourseId);
      if (snap) {
        courseOutline = extractCourseOutline(snap);
        courseText = extractCourseText(snap);
      }
    }

    const systemFirstPassBase = [
      "Tu es un évaluateur pédagogique bienveillant.",
      "Tu compares la transcription orale au référentiel (plan + extraits) pour estimer si les objectifs sont partiellement ou globalement couverts.",
      "Le champ feedback doit : (1) reconnaître ce qui est déjà pertinent ; (2) indiquer sans liste numérotée qu’il manque encore des éléments par rapport au programme ; (3) orienter la révision en citant UNIQUEMENT des titres de chapitres ou sous-chapitres issus du « plan » fourni — jamais le contenu détaillé à réciter.",
      "INTERDIT dans le feedback : énumération « 1) 2) 3) » de points à dire ; reformulations prêtes à l’oral ; arguments ou phrases que l’apprenant devrait prononcer ; résumé des chapitres.",
      "Si le plan de formation est absent, reste général (« revoir les parties non abordées du module ») sans inventer de faux titres.",
      "Longueur du feedback : environ 90 à 160 mots, en français.",
      "Score entier 0–100 selon l’adéquation globale.",
      "chaptersToReview : tableau JSON de 0 à 10 chaînes, chacune étant un titre EXACT de chapitre ou sous-chapitre présent dans le PLAN ci-dessous (pas de phrases libres). Si le plan est absent ou rien à cibler : [].",
      "Si le score est STRICTEMENT inférieur au seuil : reviewQuestions doit être un tableau JSON d’exactement 5 questions ouvertes courtes (une phrase chacune), chacune sur un angle différent encore fragile, sans donner la réponse ni un script à réciter ; ordre du plus général au plus ciblé.",
      "Si le score atteint ou dépasse le seuil : reviewQuestions doit être un tableau vide [].",
      "Réponse JSON uniquement : { \"score\": number, \"feedback\": string, \"reviewQuestions\": string[], \"chaptersToReview\": string[] }.",
    ].join(" ");

    const visionFrameFiles: File[] = [];
    if (!isSupplementEval && inferredVideo) {
      for (let i = 0; i < 6; i++) {
        const f = formData.get(`visionFrame${i}`) as File | null;
        if (f && typeof f.size === "number" && f.size > 0) visionFrameFiles.push(f);
      }
    }

    const systemFirstPass =
      inferredVideo && visionFrameFiles.length > 0
        ? [
            systemFirstPassBase,
            "Des images extraites de la vidéo d’écran sont jointes : décris d’abord ce qui est visible (interfaces, automatisations, création d’app Glide, etc.), puis croise avec la transcription ; la transcription peut être partielle.",
            "Lorsque les images montrent clairement le démonstrateur, fais primer l’analyse visuelle pour estimer la qualité de la démonstration.",
          ].join(" ")
        : inferredVideo
          ? [
              systemFirstPassBase,
              "Pour une vidéo sans images : si la transcription évoque ce qui est montré à l’écran, en tiens compte ; sinon reste prudent sur le sur-score.",
            ].join(" ")
          : systemFirstPassBase;

    const systemSupplement = [
      "Tu es un évaluateur pédagogique bienveillant.",
      "Tu réévalues la prestation après un complément écrit de l’apprenant, en tenant compte de la transcription orale initiale et de sa ou ses réponses écrites (le texte peut regrouver plusieurs paires question/réponse).",
      "Même exigences que pour un oral : pas de script à réciter, pas de liste numérotée de contenus à dire ; feedback orienté révision (titres de chapitres/sous-chapitres du plan si fourni).",
      "Pas de nouvelles questions au second passage : reviewQuestions doit être un tableau vide [].",
      "chaptersToReview doit être un tableau vide [].",
      "Réponse JSON uniquement : { \"score\": number, \"feedback\": string, \"reviewQuestions\": [], \"chaptersToReview\": [] }.",
    ].join(" ");

    const userFirst = [
      `Seuil de validation : ${threshold}%.`,
      "",
      "PLAN DE LA FORMATION (titres — pour cibler les révisions, pas pour les résumer) :",
      courseOutline || "(non fourni)",
      "",
      "EXTRAITS PÉDAGOGIQUES (référence, tronqués) :",
      courseText ? courseText.slice(0, 7000) : "(non fourni)",
      "",
      "TRANSCRIPTION ORALE :",
      transcript,
    ].join("\n");

    const userSupplement = [
      `Seuil de validation : ${threshold}%.`,
      "",
      "PLAN DE LA FORMATION (titres) :",
      courseOutline || "(non fourni)",
      "",
      "EXTRAITS PÉDAGOGIQUES (référence, tronqués) :",
      courseText ? courseText.slice(0, 7000) : "(non fourni)",
      "",
      "CONTENU À ÉVALUER (oral initial + complément écrit) :",
      transcript,
    ].join("\n");

    const userMessageFirstPass:
      | string
      | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> =
      !isSupplementEval && visionFrameFiles.length > 0
        ? [
            { type: "text" as const, text: userFirst },
            ...(await Promise.all(
              visionFrameFiles.map(async (f) => {
                const buf = Buffer.from(await f.arrayBuffer());
                const mt =
                  f.type && (f.type === "image/jpeg" || f.type === "image/png" || f.type === "image/webp")
                    ? f.type
                    : "image/jpeg";
                return {
                  type: "image_url" as const,
                  image_url: { url: `data:${mt};base64,${buf.toString("base64")}` },
                };
              }),
            )),
          ]
        : userFirst;

    const evalRes = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: isSupplementEval ? systemSupplement : systemFirstPass },
        { role: "user", content: isSupplementEval ? userSupplement : userMessageFirstPass },
      ],
      temperature: isSupplementEval ? 0.3 : 0.32,
      max_tokens: isSupplementEval ? 680 : 920,
      response_format: { type: "json_object" },
    });

    const raw = evalRes.choices[0]?.message?.content || "{}";
    let parsed: {
      score?: number;
      feedback?: string;
      followUpQuestion?: string | null;
      reviewQuestions?: unknown;
      chaptersToReview?: unknown;
    } = {};
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      parsed = {};
    }

    const score = typeof parsed.score === "number" && Number.isFinite(parsed.score) ? Math.round(parsed.score) : 0;
    const feedback = String(parsed.feedback ?? "").trim();
    const passed = score >= threshold;

    let reviewQuestions: string[] = [];
    if (isSupplementEval) {
      reviewQuestions = [];
    } else if (passed) {
      reviewQuestions = [];
    } else {
      reviewQuestions = coerceReviewQuestionsFirstPass(parsed);
    }

    const followUpQuestion = passed || reviewQuestions.length === 0 ? null : reviewQuestions[0];

    const chaptersToReview = isSupplementEval ? [] : coerceChaptersToReview(parsed);

    let submissionType: string;
    if (isSupplementEval) {
      submissionType = inferredVideo ? "video_presentation_supplement" : "oral_audio_supplement";
    } else {
      submissionType = inferredVideo ? "video_presentation" : "oral_audio";
    }

    const submissionRow: Record<string, string | number | null> = {
      path_id: pathId,
      step_id: stepId,
      user_id: userId,
      type: submissionType,
      status: passed ? "passed" : "failed",
      score,
      feedback,
      transcript,
      mime_type:
        mime ||
        (isSupplementEval ? "text/plain" : inferredVideo ? "video/webm" : "audio/webm"),
    };
    await supabase.from("path_trigger_submissions").insert(submissionRow);

    return NextResponse.json({
      passed,
      score,
      feedback,
      transcript,
      reviewQuestions,
      followUpQuestion,
      chaptersToReview,
    });
  } catch (error) {
    console.error("[api/path-triggers/submit-oral] error", error);
    return NextResponse.json({ error: "Erreur d'analyse orale" }, { status: 500 });
  }
}
