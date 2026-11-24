import { NextRequest, NextResponse } from "next/server";

import { generateJSON } from "@/lib/ai/openai-client";
import { buildMetierAiSkillsFallback } from "@/lib/entreprise/metier-ai-skills-fallback";
import { normalizeTargetToScale15 } from "@/lib/entreprise/skills-gap-config";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";

const SOFT_SKILL_SCHEMA = {
  type: "object",
  properties: {
    description: { type: "string" },
    hard_skills: { type: "array", items: { type: "string" } },
    soft_skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          score: { type: "number" },
        },
        required: ["label", "score"],
      },
    },
  },
  required: ["description", "hard_skills", "soft_skills"],
};

function normalizeSkillLabel(value: unknown) {
  return String(value ?? "").trim();
}

function normalizePayload(
  title: string,
  result: { description?: unknown; hard_skills?: unknown; soft_skills?: unknown },
  source: "ai" | "fallback",
  descriptionFallback?: string,
) {
  const hardSkills = Array.isArray(result.hard_skills)
    ? Array.from(
        new Set(
          result.hard_skills
            .map(normalizeSkillLabel)
            .filter(Boolean)
            .slice(0, 12),
        ),
      )
    : [];

  const softSkills = Array.isArray(result.soft_skills)
    ? result.soft_skills
        .map((item) => ({
          label: normalizeSkillLabel((item as { label?: unknown }).label),
          score: normalizeTargetToScale15(Number((item as { score?: unknown }).score) || 0),
        }))
        .filter((item) => item.label)
        .slice(0, 12)
    : [];

  return {
    title,
    description:
      String(result.description ?? "").trim() ||
      String(descriptionFallback ?? "").trim(),
    hard_skills: hardSkills,
    soft_skills: softSkills,
    source,
  };
}

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: { title?: unknown; sector?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const sector = String(body.sector ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "L’intitulé du métier est requis" }, { status: 400 });
  }

  const contextLines = [
    `Intitulé : ${title}`,
    sector ? `Secteur d’activité : ${sector}` : null,
    description ? `Description fournie par le RH :\n${description}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = `À partir du contexte RH suivant, construis une fiche métier exploitable :

${contextLines}

Propose :
- une description courte orientée RH / fiche métier (enrichis la description fournie si utile, sans la contredire)
- 6 à 10 hard skills concrètes, alignées sur le secteur et l’intitulé
- 6 à 10 soft skills avec un score cible de 3 à 15 (même échelle que le test Soft Skills Byound : 3 questions × Likert 1-5)

Réponds en français, concret, opérationnel, sans jargon inutile.`;

  const result = await generateJSON(
    prompt,
    SOFT_SKILL_SCHEMA,
    "Tu es un expert RH. Retourne uniquement un JSON propre, opérationnel et exploitable dans un outil de création de fiches métier.",
  );

  if (result) {
    return NextResponse.json(normalizePayload(title, result, "ai", description));
  }

  // Quota OpenAI / clé absente : fallback local enrichi par le titre (+ secteur si présent).
  const fallbackSeed = sector ? `${title} ${sector}` : title;
  return NextResponse.json(
    normalizePayload(title, buildMetierAiSkillsFallback(fallbackSeed), "fallback", description),
  );
}
