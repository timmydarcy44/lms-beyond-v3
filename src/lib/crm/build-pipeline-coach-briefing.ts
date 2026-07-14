import type { BriefingActionType, DailyBriefing } from "@/lib/crm/daily-briefing-types";
import { isNextActionOverdue } from "@/lib/crm/pipeline-btob-commercial-options";

type PipelineDealRow = Record<string, unknown>;

const ACTIVE_STAGES = new Set([
  "a_appeler",
  "mail_envoye_catalogue",
  "presentation_programmee",
  "demo_realisee",
  "proposition_a_faire",
  "proposition_envoyee",
]);

const STAGE_LABELS: Record<string, string> = {
  a_appeler: "À appeler",
  mail_envoye_catalogue: "Mail envoyé + catalogue",
  presentation_programmee: "Présentation programmée",
  demo_realisee: "Démo réalisée",
  proposition_a_faire: "Proposition à faire",
  proposition_envoyee: "Proposition envoyée",
  reussi: "Réussi",
  echec: "Échec",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(dateStr: string): number {
  const d = new Date(`${dateStr}T12:00:00`);
  const today = new Date(`${todayIso()}T12:00:00`);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function pickActionType(deal: PipelineDealRow): BriefingActionType {
  const stage = String(deal.stage_slug ?? "");
  const email = deal.email ? String(deal.email) : "";
  const linkedin = deal.contact_linkedin ? String(deal.contact_linkedin) : "";
  if (stage === "mail_envoye_catalogue" && email) return "email";
  if (linkedin) return "linkedin";
  if (deal.phone) return "call";
  if (email) return "email";
  return "call";
}

function scoreDeal(deal: PipelineDealRow): number {
  let score = 0;
  const stage = String(deal.stage_slug ?? "");
  if (!ACTIVE_STAGES.has(stage)) return -1;

  const nextDate = deal.next_action_date ? String(deal.next_action_date).slice(0, 10) : "";
  if (nextDate) {
    if (isNextActionOverdue(nextDate)) score += 60;
    else if (nextDate === todayIso()) score += 50;
    else {
      const days = daysUntil(nextDate);
      if (days <= 2) score += 35;
      else if (days <= 7) score += 20;
    }
  }

  const engagement = Number(deal.engagement_score ?? 0);
  if (engagement >= 3) score += 35;
  else if (engagement === 2) score += 22;
  else if (engagement === 1) score += 10;

  const priority = String(deal.priority ?? "standard");
  if (priority === "haute") score += 30;
  else if (priority === "moyenne") score += 18;

  if (stage === "proposition_a_faire") score += 25;
  if (stage === "presentation_programmee") score += 20;
  if (stage === "demo_realisee") score += 22;

  if (!deal.last_contact_date && stage === "a_appeler") score += 12;

  return score;
}

function buildWhyToday(deal: PipelineDealRow): string {
  const parts: string[] = [];
  const company = String(deal.company_name ?? "Prospect");
  const nextDate = deal.next_action_date ? String(deal.next_action_date).slice(0, 10) : "";
  const engagement = Number(deal.engagement_score ?? 0);
  const stage = String(deal.stage_slug ?? "");
  const stageLabel = STAGE_LABELS[stage] ?? stage;

  if (nextDate && isNextActionOverdue(nextDate)) {
    const overdueDays = Math.abs(daysUntil(nextDate));
    parts.push(`action en retard de ${overdueDays} jour${overdueDays > 1 ? "s" : ""}`);
  } else if (nextDate === todayIso()) {
    parts.push("prochaine action prévue aujourd'hui");
  } else if (nextDate && daysUntil(nextDate) <= 2) {
    parts.push(`prochaine action dans ${daysUntil(nextDate)} jour(s)`);
  }

  if (engagement >= 3) {
    parts.push("score d'engagement maximal (3/3)");
  } else if (engagement === 2) {
    parts.push("bon engagement (2/3)");
  }

  if (deal.priority === "haute") {
    parts.push("priorité haute");
  }

  if (deal.next_action) {
    parts.push(`à faire : ${String(deal.next_action)}`);
  } else {
    parts.push(`étape « ${stageLabel} »`);
  }

  if (parts.length === 0) {
    return `${company} est à l'étape ${stageLabel} — relance recommandée.`;
  }

  return `${company} : ${parts.join(", ")}.`;
}

function buildCallScript(deal: PipelineDealRow) {
  const company = String(deal.company_name ?? "l'entreprise");
  const contact = deal.contact_first_name ? String(deal.contact_first_name) : "votre interlocuteur";
  return {
    hook: `Bonjour, c'est Timmy de Beyond. Je vous appelle suite à notre échange sur ${company}.`,
    pitch: `Je voulais faire le point avec ${contact} sur vos besoins formation et voir si un créneau de 15 minutes vous convient cette semaine.`,
    objection_time: `Je comprends. Je peux vous proposer un créneau de 10 minutes, ou un mail récap si c'est plus simple.`,
    objection_interest: `Pas de souci. Est-ce que le sujet formation interne est traité par quelqu'un d'autre chez vous ?`,
    goal: `Obtenir un créneau ou valider le bon contact chez ${company}.`,
  };
}

function buildEmailDraft(deal: PipelineDealRow) {
  const company = String(deal.company_name ?? "");
  const contact = deal.contact_first_name ? String(deal.contact_first_name) : "";
  const greeting = contact ? `Bonjour ${contact},` : "Bonjour,";
  return {
    subject: `${company} — point formation interne`,
    body: `${greeting}\n\nJe me permets de revenir vers vous suite à notre échange sur les enjeux formation chez ${company}.\n\nAuriez-vous 15 minutes cette semaine pour faire le point ?\n\nBien à vous,\nTimmy`,
  };
}

export function buildPipelineCoachBriefing(
  prospects: PipelineDealRow[],
  summary: {
    total: number;
    actions_overdue: number;
    actions_today: number;
    actions_this_week?: number;
    by_status?: Record<string, number>;
  },
): DailyBriefing {
  const active = prospects.filter((p) => ACTIVE_STAGES.has(String(p.stage_slug ?? "")));
  const ranked = active
    .map((deal) => ({ deal, score: scoreDeal(deal) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  const priorities = ranked.slice(0, 3).map(({ deal }, index) => {
    const action_type = pickActionType(deal);
    return {
      rank: index + 1,
      company: String(deal.company_name ?? "—"),
      why_today: buildWhyToday(deal),
      action_type,
      contact_name: deal.contact_first_name ? String(deal.contact_first_name) : null,
      contact_role: deal.contact_role ? String(deal.contact_role) : "Contact",
      email: action_type === "email" ? buildEmailDraft(deal) : null,
      call_script: action_type === "call" ? buildCallScript(deal) : null,
      linkedin_message:
        action_type === "linkedin"
          ? `Bonjour, je reviens vers vous concernant les enjeux formation chez ${deal.company_name}. Seriez-vous disponible pour un échange rapide ?`
          : null,
      prospect_id: String(deal.id ?? ""),
      contact_email: deal.email ? String(deal.email) : null,
    };
  });

  const highEngagement = active.filter((p) => Number(p.engagement_score ?? 0) >= 2);
  const overdueCount = summary.actions_overdue;
  const todayCount = summary.actions_today;

  let top_insight = `${active.length} prospect${active.length > 1 ? "s" : ""} actif${active.length > 1 ? "s" : ""} dans le pipeline.`;
  if (overdueCount > 0) {
    top_insight = `${overdueCount} action${overdueCount > 1 ? "s" : ""} en retard — commence par les relances urgentes.`;
  } else if (todayCount > 0) {
    top_insight = `${todayCount} action${todayCount > 1 ? "s" : ""} prévue${todayCount > 1 ? "s" : ""} aujourd'hui.`;
  } else if (highEngagement.length > 0) {
    top_insight = `${highEngagement.length} prospect${highEngagement.length > 1 ? "s" : ""} avec un engagement élevé — moment idéal pour avancer.`;
  } else if (ranked.length > 0) {
    top_insight = `Priorité : ${String(ranked[0].deal.company_name)} (${buildWhyToday(ranked[0].deal).split(":").slice(1).join(":").trim() || "à relancer"}).`;
  }

  const do_not_contact_today = prospects
    .filter((p) => {
      const stage = String(p.stage_slug ?? "");
      if (stage === "echec" || stage === "reussi") return true;
      const last = p.last_contact_date ? String(p.last_contact_date).slice(0, 10) : "";
      return last === todayIso();
    })
    .slice(0, 3)
    .map((p) => ({
      company: String(p.company_name ?? "—"),
      reason:
        String(p.stage_slug) === "echec"
          ? "deal classé échec"
          : String(p.stage_slug) === "reussi"
            ? "deal gagné — pas de relance commerciale"
            : "contacté aujourd'hui",
    }));

  let daily_tip = "Consulte le pipeline et mets à jour les prochaines actions après chaque contact.";
  if (overdueCount > 0) {
    daily_tip = "Traite d'abord les actions en retard avant d'ajouter de nouveaux prospects.";
  } else if (highEngagement.length > 0 && ranked[0]) {
    daily_tip = `Capitalise sur l'engagement de ${String(ranked[0].deal.company_name)} : propose un créneau concret cette semaine.`;
  } else if (active.length > 5) {
    daily_tip = "Tu as beaucoup de cartes ouvertes — concentre-toi sur 3 priorités max aujourd'hui.";
  }

  return {
    pipeline_status: {
      total: summary.total || active.length,
      actions_overdue: summary.actions_overdue,
      actions_today: summary.actions_today,
      top_insight,
    },
    priorities,
    max_priorities: priorities.length,
    do_not_contact_today,
    daily_tip,
  };
}

export function mergeBriefingWithPipelineData(
  aiBriefing: DailyBriefing,
  prospects: PipelineDealRow[],
  summary: Parameters<typeof buildPipelineCoachBriefing>[1],
): DailyBriefing {
  const dataBriefing = buildPipelineCoachBriefing(prospects, summary);

  const aiTotal = aiBriefing.pipeline_status?.total ?? 0;
  const aiHasPriorities = (aiBriefing.priorities?.length ?? 0) > 0;
  const hasProspects = prospects.length > 0;

  if (!hasProspects) {
    return aiBriefing;
  }

  if (aiTotal === 0 || !aiHasPriorities) {
    return dataBriefing;
  }

  return {
    ...aiBriefing,
    pipeline_status: {
      ...aiBriefing.pipeline_status,
      total: summary.total || dataBriefing.pipeline_status.total,
      actions_overdue: summary.actions_overdue,
      actions_today: summary.actions_today,
      top_insight: aiBriefing.pipeline_status.top_insight || dataBriefing.pipeline_status.top_insight,
    },
    max_priorities: aiBriefing.priorities.length || dataBriefing.max_priorities,
    do_not_contact_today:
      aiBriefing.do_not_contact_today.length > 0
        ? aiBriefing.do_not_contact_today
        : dataBriefing.do_not_contact_today,
    daily_tip: aiBriefing.daily_tip || dataBriefing.daily_tip,
  };
}
