import { NextRequest, NextResponse } from "next/server";

import { generateJSON } from "@/lib/ai/openai-client";
import { buildMetierAiSkillsFallback } from "@/lib/entreprise/metier-ai-skills-fallback";
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
          score: Math.max(0, Math.min(100, Number((item as { score?: unknown }).score) || 0)),
        }))
        .filter((item) => item.label)
        .slice(0, 12)
    : [];

  return {
    title,
    description: String(result.description ?? "").trim(),
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

  let body: { title?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Le nom du metier est requis" }, { status: 400 });
  }

  const prompt = `Pour le metier "${title}", propose:
- une description courte orientee RH / fiche metier
- 6 a 10 hard skills concretes
- 6 a 10 soft skills avec un score cible de 0 a 100

Reponds en francais, concret, operationnel, sans jargon inutile.`;

  const result = await generateJSON(
    prompt,
    SOFT_SKILL_SCHEMA,
    "Tu es un expert RH. Retourne uniquement un JSON propre, operationnel et exploitable dans un outil de creation de fiches metier.",
  );

  if (result) {
    return NextResponse.json(normalizePayload(title, result, "ai"));
  }

  // Quota OpenAI / cle absente : fallback local pour que le CTA demo reste utilisable
  return NextResponse.json(normalizePayload(title, buildMetierAiSkillsFallback(title), "fallback"));
}
