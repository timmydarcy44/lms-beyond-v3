import type { CfaCompanyStatus } from "@/lib/cfa-companies";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";

/** SIRET Byound Business — jamais une entreprise d'accueil. */
export const BYOUND_BUSINESS_SIRET = "13070905800015";

export const CFA_HOST_MAIL_REMINDER_DAYS = 7;
export const CFA_HOST_OFFER_REMINDER_DAYS = 7;

export type CfaHostStageId =
  | "to_contact"
  | "email_sent"
  | "appointment"
  | "creating_offer"
  | "recruiting"
  | "recruited";

export type CfaHostStage = {
  id: CfaHostStageId;
  /** Statuts DB affichés dans cette colonne (le premier est écrit au drop). */
  dbStatuses: CfaCompanyStatus[];
  label: string;
  color: string;
  emptyHint: string;
};

/** Ordre d’affichage maquette — mapping DB → libellé/couleur (sans renommer en base). */
export const CFA_HOST_STAGES: CfaHostStage[] = [
  {
    id: "to_contact",
    dbStatuses: ["to_contact"],
    label: "À contacter",
    color: "#9AA3BD",
    emptyHint: "Ajoutez une entreprise à contacter pour démarrer le parcours.",
  },
  {
    id: "email_sent",
    dbStatuses: ["email_sent"],
    label: "Mail envoyé",
    color: "#8DB8FF",
    emptyHint: "Glissez ici après l’envoi du premier message.",
  },
  {
    id: "appointment",
    dbStatuses: ["appointment"],
    label: "Rendez-vous",
    color: "#C9C2FF",
    emptyHint: "Glissez ici quand un rendez-vous est fixé.",
  },
  {
    id: "creating_offer",
    dbStatuses: ["creating_offer", "pending_decision"],
    label: "Création de l'offre",
    color: "#F2CF6B",
    emptyHint: "Glissez une entreprise ici quand une offre est en rédaction.",
  },
  {
    id: "recruiting",
    dbStatuses: ["recruiting"],
    label: "Recrutement en cours",
    color: "#5EDCC3",
    emptyHint: "Glissez une entreprise ici quand une offre est publiée.",
  },
  {
    id: "recruited",
    dbStatuses: ["recruited"],
    label: "Recrutement réussi",
    color: "#6BE39B",
    emptyHint: "Les recrutements réussis apparaissent ici.",
  },
];

const STAGE_BY_DB = new Map<CfaCompanyStatus, CfaHostStageId>();
for (const stage of CFA_HOST_STAGES) {
  for (const status of stage.dbStatuses) STAGE_BY_DB.set(status, stage.id);
}

export function hostStageFromStatus(status: string | null | undefined): CfaHostStageId | null {
  return STAGE_BY_DB.get(String(status ?? "") as CfaCompanyStatus) ?? null;
}

export function hostStageMeta(stageId: CfaHostStageId): CfaHostStage {
  return CFA_HOST_STAGES.find((s) => s.id === stageId)!;
}

export function dbStatusForHostStage(stageId: CfaHostStageId): CfaCompanyStatus {
  return hostStageMeta(stageId).dbStatuses[0]!;
}

export function cleanSiretDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export function isByoundBusinessSiret(siret: string | null | undefined) {
  return cleanSiretDigits(siret) === BYOUND_BUSINESS_SIRET;
}

const TRACK_COLORS: Record<string, string> = {
  ai_business: "#A99BFF",
  sport_business: "#5EDCC3",
  real_estate: "#8DB8FF",
  retail_experience: "#6BE39B",
  merchandising: "#F2CF6B",
  luxury_premium: "#C9C2FF",
  ai_management: "#A99BFF",
  business_performance: "#FFB86B",
  transition_innovation: "#5EDCC3",
  growth_acquisition: "#8DB8FF",
  entrepreneurship: "#F2CF6B",
  international_business: "#6BE39B",
  strategic_partnerships: "#C9C2FF",
};

export function trackColor(track: string | null | undefined) {
  if (!track) return "#6C7593";
  return TRACK_COLORS[track] || "#A99BFF";
}

export function trackOptions() {
  return CFA_SPECIALIZATIONS.map((item) => ({
    value: item.value,
    label: item.label,
    color: trackColor(item.value),
  }));
}

export function daysSince(iso: string | null | undefined, from = new Date()) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((from.getTime() - t) / (24 * 60 * 60 * 1000)));
}

export function relativeDaysAgo(iso: string | null | undefined) {
  const n = daysSince(iso);
  if (n == null) return null;
  if (n === 0) return "aujourd'hui";
  if (n === 1) return "il y a 1 j";
  return `il y a ${n} j`;
}

export function shortFrDate(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function shortFrWeekdayDate(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(date.getTime())) return null;
  const weekday = date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(/\.$/, "");
  const day = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${weekday} ${day}`;
}
