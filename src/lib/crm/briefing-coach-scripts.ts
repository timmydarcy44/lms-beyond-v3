import type { BriefingPriority, DailyBriefing } from "@/lib/crm/daily-briefing-types";

/** Première phrase à l'ouverture du briefing. */
export function scriptIntro(): string {
  return "Bonjour Timmy. Voici tes priorités aujourd'hui.";
}

export function scriptPipeline(b: DailyBriefing): string {
  const s = b.pipeline_status;
  let text = `Pipeline : ${s.total} prospects.`;
  if (s.actions_overdue > 0) text += ` ${s.actions_overdue} en retard.`;
  if (s.actions_today > 0) text += ` ${s.actions_today} pour aujourd'hui.`;
  text += ` ${s.top_insight}`;
  return text;
}

export function scriptPriority(p: BriefingPriority): string {
  let text = `Priorité ${p.rank}, ${p.company}. ${p.why_today}`;
  if (p.contact_name) text += ` Contact : ${p.contact_name}.`;

  if (p.action_type === "email" && p.email) {
    text += ` Email. Objet : ${p.email.subject}. Brouillon à l'écran — tu valides avant envoi.`;
  } else if (p.action_type === "call" && p.call_script) {
    text += ` Appelle. Accroche : ${p.call_script.hook} Objectif : ${p.call_script.goal}.`;
  } else if (p.action_type === "linkedin" && p.linkedin_message) {
    text += ` LinkedIn. Message sur l'écran.`;
  }
  return text;
}

export function scriptAvoid(b: DailyBriefing): string {
  if (b.do_not_contact_today.length === 0) {
    return "Personne à éviter aujourd'hui.";
  }
  const items = b.do_not_contact_today.map((x) => `${x.company} : ${x.reason}`).join(". ");
  return `Ne pas contacter : ${items}`;
}

export function scriptTip(b: DailyBriefing): string {
  return `${b.daily_tip} Tu peux me parler ou écrire. Dis suivant pour avancer.`;
}
