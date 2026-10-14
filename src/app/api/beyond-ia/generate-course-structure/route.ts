import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Squelette OpenAI : on garde un fallback mock pour le builder
// afin de permettre le flow end-to-end sans clé.
// (À remplacer par un appel OpenAI structuré quand prêt.)

type Payload = {
  title?: string;
  prompt?: string;
  openBadgeId?: string | null;
  mode?: "prompt" | "paste";
};

function structurePastedText(text: string, title: string) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const heading = /^(#{1,3}\s+|(chapitre|module|partie|section)\b[^\n]*|\d+[\.\)]\s+\S)/i;
  const sections: Array<{ title: string; chapters: Array<{ title: string; subChapters: string[] }> }> = [];
  let current = { title: title || "Contenu", chapters: [] as Array<{ title: string; subChapters: string[] }> };

  const pushChapter = (raw: string) => {
    const lines = raw.split(/\n/).map((line) => line.trim()).filter(Boolean);
    const [head, ...rest] = lines;
    if (!head) return;
    current.chapters.push({
      title: head.replace(/^#{1,3}\s+/, "").replace(/^\d+[\.\)]\s+/, "").slice(0, 140),
      subChapters: rest.map((line) => line.replace(/^[-•–]\s+/, "").replace(/^\d+\.\d+[\.\)]?\s+/, "")).filter(Boolean).slice(0, 8),
    });
  };

  for (const block of blocks.length ? blocks : [text.trim()]) {
    if (heading.test(block) && /^(section|module|partie)\b/i.test(block)) {
      if (current.chapters.length) sections.push(current);
      current = { title: block.split("\n")[0].replace(/^#{1,3}\s+/, "").slice(0, 140), chapters: [] };
      continue;
    }
    pushChapter(block);
  }
  if (current.chapters.length) sections.push(current);
  if (!sections.length) {
    sections.push({
      title: title || "Contenu",
      chapters: [{ title: "Contenu importé", subChapters: text.split(/\n/).map((line) => line.trim()).filter(Boolean).slice(0, 8) }],
    });
  }
  return {
    objectifs: [] as string[],
    sections,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;
    const title = String(body?.title ?? "").trim();
    const prompt = String(body?.prompt ?? "").trim();
    const mode = body?.mode === "paste" ? "paste" : "prompt";

    if (!title) {
      return NextResponse.json({ success: false, error: "Titre manquant" }, { status: 400 });
    }
    if (!prompt || prompt.length < 10) {
      return NextResponse.json({ success: false, error: "Prompt trop court" }, { status: 400 });
    }

    const systemPrompt =
      mode === "paste"
        ? "Tu structures un contenu déjà écrit en ossature de formation. Tu conserves les intitulés du texte. Tu n'inventes pas de chapitre absent du texte. Réponds en JSON."
        : "Tu es expert en pédagogie et expert en neuroscience des apprentissages. Propose un contenu concernant {le prompt de l'utilisateur} et propose une ossature de formation avec des sections (Modules), des chapitres (Leçons) et des sous-chapitres (Sous-Leçons) au format JSON."
            .replace("{le prompt de l'utilisateur}", prompt);

    const normalize = (raw: any) => {
      const sectionsRaw = Array.isArray(raw?.sections) ? raw.sections : [];
      const sections = sectionsRaw
        .map((s: any) => ({
          title: String(s?.title ?? "").trim(),
          chapters: Array.isArray(s?.chapters) ? s.chapters : [],
        }))
        .filter((s: any) => s.title);

      const objectifsRaw = raw?.objectifs ?? raw?.objectives ?? raw?.goals ?? null;
      const objectifs = Array.isArray(objectifsRaw)
        ? objectifsRaw.map((x: any) => String(x ?? "").trim()).filter((x: string) => x.length > 0).slice(0, 12)
        : [];

      return {
        sections: sections.map((s: any) => ({
          title: s.title,
          chapters: (s.chapters as any[])
            .map((c: any) => ({
              title: String(c?.title ?? "").trim(),
              subChapters: Array.isArray(c?.subChapters) ? c.subChapters : [],
            }))
            .filter((c: any) => c.title)
            .map((c: any) => ({
              title: c.title,
              subChapters: (c.subChapters as any[])
                .map((x: any) => String(x ?? "").trim())
                .filter((x: string) => x.length > 0),
            })),
        })),
        objectifs,
        meta: { openBadgeId: body?.openBadgeId ?? null, title },
      };
    };

    const fallback = normalize({
      objectifs: [
        "Comprendre les concepts clés et les erreurs fréquentes",
        "Appliquer une méthode opérationnelle en situation réelle",
        "Savoir évaluer sa progression et ajuster ses actions",
      ],
      sections: [
        {
          title: `Introduction — ${title}`,
          chapters: [{ title: "Contexte & enjeux", subChapters: ["Les enjeux terrain", "Erreurs fréquentes"] }],
        },
        {
          title: "Méthode",
          chapters: [
            { title: "Le modèle en 3 étapes", subChapters: ["Étape 1 — Diagnostiquer", "Étape 2 — Agir", "Étape 3 — Mesurer"] },
          ],
        },
        {
          title: "Mise en situation",
          chapters: [{ title: "Atelier final", subChapters: ["Plan d'action 14 jours"] }],
        },
      ],
    });

    // OpenAI (fallback sur mock si pas de clé)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const structure = mode === "paste" ? normalize(structurePastedText(prompt, title)) : fallback;
      return NextResponse.json({ success: true, structure, mode: mode === "paste" ? "paste" : "mock" });
    }

    const client = new OpenAI({ apiKey });
    const resp = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            `Titre: ${title}\n` +
            `Contraintes: Retourne UNIQUEMENT du JSON valide selon ce schéma:\n` +
            `{\n  "sections": [\n    {\n      "title": string,\n      "chapters": [\n        {\n          "title": string,\n          "subChapters": string[]\n        }\n      ]\n    }\n  ]\n}\n` +
            `ET ajoute un champ "objectifs": string[] (3 à 7 objectifs).\n` +
            (mode === "paste" ? `Contenu à structurer:\n${prompt}\n` : `Sujet: ${prompt}\n`),
        },
      ],
    });

    const text = resp.choices?.[0]?.message?.content ?? "";
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      const structure = mode === "paste" ? normalize(structurePastedText(prompt, title)) : fallback;
      return NextResponse.json({ success: true, structure, mode: "openai_parse_fallback" });
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch {
      const structure = mode === "paste" ? normalize(structurePastedText(prompt, title)) : fallback;
      return NextResponse.json({ success: true, structure, mode: "openai_json_fallback" });
    }

    const structure = normalize(parsed);
    if (!structure.sections.length) {
      return NextResponse.json({ success: true, structure: fallback, mode: "openai_empty_fallback" });
    }

    return NextResponse.json({ success: true, structure, mode: "openai" });
  } catch (error) {
    console.error("[beyond-ia/generate-course-structure] error", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

