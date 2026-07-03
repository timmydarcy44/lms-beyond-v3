import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateJSON } from "@/lib/ai/openai-client";

const SCHEMA = {
  type: "object",
  properties: {
    short_description: { type: "string" },
    long_description: { type: "string" },
    objectives: { type: "array", items: { type: "string" } },
    skills: { type: "array", items: { type: "string" } },
    program: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          duration: { type: "string" },
        },
        required: ["title", "duration"],
      },
    },
    prerequisites: { type: "string" },
    audience: { type: "array", items: { type: "string" } },
    badge_name: { type: "string" },
    inter_price: { type: "number" },
    intra_price: { type: "number" },
    formats: { type: "array", items: { type: "string" } },
    duration: { type: "string" },
    level: { type: "string" },
    meta_description: { type: "string" },
    seo_tags: { type: "array", items: { type: "string" } },
    why_choose: { type: "array", items: { type: "string" } },
    faq: {
      type: "array",
      items: {
        type: "object",
        properties: { q: { type: "string" }, a: { type: "string" } },
        required: ["q", "a"],
      },
    },
  },
  required: [
    "short_description",
    "long_description",
    "objectives",
    "skills",
    "program",
    "prerequisites",
    "audience",
    "badge_name",
    "inter_price",
    "intra_price",
    "formats",
    "duration",
    "level",
    "meta_description",
    "seo_tags",
    "why_choose",
    "faq",
  ],
};

export async function POST(request: NextRequest) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const mode = body.mode === "improve" ? "improve" : "generate";
    const title = String(body.title ?? "").trim();
    const domain = String(body.domain ?? "").trim();
    const duration = String(body.duration ?? "").trim();
    const level = String(body.level ?? "").trim();

    if (!title) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    const existing = body.existing ?? {};

    const systemPrompt =
      "Tu es rédacteur formation professionnelle pour EDGE Business (France). Réponds UNIQUEMENT en JSON valide, en français, ton premium et concret. Prix en euros HT. intra_price = prix groupe, inter_price = prix par participant.";

    const userPrompt =
      mode === "improve"
        ? `Améliore et enrichis cette fiche formation EDGE (reformule, structure mieux, garde la cohérence métier).

Titre: ${title}
Domaine: ${domain || "—"}
Durée: ${duration || "—"}
Niveau: ${level || "—"}

Contenu actuel:
${JSON.stringify(existing, null, 2)}

Retourne le JSON complet avec: short_description, long_description, objectives (5-8), skills (6-10), program (6-10 étapes avec title et duration), prerequisites, audience (3-5), badge_name, inter_price (number), intra_price (number), formats (Présentiel, Distanciel, Blended, Sur mesure), duration, level, meta_description (150-160 car.), seo_tags (8-12 mots-clés), why_choose (4-6 raisons), faq (4-6 questions avec q et a).`
        : `Génère une fiche formation professionnelle complète pour le catalogue EDGE Business.

Titre: ${title}
Domaine: ${domain || "Management & compétences"}
Durée: ${duration || "2 jours"}
Niveau: ${level || "Intermédiaire"}

Retourne le JSON avec: short_description (2 phrases), long_description (3-4 paragraphes séparés par \\n), objectives (5-8), skills (6-10), program (6-10 étapes avec title et duration), prerequisites, audience (3-5), badge_name (Open Badge EDGE), inter_price réaliste (number), intra_price (groupe, ~8x inter), formats, duration, level, meta_description (150-160 car.), seo_tags (8-12), why_choose (4-6), faq (4-6 avec q et a).`;

    const result = await generateJSON(userPrompt, SCHEMA, systemPrompt);

    if (!result) {
      return NextResponse.json({ error: "IA indisponible — vérifiez OPENAI_API_KEY" }, { status: 503 });
    }

    return NextResponse.json({ content: result });
  } catch (error) {
    console.error("[api/super/formations/generate] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
