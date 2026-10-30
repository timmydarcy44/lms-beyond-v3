import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "@/lib/ai/openai-client";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { findCatalogSkill, suggestCatalogSkills } from "@/lib/entreprise/offer-skill-catalog";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  title: z.string().trim().max(160),
  description: z.string().max(4000).optional(),
});

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ skills: [] });

  const heuristic = suggestCatalogSkills(parsed.data.title, parsed.data.description ?? "", 12);
  const shortlist = heuristic.slice(0, 12);
  if (!shortlist.length) return NextResponse.json({ skills: [] });

  const names = shortlist.map((skill) => skill.label).join("\n");
  const text = await generateText(
    `Choisis 6 compétences, et seulement celles-ci, pour le poste « ${parsed.data.title} ».
Liste autorisée, une compétence par ligne :
${names}
Réponds avec exactement 6 lignes, recopiées mot pour mot depuis la liste. Aucune compétence hors liste.`,
    { maxTokens: 200 },
  );
  const picked = String(text ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
    .map((line) => findCatalogSkill(line))
    .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill));
  const unique = [];
  for (const skill of picked) {
    if (unique.some((item) => item.label === skill.label)) continue;
    unique.push(skill);
    if (unique.length === 6) break;
  }
  return NextResponse.json({ skills: unique.length >= 4 ? unique : heuristic.slice(0, 6) });
}
