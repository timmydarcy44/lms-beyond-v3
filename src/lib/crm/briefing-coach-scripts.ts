import type { BriefingPriority, DailyBriefing } from "@/lib/crm/daily-briefing-types";

export function scriptIntro(dateLabel: string): string {
  return `Bonjour Darcy. C'est ton commercial Beyond. On attaque la journée du ${dateLabel}. Je vais te guider pas à pas : état du pipeline, tes trois priorités, ce qu'il faut éviter, puis on enchaîne en conversation. Tu peux m'interrompre à tout moment en parlant, ou utiliser les boutons. C'est parti.`;
}

export function scriptPipeline(b: DailyBriefing): string {
  const s = b.pipeline_status;
  let text = `État du pipeline : ${s.total} prospects en cours.`;
  if (s.actions_overdue > 0) {
    text += ` Attention, ${s.actions_overdue} action${s.actions_overdue > 1 ? "s" : ""} en retard.`;
  }
  if (s.actions_today > 0) {
    text += ` ${s.actions_today} à traiter aujourd'hui.`;
  }
  text += ` Mon analyse : ${s.top_insight}`;
  return text;
}

export function scriptPriority(p: BriefingPriority): string {
  let text = `Priorité ${p.rank} : ${p.company}. Pourquoi aujourd'hui ? ${p.why_today}`;
  if (p.contact_name) text += ` Contact : ${p.contact_name}, ${p.contact_role}.`;

  if (p.action_type === "email" && p.email) {
    text += ` Je te recommande un email. Objet : ${p.email.subject}. Je t'affiche le brouillon à l'écran : dis-moi si tu veux le modifier avant tout envoi. Je ne partirai rien sans ton accord.`;
  } else if (p.action_type === "call" && p.call_script) {
    text += ` Action appel. Accroche : ${p.call_script.hook} Objectif : ${p.call_script.goal}. Le script complet est sous tes yeux.`;
  } else if (p.action_type === "linkedin" && p.linkedin_message) {
    text += ` Action LinkedIn. Message proposé : ${p.linkedin_message.slice(0, 120)}${p.linkedin_message.length > 120 ? "…" : ""}. Copie-le ou demande-moi une variante.`;
  }
  return text;
}

export function scriptAvoid(b: DailyBriefing): string {
  if (b.do_not_contact_today.length === 0) {
    return "Aucune entreprise à éviter aujourd'hui selon mon analyse. Tu peux prospecter sereinement sur le reste.";
  }
  const items = b.do_not_contact_today
    .map((x) => `${x.company}, car ${x.reason}`)
    .join(". ");
  return `À ne pas contacter aujourd'hui : ${items}`;
}

export function scriptTip(b: DailyBriefing): string {
  return `Conseil du jour : ${b.daily_tip} Maintenant je reste avec toi : parle-moi, pose des questions, demande un mail rédigé, ou dis « suivant » si tu veux revoir une priorité. Je réponds du tac au tac.`;
}
