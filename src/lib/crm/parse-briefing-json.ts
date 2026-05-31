import type { DailyBriefing } from "@/lib/crm/daily-briefing-types";

export function parseBriefingJson(raw: string): DailyBriefing {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) text = fence[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Réponse IA sans JSON valide");
  }

  const parsed = JSON.parse(text.slice(start, end + 1)) as DailyBriefing;

  if (!parsed.pipeline_status || !Array.isArray(parsed.priorities)) {
    throw new Error("Structure de briefing invalide");
  }

  return parsed;
}
