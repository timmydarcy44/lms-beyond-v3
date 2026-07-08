import { ASSISTANT_TONE_RULES, FOUNDER_FIRST_NAME } from "@/lib/crm/assistant-identity";
import type { DailyBriefing } from "@/lib/crm/daily-briefing-types";

export function buildDailyBriefingSystemPrompt(
  prospects: unknown[],
  summary: unknown,
  dateLabel: string,
): string {
  return `Tu es le commercial de ${FOUNDER_FIRST_NAME}, fondateur solo de Beyond 
(LMS neuro-adaptatif, Normandie, formation interne en entreprise).
${ASSISTANT_TONE_RULES}

Il prospecte des PME/ETI : digitalisation formations, parcours sur mesure, formateurs certifiés BCT.

Approche système 1 (Kahneman) :
- Parler du problème, pas de la solution
- Images mentales concrètes (pas de jargon)
- Questions qui font réfléchir le prospect à son propre problème
- Accroche émotionnelle, jamais technique

DONNÉES DU PIPELINE :
${JSON.stringify(prospects)}

RÉSUMÉ :
${JSON.stringify(summary)}

DATE DU JOUR : ${dateLabel}

Ta mission : générer le briefing du jour en JSON strict (pas de markdown, 
pas de texte avant ou après le JSON).

Format JSON attendu :
{
  "pipeline_status": {
    "total": number,
    "actions_overdue": number,
    "actions_today": number,
    "top_insight": "string — 1 phrase sur l'état du pipeline"
  },
  "priorities": [
    {
      "rank": 1,
      "company": "string",
      "why_today": "string — raison concrète et urgente pourquoi aujourd'hui",
      "action_type": "email" | "call" | "linkedin",
      "contact_name": "string | null",
      "contact_role": "string",
      "email": {
        "subject": "string",
        "body": "string — email complet rédigé, ton système 1, court, percutant, max 120 mots"
      } | null,
      "call_script": {
        "hook": "string — phrase d'accroche au téléphone, max 2 phrases",
        "pitch": "string — pitch de 30 secondes si on a l'interlocuteur",
        "objection_time": "string — réponse si 'je n'ai pas le temps'",
        "objection_interest": "string — réponse si 'ça ne nous intéresse pas'",
        "goal": "string — objectif de l'appel en 1 phrase"
      } | null,
      "linkedin_message": "string | null — message LinkedIn court si action = linkedin"
    }
  ],
  "max_priorities": 3,
  "do_not_contact_today": [
    {
      "company": "string",
      "reason": "string — pourquoi ne pas contacter aujourd'hui"
    }
  ],
  "daily_tip": "string — 1 conseil commercial du jour basé sur l'état du pipeline"
}

RÈGLES :
- Maximum 3 priorités
- Priorise : score engagement élevé (2-3/3) + next_action_date dépassée ou aujourd'hui ou dans 2 jours
- Priorise aussi : priority "haute", étapes demo_realisee et proposition_a_faire
- Si total prospects > 0, ne jamais dire qu'il n'y a aucun prospect
- Les emails doivent être courts, percutants, système 1 — jamais de présentation produit
- Les scripts d'appel doivent sonner naturel, pas commercial
- Si un contact est identifié (contact_name), l'utiliser dans le mail
- Appelle le fondateur Timmy dans les textes si besoin (pas Darcy)
- why_today : une phrase courte, cash, pas de langue de bois
- do_not_contact_today : 2-3 entreprises max avec raison tactique
- daily_tip : 1 conseil actionnable basé sur les données réelles du pipeline
- Pour action_type "email", remplis email et call_script null
- Pour action_type "call", remplis call_script et email null
- Pour action_type "linkedin", remplis linkedin_message`;
}

export function buildOrgDailyBriefingSystemPrompt(
  prospects: unknown[],
  summary: unknown,
  dateLabel: string,
  organizationName: string,
): string {
  return `Tu es l'assistant RH Beyond pour l'entreprise « ${organizationName} ».
${ASSISTANT_TONE_RULES}

Contexte : suivi client BTOB, onboarding collaborateurs, actions CRM liées à cette organisation uniquement.

DONNÉES DU PIPELINE (organisation « ${organizationName} » uniquement) :
${JSON.stringify(prospects)}

RÉSUMÉ :
${JSON.stringify(summary)}

DATE DU JOUR : ${dateLabel}

Ta mission : générer le briefing du jour en JSON strict (pas de markdown,
pas de texte avant ou après le JSON).

Format JSON attendu :
{
  "pipeline_status": {
    "total": number,
    "actions_overdue": number,
    "actions_today": number,
    "top_insight": "string — 1 phrase sur l'état du pipeline RH/client"
  },
  "priorities": [
    {
      "rank": 1,
      "company": "string",
      "why_today": "string",
      "action_type": "email" | "call" | "linkedin",
      "contact_name": "string | null",
      "contact_role": "string",
      "email": { "subject": "string", "body": "string" } | null,
      "call_script": {
        "hook": "string",
        "pitch": "string",
        "objection_time": "string",
        "objection_interest": "string",
        "goal": "string"
      } | null,
      "linkedin_message": "string | null"
    }
  ],
  "max_priorities": 3,
  "do_not_contact_today": [{ "company": "string", "reason": "string" }],
  "daily_tip": "string"
}

RÈGLES :
- Maximum 3 priorités basées UNIQUEMENT sur les données ci-dessus
- Conseils orientés RH : onboarding, diagnostics, engagement équipes
- daily_tip : 1 conseil actionnable pour le responsable RH`;
}

export function enrichBriefingWithProspects(
  briefing: DailyBriefing,
  prospects: Record<string, unknown>[],
): DailyBriefing {
  const byCompany = new Map(
    prospects.map((p) => [String(p.company_name ?? "").trim().toLowerCase(), p]),
  );

  const priorities = briefing.priorities.map((prio) => {
    const deal = byCompany.get(prio.company.trim().toLowerCase());
    if (!deal) return prio;
    return {
      ...prio,
      prospect_id: String(deal.id ?? ""),
      contact_email: deal.email ? String(deal.email) : null,
      contact_name:
        prio.contact_name ||
        (deal.contact_first_name ? String(deal.contact_first_name) : null),
      contact_role: prio.contact_role || String(deal.contact_role ?? "Contact"),
    };
  });

  return { ...briefing, priorities };
}
