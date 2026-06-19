import { getOpenAIClient } from "@/lib/ai/openai-client";
import { buildProfileAnalysisTestsSignature } from "@/lib/learner/profile-analysis";

export type CrossProfileOpeningInput = {
  discArchetype: string;
  idmcLevel: string;
  idmcStrengthPhrase: string;
  softSkillPhrases: string[];
};

export type StoredCrossProfileOpening = {
  text: string;
  generatedAt: string;
  testsSignature: string;
};

export function buildCrossProfileOpeningSignature(input: {
  discArchetype: string;
  idmcLevel: string;
  idmcStrengthPhrase: string;
  softSkillPhrases: string[];
}): string {
  return buildProfileAnalysisTestsSignature({
    discScores: { archetype: input.discArchetype },
    idmcScores: { level: input.idmcLevel, strength: input.idmcStrengthPhrase },
    softSkills: input.softSkillPhrases.map((skill, index) => ({ skill, score: 100 - index })),
  });
}

export function parseStoredCrossProfileOpening(raw: unknown): StoredCrossProfileOpening | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const text = typeof row.text === "string" ? row.text.trim() : "";
  if (!text) return null;
  return {
    text,
    generatedAt: typeof row.generated_at === "string" ? row.generated_at : "",
    testsSignature: typeof row.tests_signature === "string" ? row.tests_signature : "",
  };
}

function normalizeOpeningParagraph(text: string): string {
  const cleaned = text.replace(/^["'\s]+|["'\s]+$/g, "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= 350) return cleaned;
  const truncated = cleaned.slice(0, 350);
  const lastPeriod = truncated.lastIndexOf(".");
  if (lastPeriod > 200) return truncated.slice(0, lastPeriod + 1).trim();
  return `${truncated.replace(/[.,;:!?…]+$/, "").trim()}…`;
}

export async function generateCrossProfileOpeningParagraph(
  input: CrossProfileOpeningInput,
): Promise<string> {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error("OpenAI non configuré.");
  }

  const softSkillsLine =
    input.softSkillPhrases.length >= 2
      ? `${input.softSkillPhrases[0]}, ${input.softSkillPhrases[1]}`
      : input.softSkillPhrases[0] ?? "";

  const prompt = `Tu rédiges UNE phrase d'ouverture pour un email de résultats de diagnostic
commercial, ton EDGE : direct, sobre, jamais ronflant ni "coach de vie".

Données fournies :
- Archétype DISC : ${input.discArchetype}
- Niveau global IDMC : ${input.idmcLevel}
- Point fort méthodologique IDMC : ${input.idmcStrengthPhrase}
- Forces Soft Skills (top 2) : ${softSkillsLine}

Contraintes strictes :
- Commence exactement par "Vous êtes "
- 2 phrases maximum, 350 caractères maximum au total
- Mentionne l'archétype, le point fort IDMC, et au moins une Soft Skill
- Vouvoiement, présent de l'indicatif
- Aucune formule creuse ("vous êtes unique", "un parcours extraordinaire", etc.)
- Pas de point d'exclamation
- Sortie : uniquement le texte final, sans guillemets ni commentaire`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Tu rédiges des emails EDGE sobres et factuels. Respecte strictement les contraintes.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) throw new Error("Paragraphe vide.");
  const normalized = normalizeOpeningParagraph(raw);
  if (!normalized.startsWith("Vous êtes")) {
    throw new Error("Paragraphe invalide (doit commencer par « Vous êtes »).");
  }
  return normalized;
}

export async function resolveCrossProfileOpeningParagraph(
  input: CrossProfileOpeningInput,
  cached: StoredCrossProfileOpening | null,
): Promise<{ text: string; generatedAt: string; cached: boolean; testsSignature: string }> {
  const testsSignature = buildCrossProfileOpeningSignature(input);
  if (cached?.text && cached.testsSignature === testsSignature) {
    return {
      text: cached.text,
      generatedAt: cached.generatedAt || new Date().toISOString(),
      cached: true,
      testsSignature,
    };
  }

  const text = await generateCrossProfileOpeningParagraph(input);
  return {
    text,
    generatedAt: new Date().toISOString(),
    cached: false,
    testsSignature,
  };
}
