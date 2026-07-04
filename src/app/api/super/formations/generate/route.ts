import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateJSON } from "@/lib/ai/openai-client";

const PROGRAM_STRUCTURE_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      chapters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            subchapters: {
              type: "array",
              items: {
                type: "object",
                properties: { id: { type: "string" }, title: { type: "string" } },
                required: ["id", "title"],
              },
            },
          },
          required: ["id", "title", "subchapters"],
        },
      },
    },
    required: ["id", "title", "chapters"],
  },
};

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    short_description: { type: "string" },
    long_description: { type: "string" },
    objectives: { type: "array", items: { type: "string" } },
    skills: { type: "array", items: { type: "string" } },
    benefits: { type: "array", items: { type: "string" } },
    why_choose: { type: "array", items: { type: "string" } },
    case_studies: { type: "array", items: { type: "string" } },
    deliverables: { type: "array", items: { type: "string" } },
    methodology: { type: "array", items: { type: "string" } },
    program_structure: PROGRAM_STRUCTURE_SCHEMA,
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
    "title",
    "short_description",
    "long_description",
    "objectives",
    "skills",
    "benefits",
    "why_choose",
    "case_studies",
    "deliverables",
    "methodology",
    "program_structure",
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
      "Tu es rédacteur formation professionnelle pour EDGE Business (France), style CEGOS/Orsys. Réponds UNIQUEMENT en JSON valide, en français, ton premium et concret. Prix en euros HT. intra_price = prix groupe, inter_price = prix par participant. program_structure = arborescence publique (sections avec description, chapitres, sous-chapitres optionnels) — PAS de contenu LMS (pas de vidéos/PDF). Génère des id uniques (uuid-like) pour chaque section/chapitre/sous-chapitre.";

    const sharedFields = `title, short_description, long_description, objectives (6-10), skills (8-12), benefits (4-6), why_choose (4-6), case_studies (3-5), deliverables (3-5), methodology (4-6), program_structure (2-4 sections, 3-6 chapitres/section, sous-chapitres si pertinent), prerequisites, audience (3-5), badge_name, inter_price, intra_price, formats, duration, level, meta_description (150-160 car.), seo_tags (8-12), faq (4-6 avec q et a)`;

    const userPrompt =
      mode === "improve"
        ? `Améliore et enrichis cette fiche formation EDGE.

Titre: ${title}
Domaine: ${domain || "—"}
Durée: ${duration || "—"}
Niveau: ${level || "—"}

Contenu actuel:
${JSON.stringify(existing, null, 2)}

Retourne le JSON complet avec: ${sharedFields}.`
        : `Génère une fiche formation professionnelle complète pour le catalogue EDGE Business.

Titre: ${title}
Domaine: ${domain || "Management & compétences"}
Durée: ${duration || "2 jours"}
Niveau: ${level || "Intermédiaire"}

Retourne le JSON avec: ${sharedFields}.`;

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
