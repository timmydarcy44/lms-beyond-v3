import type { DailyBriefing } from "@/lib/crm/daily-briefing-types";

/** Briefing vide affiché quand l'IA ou le pipeline CRM n'a pas de données. */
export function emptyDailyBriefing(): DailyBriefing {
  return {
    pipeline_status: {
      total: 0,
      actions_overdue: 0,
      actions_today: 0,
      top_insight: "Aucune donnée pipeline pour le moment — ajoutez des prospects BTOB.",
    },
    priorities: [],
    max_priorities: 0,
    do_not_contact_today: [],
    daily_tip: "Consultez le pipeline CRM pour prioriser vos actions du jour.",
  };
}
