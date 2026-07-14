import { DEFAULT_PIPELINE_STAGES } from "@/lib/crm/pipeline-shared";
import { isNextActionOverdue } from "@/lib/crm/pipeline-btob-commercial-options";

export type DealIntelligenceInput = {
  stage_slug: string;
  company_name: string;
  contact_first_name: string;
  email?: string | null;
  phone?: string | null;
  amount_cents?: number;
  created_at?: string | null;
  updated_at?: string | null;
  catalog_email_sent_at?: string | null;
  quoted_course_ids?: string[] | null;
  decision_maker_identified?: boolean | null;
  decision_maker_name?: string | null;
  champion_name?: string | null;
  blocker_name?: string | null;
  finance_contact?: string | null;
  engagement_score?: number | null;
  last_contact_date?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  estimated_budget?: string | null;
  estimated_users?: number | null;
  employee_count?: string | null;
  contact_role?: string | null;
  contact_linkedin?: string | null;
  lost_reason?: string | null;
};

export type IntelligenceCheck = {
  ok: boolean;
  label: string;
};

export type TimelineEvent = {
  date: string;
  label: string;
  kind: "create" | "contact" | "mail" | "quote" | "action" | "update";
};

const STAGE_BENCHMARK_DAYS: Record<string, number> = {
  a_appeler: 5,
  mail_envoye_catalogue: 7,
  presentation_programmee: 10,
  demo_realisee: 8,
  proposition_a_faire: 8,
  proposition_envoyee: 14,
  reussi: 7,
  echec: 3,
};

const STAGE_LABELS = Object.fromEntries(
  DEFAULT_PIPELINE_STAGES.map((s) => [s.slug, s.label]),
);

function daysBetween(from: string | null | undefined, to = new Date()): number | null {
  if (!from) return null;
  const start = new Date(from.slice(0, 10));
  if (Number.isNaN(start.getTime())) return null;
  const end = to instanceof Date ? to : new Date(to);
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
}

function daysSinceLabel(days: number | null): string {
  if (days == null) return "—";
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "il y a 1 jour";
  return `il y a ${days} jours`;
}

export function computeDealIntelligence(input: DealIntelligenceInput) {
  const today = new Date().toISOString().slice(0, 10);
  const daysSinceContact = daysBetween(input.last_contact_date, new Date(today));
  const daysInStage = daysBetween(input.updated_at ?? input.created_at, new Date(today));
  const stageBenchmark = STAGE_BENCHMARK_DAYS[input.stage_slug] ?? 10;
  const hasQuote = (input.amount_cents ?? 0) > 0 || (input.quoted_course_ids?.length ?? 0) > 0;
  const hasNextAction = Boolean(input.next_action?.trim() && input.next_action_date);
  const nextActionFuture = Boolean(input.next_action_date && input.next_action_date >= today);
  const overdue = isNextActionOverdue(input.next_action_date);
  const decisionMaker =
    Boolean(input.decision_maker_identified)
    || Boolean(input.decision_maker_name?.trim());

  const checks: IntelligenceCheck[] = [
    {
      ok: daysSinceContact != null && daysSinceContact <= 7,
      label:
        daysSinceContact == null
          ? "aucun échange enregistré"
          : `dernier échange : ${daysSinceLabel(daysSinceContact)}`,
    },
    {
      ok: decisionMaker,
      label: decisionMaker ? "décideur identifié" : "aucun décideur identifié",
    },
    {
      ok: nextActionFuture,
      label: nextActionFuture
        ? `prochain rendez-vous / action : ${input.next_action_date?.slice(0, 10)}`
        : "aucune prochaine action planifiée",
    },
    {
      ok: hasQuote,
      label: hasQuote ? "devis ou montant renseigné" : "aucun devis associé",
    },
    {
      ok: Boolean(input.email?.trim()),
      label: input.email?.trim() ? "email contact renseigné" : "email manquant",
    },
    {
      ok: Boolean(input.phone?.trim()),
      label: input.phone?.trim() ? "téléphone renseigné" : "téléphone manquant",
    },
    {
      ok: !overdue,
      label: overdue ? "action en retard" : "aucun blocage de relance",
    },
    {
      ok: (input.engagement_score ?? 0) >= 2,
      label: `engagement : ${input.engagement_score ?? 0}/3`,
    },
  ];

  let healthScore = 35;
  if (daysSinceContact != null && daysSinceContact <= 3) healthScore += 18;
  else if (daysSinceContact != null && daysSinceContact <= 7) healthScore += 12;
  else if (daysSinceContact != null && daysSinceContact <= 14) healthScore += 4;
  else if (daysSinceContact != null && daysSinceContact >= 28) healthScore -= 22;

  if (decisionMaker) healthScore += 14;
  if (nextActionFuture) healthScore += 12;
  if (hasQuote) healthScore += 10;
  if (input.catalog_email_sent_at) healthScore += 6;
  healthScore += (input.engagement_score ?? 0) * 4;
  if (input.email?.trim()) healthScore += 4;
  if (input.phone?.trim()) healthScore += 4;
  if (overdue) healthScore -= 12;
  if (!hasNextAction) healthScore -= 10;
  if (input.stage_slug === "proposition_envoyee") healthScore += 8;
  if (input.stage_slug === "echec") healthScore = Math.min(healthScore, 25);

  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
  const signatureProbability = Math.max(5, Math.min(95, Math.round(healthScore * 0.92)));

  const healthLevel: "green" | "amber" | "red" =
    healthScore >= 70 ? "green" : healthScore >= 45 ? "amber" : "red";

  const contactName = input.contact_first_name?.trim() || "le contact";
  const roleHint = input.contact_role?.trim() ? ` (${input.contact_role})` : "";

  let nextBestAction = "";
  let nextBestIcon: "phone" | "mail" | "users" | "calendar" | "file" = "calendar";

  if (input.stage_slug === "echec") {
    nextBestAction = "Analyser la cause de perte et documenter le lost reason";
    nextBestIcon = "file";
  } else if (!decisionMaker) {
    nextBestAction = "Identifier le décideur";
    nextBestIcon = "users";
  } else if (input.stage_slug === "a_appeler" && input.phone?.trim()) {
    nextBestAction = `Appeler ${contactName}${roleHint}`;
    nextBestIcon = "phone";
  } else if (input.stage_slug === "a_appeler" && input.email?.trim()) {
    nextBestAction = `Envoyer un mail à ${contactName}`;
    nextBestIcon = "mail";
  } else if (input.stage_slug === "mail_envoye_catalogue") {
    nextBestAction = "Relancer après envoi du catalogue";
    nextBestIcon = "phone";
  } else if (input.stage_slug === "proposition_a_faire" && hasQuote) {
    nextBestAction = "Envoyer le devis V1";
    nextBestIcon = "file";
  } else if (input.stage_slug === "proposition_envoyee") {
    nextBestAction = "Relancer pour valider la proposition";
    nextBestIcon = "phone";
  } else if (!input.finance_contact?.trim() && hasQuote) {
    nextBestAction = "Identifier le DAF / finance";
    nextBestIcon = "users";
  } else if (!nextActionFuture) {
    nextBestAction = "Programmer un rendez-vous";
    nextBestIcon = "calendar";
  } else if (input.next_action?.trim()) {
    nextBestAction = input.next_action.trim();
    nextBestIcon = "calendar";
  } else {
    nextBestAction = "Enrichir la fiche prospect";
    nextBestIcon = "file";
  }

  const completenessItems = [
    { key: "budget", label: "le budget", done: Boolean(input.estimated_budget?.trim()) },
    {
      key: "decideur",
      label: "le décideur",
      done: decisionMaker,
    },
    {
      key: "date_decision",
      label: "la date de décision",
      done: Boolean(input.next_action_date?.trim()),
    },
    {
      key: "effectifs",
      label: "le nombre de salariés",
      done: Boolean(input.employee_count?.trim()) || (input.estimated_users ?? 0) > 0,
    },
    {
      key: "daf",
      label: "le DAF / finance",
      done: Boolean(input.finance_contact?.trim()),
    },
    { key: "email", label: "l'email", done: Boolean(input.email?.trim()) },
    { key: "tel", label: "le téléphone", done: Boolean(input.phone?.trim()) },
    { key: "linkedin", label: "LinkedIn", done: Boolean(input.contact_linkedin?.trim()) },
  ];
  const completenessDone = completenessItems.filter((i) => i.done).length;
  const completenessScore = Math.round((completenessDone / completenessItems.length) * 100);
  const missingFields = completenessItems.filter((i) => !i.done);

  let relationshipScore = 20;
  if (input.phone?.trim()) relationshipScore += 15;
  if (input.email?.trim()) relationshipScore += 10;
  if (input.contact_linkedin?.trim()) relationshipScore += 8;
  if (daysSinceContact != null && daysSinceContact <= 7) relationshipScore += 20;
  else if (daysSinceContact != null && daysSinceContact <= 21) relationshipScore += 10;
  relationshipScore += (input.engagement_score ?? 0) * 12;
  if (!input.phone?.trim() && !input.last_contact_date) relationshipScore -= 15;
  relationshipScore = Math.max(0, Math.min(100, Math.round(relationshipScore)));

  const velocityRisk = daysInStage != null && daysInStage > stageBenchmark * 2;
  const velocityWarning =
    daysInStage != null && daysInStage > stageBenchmark
      ? `Les dossiers comparables restent ${stageBenchmark} jours en moyenne dans « ${STAGE_LABELS[input.stage_slug] ?? input.stage_slug} ». Vous êtes à ${daysInStage} jours.`
      : null;

  const timeline: TimelineEvent[] = [];
  if (input.created_at) {
    timeline.push({ date: input.created_at.slice(0, 10), label: "Prospect créé", kind: "create" });
  }
  if (input.last_contact_date) {
    timeline.push({ date: input.last_contact_date.slice(0, 10), label: "Dernier contact", kind: "contact" });
  }
  if (input.catalog_email_sent_at) {
    timeline.push({
      date: input.catalog_email_sent_at.slice(0, 10),
      label: "Catalogue envoyé",
      kind: "mail",
    });
  }
  if (hasQuote) {
    timeline.push({
      date: (input.updated_at ?? input.created_at ?? today).slice(0, 10),
      label: "Devis / montant associé",
      kind: "quote",
    });
  }
  if (input.next_action_date && input.next_action) {
    timeline.push({
      date: input.next_action_date.slice(0, 10),
      label: `Action : ${input.next_action}`,
      kind: "action",
    });
  }
  timeline.sort((a, b) => a.date.localeCompare(b.date));

  return {
    healthScore,
    healthLevel,
    signatureProbability,
    checks,
    atRisk: healthLevel === "red" || overdue || velocityRisk,
    nextBestAction,
    nextBestIcon,
    completenessScore,
    missingFields,
    relationshipScore,
    daysInStage,
    stageBenchmark,
    stageLabel: STAGE_LABELS[input.stage_slug] ?? input.stage_slug,
    velocityRisk,
    velocityWarning,
    timeline,
  };
}

export function normalizeLinkedInUrl(raw: string | null | undefined): string | null {
  const u = String(raw ?? "").trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.includes("linkedin.com")) return `https://${u.replace(/^\/+/, "")}`;
  return null;
}
