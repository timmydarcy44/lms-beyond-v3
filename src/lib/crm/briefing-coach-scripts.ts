import type { BriefingPriority, DailyBriefing } from "@/lib/crm/daily-briefing-types";

function actionWord(p: BriefingPriority): string {
  if (p.action_type === "email") return "un mail";
  if (p.action_type === "call") return "un appel";
  return "LinkedIn";
}

/** Accroche intro (avant révélation une par une). */
export function scriptIntroGreeting(b: DailyBriefing): string {
  const count = b.priorities.length;
  if (count === 0) {
    return "Bonjour Timmy. Voici tes priorités aujourd'hui. Aucune priorité urgente dans le pipe line pour l'instant.";
  }
  return `Bonjour Timmy. Voici tes priorités aujourd'hui. Tu en as ${count}.`;
}

/** Une priorité à la fois (oral + affichage). */
export function scriptIntroPriorityLine(p: BriefingPriority): string {
  return `Priorité ${p.rank} : ${p.company}. ${p.why_today}. Action : ${actionWord(p)}.`;
}

/** @deprecated Utiliser scriptIntroGreeting + scriptIntroPriorityLine */
export function scriptIntro(b: DailyBriefing): string {
  const greeting = scriptIntroGreeting(b);
  if (b.priorities.length === 0) return greeting;
  const lines = b.priorities.map((p) => scriptIntroPriorityLine(p)).join(" ");
  return `${greeting} ${lines}`;
}

export function scriptPipeline(b: DailyBriefing): string {
  const s = b.pipeline_status;
  let text = `Sur ton pipe line : ${s.total} prospects.`;
  if (s.actions_overdue > 0) text += ` ${s.actions_overdue} en retard.`;
  if (s.actions_today > 0) text += ` ${s.actions_today} pour aujourd'hui.`;
  text += ` ${s.top_insight}`;
  return text;
}

export function scriptPriority(p: BriefingPriority): string {
  let text = `Détail priorité ${p.rank}, ${p.company}. ${p.why_today}`;
  if (p.contact_name) text += ` Contact : ${p.contact_name}.`;

  if (p.action_type === "email" && p.email) {
    text += ` Je te propose un mail. Objet : ${p.email.subject}. Tu valides avant envoi.`;
  } else if (p.action_type === "call" && p.call_script) {
    text += ` Appelle. Accroche : ${p.call_script.hook} Objectif : ${p.call_script.goal}.`;
  } else if (p.action_type === "linkedin" && p.linkedin_message) {
    text += ` Message LinkedIn à l'écran.`;
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
  return `${b.daily_tip} Parle-moi ou écris. Dis suivant pour avancer.`;
}
