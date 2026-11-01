import { getOpenAIClient } from "@/lib/ai/openai-client";
import { capableModel } from "@/lib/openbadges/badge-course-generation";
import { bindCriterionSource, workshopCriteria, type WorkshopCriterion } from "@/lib/openbadges/criterion-workshop";

const SYSTEM = `Tu proposes des critères d'évaluation Byound, en français. JSON strict :
{"criteria":[{"label":"geste publié sur le badge, sans chiffre","expectedOutcome":"seuil pour l'expert, non publié, avec « au moins »","source":"","competencyName":"nom exact d'une compétence donnée"}]}
Propose au plus 6 critères. 1 à 3 par compétence. Le titre est public : un verbe et son objet, sans « au moins » et sans chiffre. Verbes : repérer, analyser, concevoir, proposer, construire, mesurer, orienter, adapter, choisir, évaluer, distinguer, intégrer, tenir. Interdits en tête : comprendre, connaître, participer, savoir.
L'attendu n'est pas publié. Il fait au moins 18 mots et dit à l'expert quoi cocher, avec « au moins ».
Deux critères ne doivent pas évaluer la même action.
Si des compétences sont données, competencyName reprend exactement l'une d'elles. Chaque critère prouve une seule compétence. Il ne recopie pas un objectif pédagogique.
Si la donnée est une formation, source = le titre exact « Section n · titre ». Si c'est une présentation, source = la phrase exacte dont le critère découle.
N'invente aucune section ni aucune phrase absente du texte.`;

async function ask(user: string): Promise<WorkshopCriterion[]> {
  const openai = getOpenAIClient();
  if (!openai) throw new Error("Suggestion indisponible");
  const completion = await openai.chat.completions.create({
    model: capableModel(),
    temperature: 0.3,
    response_format: { type: "json_object" },
    max_tokens: 2500,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
  });
  const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as { criteria?: unknown };
  if (!Array.isArray(parsed.criteria)) return [];
  return parsed.criteria.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { label?: string; expectedOutcome?: string; source?: string; competencyName?: string };
    return [{
      label: String(row.label ?? "").trim(),
      expectedOutcome: String(row.expectedOutcome ?? "").trim(),
      source: String(row.source ?? "").trim(),
      competency: String(row.competencyName ?? "").trim(),
    }];
  });
}

export async function proposeEvaluationCriteria(
  sourceText: string,
  locked: WorkshopCriterion[],
  context: { sections?: Array<{ index: number; title: string }>; presentation?: string },
): Promise<{ kept: WorkshopCriterion[]; issues: string[] }> {
  const keptNote = locked.length
    ? `Critères déjà gardés, à ne pas reprendre :\n- ${locked.map((item) => item.label).join("\n- ")}`
    : "";
  const bind = (items: WorkshopCriterion[]) => items.map((item) => ({
    ...item,
    source: bindCriterionSource(item.source, context),
  }));
  let draft = bind(await ask([sourceText, keptNote].filter(Boolean).join("\n\n")));
  let result = workshopCriteria(draft, locked);
  if (result.kept.length + locked.length < 4) {
    draft = bind(await ask([
      sourceText,
      keptNote,
      `La tentative précédente a été écartée :\n- ${result.issues.join("\n- ")}`,
    ].filter(Boolean).join("\n\n")));
    result = workshopCriteria(draft, locked);
  }
  return result;
}
