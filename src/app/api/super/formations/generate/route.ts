import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateJSON } from "@/lib/ai/openai-client";
import { normalizeAiProgramStructure } from "@/lib/training-courses/normalize-ai-program";

/** Même arborescence que le builder Programme : Section → Chapitre → Sous-chapitre. */
function programStructureSchema(opts?: { rich?: boolean }) {
  const rich = Boolean(opts?.rich);
  return {
    type: "array",
    minItems: rich ? 3 : 2,
    maxItems: 6,
    items: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Titre de la SECTION (ex. Introduction à l'Account Management)",
        },
        description: { type: "string", description: "Description courte de la section (1-2 phrases)" },
        chapters: {
          type: "array",
          minItems: rich ? 3 : 2,
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Titre du CHAPITRE, concret et opérationnel" },
              subchapters: {
                type: "array",
                minItems: rich ? 3 : 2,
                maxItems: 8,
                items: {
                  type: "string",
                  description: "Titre du SOUS-CHAPITRE (compétence ou activité précise)",
                },
              },
            },
            required: ["title", "subchapters"],
          },
        },
      },
      required: ["title", "description", "chapters"],
    },
  };
}

const PROGRAM_STRUCTURE_SCHEMA = programStructureSchema();
const PROGRAM_STRUCTURE_RICH_SCHEMA = programStructureSchema({ rich: true });

const PROGRAM_ONLY_SCHEMA = {
  type: "object",
  properties: {
    program: PROGRAM_STRUCTURE_RICH_SCHEMA,
  },
  required: ["program"],
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
    const mode =
      body.mode === "improve" ? "improve" : body.mode === "program" ? "program" : "generate";
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

    if ((mode === "improve" || mode === "program") && !title) {
      return NextResponse.json({ error: "Le titre est requis pour générer le programme." }, { status: 400 });
    }

    const programRules =
      "IMPORTANT — program = arborescence EXACTE du builder catalogue Byound : " +
      "SECTION (title + description) → CHAPITRES (title) → SOUS-CHAPITRES (tableau de strings titres). " +
      "Ne dis PAS « module » : utilise Section / Chapitre / Sous-chapitre. PAS de contenu LMS. " +
      "Titres concrets, progressifs, opérationnels (niveau CEGOS/Orsys). Chaque sous-chapitre = une activité ou compétence mesurable.";

    if (mode === "program") {
      const systemPrompt =
        "Tu es architecte pédagogique senior pour Byound Business (France). Réponds UNIQUEMENT en JSON valide, en français. " +
        programRules +
        " Exige une densité élevée : 3 à 5 sections, chaque section ≥ 3 chapitres, chaque chapitre ≥ 3 sous-chapitres. " +
        "La description de section précise l'intention pédagogique en 1-2 phrases. " +
        "Adapte le volume à la durée (1 jour ≈ 3 sections ; 2 jours ≈ 4 sections ; 3 jours ≈ 5 sections).";

      const existingProgram = existing?.program_structure ?? existing?.program ?? null;
      const userPrompt = `Génère UNIQUEMENT le programme détaillé (Section → Chapitre → Sous-chapitre) pour cette formation Byound.

Titre: ${title}
Domaine: ${domain || "—"}
Durée: ${duration || "2 jours"}
Niveau: ${level || "Intermédiaire"}
Public: ${audienceHint.length ? audienceHint.join(", ") : "—"}
Objectifs: ${Array.isArray(existing?.objectives) ? existing.objectives.join(" | ") : "—"}
Prérequis: ${existing?.prerequisites ? String(existing.prerequisites) : "—"}
Description: ${existing?.short_description ? String(existing.short_description) : "—"}
${existingProgram ? `\nProgramme actuel (à remplacer / enrichir) :\n${JSON.stringify(existingProgram, null, 2)}` : ""}

Retourne { "program": [ ... ] } avec densité maximale et titres qualitatifs.`;

      const result = await generateJSON<Record<string, unknown>>(
        userPrompt,
        PROGRAM_ONLY_SCHEMA,
        systemPrompt,
      );

      if (!result) {
        return NextResponse.json({ error: "IA indisponible — vérifiez OPENAI_API_KEY" }, { status: 503 });
      }

      const program_structure = normalizeAiProgramStructure(result.program ?? result.program_structure);
      const chapterCount = program_structure.reduce((n, s) => n + s.chapters.length, 0);
      const subCount = program_structure.reduce(
        (n, s) => n + s.chapters.reduce((m, c) => m + c.subchapters.length, 0),
        0,
      );
      if (program_structure.length < 3 || chapterCount < 6 || subCount < 12) {
        return NextResponse.json(
          {
            error:
              "L'IA n'a pas produit un programme assez dense (min. 3 sections, 3 chapitres/section, 3 sous-chapitres/chapitre). Relancez.",
            debug: {
              sections: program_structure.length,
              chapters: chapterCount,
              subchapters: subCount,
            },
          },
          { status: 422 },
        );
      }

      return NextResponse.json({ content: { program_structure } });
    }

    const systemPrompt =
      "Tu es rédacteur formation professionnelle pour Byound Business (France), style CEGOS/Orsys. Réponds UNIQUEMENT en JSON valide, en français, ton premium et concret. Prix en euros HT. intra_price = prix groupe, inter_price = prix par participant. " +
      programRules +
      " Minimum 2 sections, chaque section a au moins 2 chapitres, chaque chapitre a au moins 2 sous-chapitres. " +
      "slug = kebab-case sans accents. cover_prompt = description visuelle couverture. max_intra_participants = 12 par défaut si non précisé.";

    const sharedFields = `title, slug, short_description, long_description, domain, cover_prompt, objectives (6-10), skills (8-12), benefits (4-6), why_choose (4-6), case_studies (3-5), deliverables (3-5), methodology (4-6), program (2-4 SECTIONS ; chaque section: 2-6 CHAPITRES ; chaque chapitre: 2-6 SOUS-CHAPITRES obligatoires), prerequisites, audience (3-5), badge_name, inter_price, intra_price, max_intra_participants, formats, duration, level, meta_description (150-160 car.), seo_tags (8-12), faq (4-6 avec q et a)`;

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
        ? `Améliore et enrichis cette fiche formation Byound.

Titre: ${title}
Domaine: ${domain || "—"}
Durée: ${duration || "—"}
Niveau: ${level || "—"}

Contenu actuel:
${JSON.stringify(existing, null, 2)}

Retourne le JSON complet avec: ${sharedFields}.`
        : prompt
          ? `Génère une fiche formation professionnelle complète pour le catalogue Byound Business.

Brief admin :
${prompt}

${constraints ? `Contraintes complémentaires :\n${constraints}` : ""}

Retourne le JSON avec: ${sharedFields}.`
          : `Génère une fiche formation professionnelle complète pour le catalogue Byound Business.

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
    const chapterCount = program_structure.reduce((n, s) => n + s.chapters.length, 0);
    const subCount = program_structure.reduce(
      (n, s) => n + s.chapters.reduce((m, c) => m + c.subchapters.length, 0),
      0,
    );
    if (program_structure.length < 2 || chapterCount < 2 || subCount < 2) {
      return NextResponse.json(
        {
          error:
            "L'IA n'a pas produit un programme Section → Chapitre → Sous-chapitre complet. Relancez la génération.",
          debug: {
            sections: program_structure.length,
            chapters: chapterCount,
            subchapters: subCount,
          },
        },
        { status: 422 },
      );
    }

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
