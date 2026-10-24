import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "@/lib/ai/openai-client";
import {
  mergeDiscriminationFindings,
  scanOfferDiscrimination,
  type DiscriminationField,
  type DiscriminationFinding,
  type DiscriminationReason,
} from "@/lib/entreprise/offer-discrimination";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  title: z.string().max(160).optional(),
  description: z.string().max(12000).optional(),
  questions: z.array(z.object({
    id: z.string().max(40).optional(),
    prompt: z.string().max(240).optional(),
  })).max(3).optional(),
});

const REASONS = new Set<DiscriminationReason>(["âge", "sexe", "situation familiale", "origine", "santé"]);
const FIELDS = new Set<DiscriminationField>(["title", "description", "question"]);

function parseAiFindings(raw: string, input: z.infer<typeof bodySchema>): DiscriminationFinding[] {
  const jsonText = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  let parsed: { findings?: unknown };
  try {
    parsed = JSON.parse(jsonText) as { findings?: unknown };
  } catch {
    return [];
  }
  if (!Array.isArray(parsed.findings)) return [];
  const title = String(input.title ?? "");
  const description = String(input.description ?? "");
  const questions = input.questions ?? [];
  const findings: DiscriminationFinding[] = [];
  for (const item of parsed.findings) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const field = FIELDS.has(row.field as DiscriminationField) ? (row.field as DiscriminationField) : null;
    const reason = REASONS.has(row.reason as DiscriminationReason) ? (row.reason as DiscriminationReason) : null;
    const passage = String(row.passage ?? "").trim();
    const rewrite = String(row.rewrite ?? "").trim();
    if (!field || !reason || passage.length < 2 || rewrite.length < 2 || rewrite.length > 12000) continue;
    const source = field === "title" ? title : field === "description" ? description : questions.find((question) => question.id === row.questionId)?.prompt ?? questions.map((question) => question.prompt).join("\n");
    if (!source.toLowerCase().includes(passage.toLowerCase())) continue;
    if (/\bjunior\b/i.test(passage) && !/\bjeunes?\b/i.test(passage)) continue;
    findings.push({
      id: `${field}:${String(row.questionId ?? "")}:${passage.toLowerCase()}`,
      field,
      questionId: field === "question" ? String(row.questionId ?? questions[0]?.id ?? "") : undefined,
      passage,
      reason,
      rewrite,
    });
  }
  return findings;
}

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Texte à vérifier invalide" }, { status: 400 });

  const local = scanOfferDiscrimination(parsed.data);
  const prompt = `Tu vérifies une offre d'emploi en France. Repère uniquement âge, sexe, situation familiale, origine ou santé.
Ne signale pas « junior », « senior », ni un intitulé anglais comme « Account manager junior ».
« Commercial » sans écriture inclusive se reformule « Commercial·e ».
Réponds uniquement en JSON : {"findings":[{"field":"title"|"description"|"question","questionId":"","passage":"extrait exact","reason":"âge|sexe|situation familiale|origine|santé","rewrite":"champ entier reformulé"}]}
Si rien : {"findings":[]}
Intitulé : ${parsed.data.title || "(vide)"}
Description : ${parsed.data.description || "(vide)"}
Questions : ${(parsed.data.questions ?? []).map((question) => `${question.id ?? ""} : ${question.prompt ?? ""}`).join("\n") || "(aucune)"}`;

  const text = await generateText(prompt, { maxTokens: 700 });
  const findings = text ? mergeDiscriminationFindings(local, parseAiFindings(text, parsed.data)) : local;
  return NextResponse.json({ clean: findings.length === 0, findings });
}
