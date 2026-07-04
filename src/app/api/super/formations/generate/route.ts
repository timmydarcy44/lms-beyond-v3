import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateJSON } from "@/lib/ai/openai-client";
import { normalizeAiProgramStructure } from "@/lib/training-courses/normalize-ai-program";

const PROGRAM_STRUCTURE_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      chapters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            duration: { type: "string" },
            subchapters: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["title"],
        },
      },
    },
    required: ["title", "chapters"],
  },
};

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    slug: { type: "string" },
    short_description: { type: "string" },
    long_description: { type: "string" },
    domain: { type: "string" },
    cover_prompt: { type: "string" },
    objectives: { type: "array", items: { type: "string" } },
    skills: { type: "array", items: { type: "string" } },
    benefits: { type: "array", items: { type: "string" } },
    why_choose: { type: "array", items: { type: "string" } },
    case_studies: { type: "array", items: { type: "string" } },
    deliverables: { type: "array", items: { type: "string" } },
    methodology: { type: "array", items: { type: "string" } },
    program: PROGRAM_STRUCTURE_SCHEMA,
    prerequisites: { type: "string" },
    audience: { type: "array", items: { type: "string" } },
    badge_name: { type: "string" },
    inter_price: { type: "number" },
    intra_price: { type: "number" },
    max_intra_participants: { type: "number" },
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
    "slug",
    "short_description",
    "long_description",
    "domain",
    "cover_prompt",
    "objectives",
    "skills",
    "benefits",
    "why_choose",
    "case_studies",
    "deliverables",
    "methodology",
    "program",
    "prerequisites",
    "audience",
    "badge_name",
    "inter_price",
    "intra_price",
    "max_intra_participants",
    "formats",
    "duration",
    "level",
    "meta_description",
    "seo_tags",
    "faq",
  ],
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseFormats(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    return raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function parseAudience(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    return raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function parseOptionalNumber(raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export async function POST(request: NextRequest) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const mode = body.mode === "improve" ? "improve" : "generate";
    const prompt = String(body.prompt ?? "").trim();
    const title = String(body.title ?? "").trim();
    const domain = String(body.domain ?? "").trim();
    const duration = String(body.duration ?? "").trim();
    const level = String(body.level ?? "").trim();
    const audienceHint = parseAudience(body.audience);
    const formatsHint = parseFormats(body.formats);
    const interPriceHint = parseOptionalNumber(body.inter_price);
    const intraPriceHint = parseOptionalNumber(body.intra_price);
    const existing = body.existing ?? {};

    if (mode === "generate" && !prompt && !title) {
      return NextResponse.json({ error: "Décrivez la formation souhaitée dans le prompt." }, { status: 400 });
    }

    if (mode === "improve" && !title) {
      return NextResponse.json({ error: "Le titre est requis pour améliorer une fiche." }, { status: 400 });
    }

    const systemPrompt =
      "Tu es rédacteur formation professionnelle pour EDGE Business (France), style CEGOS/Orsys. Réponds UNIQUEMENT en JSON valide, en français, ton premium et concret. Prix en euros HT. intra_price = prix groupe, inter_price = prix par participant. program = arborescence publique (sections avec description, chapitres avec duration optionnelle, sous-chapitres en tableau de strings) — PAS de contenu LMS. slug = kebab-case sans accents. cover_prompt = description visuelle pour générer une image de couverture professionnelle. max_intra_participants = 12 par défaut si non précisé.";

    const sharedFields = `title, slug, short_description, long_description, domain, cover_prompt, objectives (6-10), skills (8-12), benefits (4-6), why_choose (4-6), case_studies (3-5), deliverables (3-5), methodology (4-6), program (2-4 sections, 3-6 chapitres/section, sous-chapitres si pertinent), prerequisites, audience (3-5), badge_name, inter_price, intra_price, max_intra_participants, formats, duration, level, meta_description (150-160 car.), seo_tags (8-12), faq (4-6 avec q et a)`;

    const constraints = [
      domain ? `Domaine imposé : ${domain}` : null,
      duration ? `Durée imposée : ${duration}` : null,
      level ? `Niveau imposé : ${level}` : null,
      audienceHint.length ? `Public cible : ${audienceHint.join(", ")}` : null,
      formatsHint.length ? `Formats : ${formatsHint.join(", ")}` : null,
      interPriceHint != null ? `Prix inter (€ HT/participant) : ${interPriceHint}` : null,
      intraPriceHint != null ? `Prix intra (€ HT/groupe) : ${intraPriceHint}` : null,
    ]
      .filter(Boolean)
      .join("\n");

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
        : prompt
          ? `Génère une fiche formation professionnelle complète pour le catalogue EDGE Business.

Brief admin :
${prompt}

${constraints ? `Contraintes complémentaires :\n${constraints}` : ""}

Retourne le JSON avec: ${sharedFields}.`
          : `Génère une fiche formation professionnelle complète pour le catalogue EDGE Business.

Titre: ${title}
Domaine: ${domain || "Management & compétences"}
Durée: ${duration || "2 jours"}
Niveau: ${level || "Intermédiaire"}

Retourne le JSON avec: ${sharedFields}.`;

    const result = await generateJSON<Record<string, unknown>>(userPrompt, SCHEMA, systemPrompt);

    if (!result) {
      return NextResponse.json({ error: "IA indisponible — vérifiez OPENAI_API_KEY" }, { status: 503 });
    }

    const programRaw = result.program ?? result.program_structure;
    const program_structure = normalizeAiProgramStructure(programRaw);

    const content = {
      ...result,
      slug: slugify(String(result.slug ?? result.title ?? title ?? "formation")),
      domain: String(result.domain ?? domain ?? "").trim() || null,
      max_intra_participants: Number(result.max_intra_participants) || 12,
      program_structure,
      formats: Array.isArray(result.formats) ? result.formats : formatsHint,
      audience: Array.isArray(result.audience) ? result.audience : audienceHint,
      inter_price: result.inter_price ?? interPriceHint ?? null,
      intra_price: result.intra_price ?? intraPriceHint ?? null,
    };

    delete content.program;

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[api/super/formations/generate] error:", error);
    return NextResponse.json({ error: "Erreur interne lors de la génération" }, { status: 500 });
  }
}
