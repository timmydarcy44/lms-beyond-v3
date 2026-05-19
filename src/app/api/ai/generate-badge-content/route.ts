import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const courseTitle = String(body?.courseTitle ?? "").trim();
    const badgeTitle = String(body?.badgeTitle ?? "").trim();
    const complexity = String(body?.complexity ?? "").trim();
    const type = String(body?.type ?? "").trim();
    const modality =
      body?.modality === "qcm" ||
      body?.modality === "case" ||
      body?.modality === "oral" ||
      body?.modality === "video" ||
      body?.modality === "qa_ia" ||
      body?.modality === "file"
        ? body.modality
        : null;
    const objectives = Array.isArray(body?.objectives) ? (body.objectives as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean) : [];
    const userPrompt = String(body?.userPrompt ?? "").trim();

    if (!badgeTitle) return NextResponse.json({ error: "badgeTitle requis" }, { status: 400 });
    if (type !== "proofs" && !modality) return NextResponse.json({ error: "modality invalide" }, { status: 400 });

    const context = [
      courseTitle ? `Titre formation: ${courseTitle}` : "",
      `Titre badge: ${badgeTitle}`,
      complexity ? `Complexité: ${complexity}` : "Complexité: (non spécifiée)",
      modality ? `Modalité: ${String(modality)}` : "",
      type ? `Type: ${type}` : "",
      objectives.length ? `Objectifs badge:\n- ${objectives.slice(0, 20).join("\n- ")}` : "",
      userPrompt ? `Instructions formateur (prioritaires):\n${userPrompt}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `${context}\n\n${(() => {
      if (type === "proofs") {
        return (
          "Retourne UNIQUEMENT du JSON valide (sans texte autour). " +
          "Format EXACT: un tableau JSON de strings (3 à 5 éléments max). " +
          "Contenu: livrables/preuves attendues concrets, actionnables et vérifiables, basés UNIQUEMENT sur les objectifs. " +
          "Exemple: [\"Livrable 1...\",\"Livrable 2...\"]"
        );
      }
      if (type === "internal_quiz" && modality === "qcm") {
        return (
          "Retourne UNIQUEMENT du JSON valide (sans texte autour). " +
          "Format EXACT: un tableau JSON de 5 objets. " +
          "Chaque objet doit inclure un champ \"type\" parmi: \"multiple_choice\" | \"true_false\" | \"fill_in_the_blank\". " +
          "Schémas EXACTS:\n" +
          "- multiple_choice: {\"type\":\"multiple_choice\",\"question\":string,\"options\":[string,string,string,string],\"correctIndex\":0|1|2|3}\n" +
          "- true_false: {\"type\":\"true_false\",\"question\":string,\"correctBoolean\":true|false}\n" +
          "- fill_in_the_blank: {\"type\":\"fill_in_the_blank\",\"question\":string,\"answer\":string}\n" +
          "Mix demandé: 2 multiple_choice, 2 true_false, 1 fill_in_the_blank. Français, niveau = complexité. " +
          "Base-toi sur le titre formation, titre badge et objectifs. Questions courtes, sans markdown."
        );
      }
      if (modality === "case") {
        return "Rédige un énoncé de mise en situation professionnelle complexe en français sur le sujet (titre formation + titre badge). Inclus: contexte, données, consignes, livrables attendus, critères de réussite. Ton premium, clair, concis.";
      }
      if (modality === "qcm") {
        return "Génère une proposition de QCM (pas le quiz complet): 8 à 12 questions types + ce qu'elles évaluent, sous forme de liste. Objectif: aider le formateur à créer le quiz dans le builder.";
      }
      if (modality === "oral") {
        return "Crée un script de mise en situation pour un pitch de 2 minutes en français sur le sujet (titre formation + titre badge). Inclus: contexte, consignes, structure, critères d'évaluation. Niveau = complexité.";
      }
      if (modality === "file") {
        return "Génère un énoncé de TP technique + une grille de correction: contexte, objectifs, livrables, contraintes, critères, barème (simple). Ton clair et actionnable.";
      }
      if (modality === "qa_ia") {
        return "Génère un sujet de Q&A guidé (1 phrase) + 5 questions de relance que l'IA posera à l'apprenant. Objectif: évaluer la compréhension.";
      }
      if (modality === "video") {
        return "Génère des consignes de présentation vidéo: durée, structure, points à couvrir, critères de réussite. Ton premium.";
      }
      return "Génère un contenu pertinent pour la modalité demandée.";
    })()}`;

    const text = await generateText(prompt, { maxTokens: 900 });
    if (!text) return NextResponse.json({ error: "IA indisponible" }, { status: 503 });

    const trimmed = text.trim();
    if (type === "proofs") {
      let items: string[] = [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          items = parsed.map((x) => String(x ?? "").trim()).filter(Boolean);
        } else if (
          parsed &&
          typeof parsed === "object" &&
          "items" in (parsed as Record<string, unknown>) &&
          Array.isArray((parsed as Record<string, unknown>).items)
        ) {
          const list = (parsed as Record<string, unknown>).items as unknown[];
          items = list.map((x) => String(x ?? "").trim()).filter(Boolean);
        }
      } catch {
        // fallback: parse lines
        items = trimmed
          .split("\n")
          .map((l) => l.replace(/^[-*•\s]+/, "").trim())
          .filter(Boolean);
      }
      items = items.slice(0, 5);
      return NextResponse.json({ proofsItems: items });
    }
    if (type === "internal_quiz" && modality === "qcm") {
      let items: Array<Record<string, unknown>> = [];
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          items = parsed
            .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : null))
            .filter(Boolean) as Array<Record<string, unknown>>;
        }
      } catch {
        // ignore
      }
      const cleaned = items
        .map((obj) => {
          const type = String(obj?.type ?? "").trim();
          const question = String(obj?.question ?? "").trim();
          if (!question) return null;
          if (type === "multiple_choice") {
            const optsRaw = Array.isArray(obj?.options) ? (obj.options as unknown[]) : [];
            const opts = optsRaw.map((o) => String(o ?? "").trim()).filter(Boolean);
            const ci = typeof obj?.correctIndex === "number" ? obj.correctIndex : Number(obj?.correctIndex);
            if (opts.length !== 4) return null;
            const correctIndex = Number.isFinite(ci) ? Math.max(0, Math.min(3, Math.floor(ci))) : 0;
            return {
              type: "multiple_choice",
              question,
              options: [opts[0], opts[1], opts[2], opts[3]] as [string, string, string, string],
              correctIndex,
            };
          }
          if (type === "true_false") {
            const cb =
              typeof obj?.correctBoolean === "boolean"
                ? obj.correctBoolean
                : String(obj?.correctBoolean ?? "").toLowerCase() === "true";
            return { type: "true_false", question, correctBoolean: cb };
          }
          if (type === "fill_in_the_blank") {
            const answer = String(obj?.answer ?? "").trim();
            if (!answer) return null;
            return { type: "fill_in_the_blank", question, answer };
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 12);

      return NextResponse.json({ internalQuiz: cleaned });
    }
    if (modality === "case") return NextResponse.json({ casePrompt: trimmed });
    if (modality === "qcm") return NextResponse.json({ qcmSuggestion: trimmed });
    if (modality === "oral") return NextResponse.json({ oralScenario: trimmed });
    if (modality === "file") return NextResponse.json({ fileUploadInstructions: trimmed });
    if (modality === "qa_ia") return NextResponse.json({ aiQaTopic: trimmed });
    if (modality === "video") return NextResponse.json({ videoInstructions: trimmed });
    return NextResponse.json({ text: trimmed });
  } catch (e) {
    console.error("[generate-badge-content]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

