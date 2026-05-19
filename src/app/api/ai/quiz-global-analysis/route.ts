import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const score = typeof body.score === "number" ? body.score : Number(body.score);
    const radar = Array.isArray(body.radar) ? body.radar : [];
    const radarText = radar
      .map((r: { category?: string; correct?: number; total?: number; percent?: number }) =>
        `${r.category ?? "?"} : ${r.correct ?? 0}/${r.total ?? 0} (${r.percent ?? 0}%)`,
      )
      .join("\n");

    const brief = body.reviewBrief && typeof body.reviewBrief === "object" ? body.reviewBrief : null;
    const totals = brief?.totals && typeof brief.totals === "object" ? brief.totals : null;
    const wrongList = Array.isArray(brief?.wrong) ? brief.wrong : [];
    const correctThemes = Array.isArray(brief?.correctThemes) ? brief.correctThemes : [];

    const wrongLines =
      wrongList.length === 0
        ? "(Aucune erreur sur les questions posées — ou données non fournies.)"
        : wrongList
            .slice(0, 22)
            .map((w: { index?: number; theme?: string; question?: string; userAnswer?: string; expected?: string; explanation?: string }, i: number) => {
              const idx = typeof w.index === "number" ? w.index : i + 1;
              const theme = String(w.theme ?? "Général");
              const q = String(w.question ?? "");
              const ua = String(w.userAnswer ?? "");
              const ex = String(w.expected ?? "");
              const why = w.explanation ? String(w.explanation) : "";
              return `${idx}. [${theme}] ${q}\n   Réponse donnée : ${ua}\n   Attendu : ${ex}${why ? `\n   Explication : ${why}` : ""}`;
            })
            .join("\n\n");

    const strengthsThemes =
      correctThemes.length === 0
        ? "(Pas de détail par thème pour les réussites.)"
        : correctThemes
            .slice(0, 12)
            .map((c: { theme?: string; count?: number }) => `${c.theme ?? "?"} : ${c.count ?? 0} bonne(s) réponse(s)`)
            .join("\n");

    const statsLine =
      totals && typeof totals.answered === "number"
        ? `Questions prises en compte : ${totals.answered}, dont ${totals.correct ?? 0} correctes et ${totals.wrong ?? 0} incorrectes.`
        : "";

    const prompt = `Tu es un conseiller pédagogique expert pour un LMS. Tu analyses le résultat RÉEL d’un quiz.

Score global : ${score}/100.
${statsLine}

Synthèse par thème (radar) :
${radarText || "(non disponible)"}

Thèmes où l’apprenant a répondu correctement (nombre de bonnes réponses par thème) :
${strengthsThemes}

Détail des erreurs — tu DOIS t’appuyer sur cette liste pour les axes d’amélioration (concepts précis, formulations des questions, confusion éventuelle entre réponses) :
${wrongLines}

Réponds STRICTEMENT au format JSON suivant, sans markdown ni texte hors JSON :
{"strengths":["…"],"improvements":["…"],"comment":"…"}

Règles (français) :
- strengths : 2 à 4 puces courtes, précises, basées sur les thèmes ou questions réellement réussies ci-dessus (nomme les thèmes ou notions quand c’est possible). Évite les compliments vagues.
- improvements : 2 à 5 puces courtes ; chaque puce doit correspondre à une erreur listée ou à un thème faible du radar (cite le concept ou le type de question). Interdit les formulations génériques sans lien (ex. « améliorer la compréhension globale » sans préciser quoi).
- comment : une phrase de synthèse bienveillante et factuelle par rapport au score.
Si aucune erreur listée mais score < 100, tu peux proposer une consolidation sur les thèmes du radar les moins maîtrisés.`;

    const raw = await generateText(prompt, { maxTokens: 900 });
    if (!raw) {
      return NextResponse.json({ error: "IA indisponible" }, { status: 503 });
    }

    let parsed: { strengths?: string[]; improvements?: string[]; comment?: string };
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as typeof parsed;
    } catch {
      parsed = {
        strengths: ["Progression notée sur le parcours", "Engagement sur l’ensemble des questions"],
        improvements: ["Consolider les notions les moins maîtrisées", "Relire les explications des questions ratées"],
        comment: raw.slice(0, 400),
      };
    }

    return NextResponse.json({
      strengths: parsed.strengths ?? [],
      improvements: parsed.improvements ?? [],
      comment: parsed.comment ?? "",
    });
  } catch (e) {
    console.error("[quiz-global-analysis]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
