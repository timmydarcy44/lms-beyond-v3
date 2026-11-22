import { generateJSON } from "@/lib/ai/openai-client";
import type { SkillRow } from "@/lib/skills/skill-catalog";

type LlmMatch = {
  best: { skill_id: string; confidence: number } | null;
  alternatives: Array<{ skill_id: string; confidence?: number }>;
};

export async function matchSkillsWithLlm(
  text: string,
  skills: SkillRow[],
): Promise<LlmMatch | null> {
  const catalog = skills.map((s) => ({
    id: s.id,
    label: s.label,
    description: s.description,
    aliases: s.aliases.slice(0, 8),
  }));

  const result = await generateJSON(
    `Texte saisi par l'apprenant : « ${text.replace(/"/g, "'")} »

Choisis la meilleure compétence du catalogue (ou null si aucune ne convient).
Propose jusqu'à 2 alternatives différentes de best.
confidence entre 0 et 1.`,
    {
      type: "object",
      properties: {
        best: {
          type: "object",
          properties: {
            skill_id: { type: "string" },
            confidence: { type: "number" },
          },
        },
        alternatives: {
          type: "array",
          items: {
            type: "object",
            properties: {
              skill_id: { type: "string" },
              confidence: { type: "number" },
            },
          },
        },
      },
      required: ["best", "alternatives"],
    },
    `Tu es un classifieur de compétences. Tu reçois UNIQUEMENT un texte libre et un catalogue.
Ne demande et n'utilise aucune donnée personnelle.
Réponds uniquement en JSON : { "best": { "skill_id": "...", "confidence": 0.0 } | null, "alternatives": [ { "skill_id": "...", "confidence": 0.0 } ] }
Les skill_id doivent exister dans ce catalogue :
${JSON.stringify(catalog)}`,
  );

  if (!result || typeof result !== "object") return null;
  const ids = new Set(skills.map((s) => s.id));
  const bestRaw = (result as LlmMatch).best;
  const best =
    bestRaw && ids.has(String(bestRaw.skill_id))
      ? {
          skill_id: String(bestRaw.skill_id),
          confidence: Math.max(0, Math.min(1, Number(bestRaw.confidence) || 0)),
        }
      : null;
  const alternatives = Array.isArray((result as LlmMatch).alternatives)
    ? (result as LlmMatch).alternatives
        .map((a) => ({
          skill_id: String(a.skill_id),
          confidence: Math.max(0, Math.min(1, Number(a.confidence) || 0)),
        }))
        .filter((a) => ids.has(a.skill_id) && a.skill_id !== best?.skill_id)
        .slice(0, 2)
    : [];
  return { best, alternatives };
}

const matchCache = new Map<string, { at: number; value: unknown }>();
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function getCachedMatch(key: string) {
  const hit = matchCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > 1000 * 60 * 60 * 6) {
    matchCache.delete(key);
    return null;
  }
  return hit.value;
}

export function setCachedMatch(key: string, value: unknown) {
  matchCache.set(key, { at: Date.now(), value });
}

export function consumeMatchRateLimit(userId: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
