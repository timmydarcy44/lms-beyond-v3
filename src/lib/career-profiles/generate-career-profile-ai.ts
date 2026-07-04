import { generateJSON } from "@/lib/ai/openai-client";
import { slugifyCareerTitle } from "@/lib/career-profiles/career-profiles-repo";
import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

const EDGE_SOFT_SKILL_LABELS = SOFT_SKILLS.map((s) => s.titre);

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    slug: { type: "string" },
    sector: { type: "string" },
    description: { type: "string" },
    key_skills: { type: "array", items: { type: "string" } },
    soft_skills: { type: "array", items: { type: "string" } },
    behavioral_expectations: { type: "array", items: { type: "string" } },
    typical_challenges: { type: "array", items: { type: "string" } },
    success_factors: { type: "array", items: { type: "string" } },
    main_missions: { type: "array", items: { type: "string" } },
    useful_qualities: { type: "array", items: { type: "string" } },
    recommended_badges: { type: "array", items: { type: "string" } },
  },
  required: [
    "title",
    "slug",
    "sector",
    "description",
    "key_skills",
    "soft_skills",
    "behavioral_expectations",
    "typical_challenges",
    "success_factors",
    "main_missions",
    "useful_qualities",
    "recommended_badges",
  ],
};

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function normalizeCareerProfileContent(
  result: Record<string, unknown>,
  fallbackTitle: string,
  fallbackSector = "",
): CareerProfile {
  const slug = slugifyCareerTitle(String(result.slug ?? result.title ?? fallbackTitle));
  return {
    id: slug,
    slug,
    title: String(result.title ?? fallbackTitle).trim(),
    sector: String(result.sector ?? fallbackSector).trim() || "Autre",
    description: String(result.description ?? "").trim(),
    key_skills: Array.isArray(result.key_skills) ? result.key_skills.map(String).filter(Boolean) : [],
    soft_skills: Array.isArray(result.soft_skills) ? result.soft_skills.map(String).filter(Boolean) : [],
    behavioral_expectations: Array.isArray(result.behavioral_expectations)
      ? result.behavioral_expectations.map(String).filter(Boolean)
      : [],
    typical_challenges: Array.isArray(result.typical_challenges)
      ? result.typical_challenges.map(String).filter(Boolean)
      : [],
    success_factors: Array.isArray(result.success_factors)
      ? result.success_factors.map(String).filter(Boolean)
      : [],
    main_missions: Array.isArray(result.main_missions) ? result.main_missions.map(String).filter(Boolean) : [],
    useful_qualities: Array.isArray(result.useful_qualities)
      ? result.useful_qualities.map(String).filter(Boolean)
      : [],
    recommended_badges: Array.isArray(result.recommended_badges)
      ? result.recommended_badges.map(String).filter(Boolean)
      : ["Profil comportemental EDGE"],
    recommended_formations: [],
  };
}

export async function generateCareerProfileWithAi(params: {
  title: string;
  sector?: string;
  prompt?: string;
  existing?: Partial<CareerProfile>;
  mode?: "generate" | "improve";
}): Promise<CareerProfile | null> {
  const title = params.title.trim();
  const sector = params.sector?.trim() ?? "";
  const prompt = params.prompt?.trim() ?? "";

  if (!title && !prompt) return null;

  const systemPrompt =
    "Tu es expert RH et orientation professionnelle pour EDGE (France). Tu rédiges des fiches métiers pédagogiques en français. Réponds UNIQUEMENT en JSON valide. " +
    "key_skills = hard skills / compétences techniques et métier (6 à 10, courtes, en minuscules sauf noms propres). " +
    "soft_skills = compétences comportementales (5 à 8) : privilégie des libellés proches du référentiel EDGE listé ci-dessous, ou des synonymes courts comparables. " +
    "Pas de contenu médical ni psychologique clinique. Ton concret, professionnel, accessible.";

  const edgeSoftList = EDGE_SOFT_SKILL_LABELS.join(", ");

  const userPrompt = prompt
    ? `Génère une fiche métier EDGE complète.

Brief :
${prompt}

${title ? `Titre indicatif : ${title}` : ""}
${sector ? `Secteur indicatif : ${sector}` : ""}

Référentiel soft skills EDGE (à rapprocher pour soft_skills) :
${edgeSoftList}

Retourne le JSON avec : title, slug (kebab-case sans accents), sector, description (2-3 phrases), key_skills, soft_skills, behavioral_expectations (4-6), typical_challenges (4-6), success_factors (3-5), main_missions (4-6), useful_qualities (4-6), recommended_badges (1-3 badges EDGE génériques).`
    : `Génère une fiche métier EDGE complète pour : ${title}
Secteur : ${sector || "à préciser selon le métier"}

Référentiel soft skills EDGE (à rapprocher pour soft_skills) :
${edgeSoftList}

Retourne le JSON avec : title, slug (kebab-case sans accents), sector, description (2-3 phrases), key_skills, soft_skills, behavioral_expectations (4-6), typical_challenges (4-6), success_factors (3-5), main_missions (4-6), useful_qualities (4-6), recommended_badges (1-3).`;

  const improvePrompt =
    params.mode === "improve" && params.existing
      ? `Améliore et enrichis cette fiche métier EDGE (hard skills + soft skills surtout).

Contenu actuel :
${JSON.stringify(params.existing, null, 2)}

Référentiel soft skills EDGE :
${edgeSoftList}

Retourne le JSON complet mis à jour.`
      : userPrompt;

  const result = await generateJSON<Record<string, unknown>>(
    params.mode === "improve" ? improvePrompt : userPrompt,
    SCHEMA,
    systemPrompt,
  );

  if (!result) return null;
  return normalizeCareerProfileContent(result, title, sector);
}

export function careerTitlesMatch(a: string, b: string): boolean {
  return normalizeLabel(a) === normalizeLabel(b);
}
