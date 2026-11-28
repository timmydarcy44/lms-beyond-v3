export const CFA_SOURCE_FAMILIES = ["web", "human"] as const;
export type CfaSourceFamily = (typeof CFA_SOURCE_FAMILIES)[number];

export const CFA_SOURCE_CHANNELS = [
  "web_preregistration",
  "web_brochure",
  "phone",
  "jpo",
  "direct_meeting",
  "prescriber",
] as const;
export type CfaSourceChannel = (typeof CFA_SOURCE_CHANNELS)[number];

export const CFA_HUMAN_CHANNELS = ["phone", "jpo", "direct_meeting", "prescriber"] as const;
export type CfaHumanChannel = (typeof CFA_HUMAN_CHANNELS)[number];

export const CFA_PROSPECT_STATUSES = ["new", "to_call", "called", "not_interested"] as const;
export type CfaProspectStatus = (typeof CFA_PROSPECT_STATUSES)[number];

export const CFA_PRESCRIBER_TYPES = [
  { value: "mission_locale", label: "Mission locale" },
  { value: "france_travail", label: "France Travail" },
  { value: "cio", label: "CIO" },
  { value: "autre", label: "Autre" },
] as const;
export type CfaPrescriberType = (typeof CFA_PRESCRIBER_TYPES)[number]["value"];

export const CFA_TOUCH_TYPES = [
  "brochure_download",
  "preregistration",
  "email_sent",
  "email_opened",
  "call",
  "meeting",
  "stage_change",
  "created",
  "follow_up",
] as const;
export type CfaTouchType = (typeof CFA_TOUCH_TYPES)[number];

export const CFA_CHANNEL_META: Record<
  CfaSourceChannel,
  { family: CfaSourceFamily; familyLabel: string; label: string; color: string }
> = {
  web_preregistration: { family: "web", familyLabel: "Site web", label: "Pré-inscription", color: "#FF9B54" },
  web_brochure: { family: "web", familyLabel: "Site web", label: "Plaquette", color: "#FF9B54" },
  phone: { family: "human", familyLabel: "Humain", label: "Contact téléphonique", color: "#8DB8FF" },
  jpo: { family: "human", familyLabel: "Humain", label: "JPO", color: "#F2CF6B" },
  direct_meeting: { family: "human", familyLabel: "Humain", label: "Rencontre directe", color: "#FF7AC6" },
  prescriber: { family: "human", familyLabel: "Humain", label: "Prescripteur", color: "#6BE39B" },
};

export const UNKNOWN_ORIGIN_META = { familyLabel: "", label: "Origine inconnue", color: "#6C7593" };

export function isCfaSourceChannel(value: string | null | undefined): value is CfaSourceChannel {
  return CFA_SOURCE_CHANNELS.includes(String(value ?? "") as CfaSourceChannel);
}

export function channelMeta(channel: string | null | undefined) {
  if (isCfaSourceChannel(channel)) return CFA_CHANNEL_META[channel];
  return UNKNOWN_ORIGIN_META;
}

export function formatCreatedByInitials(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const first = String(firstName ?? "").trim();
  const last = String(lastName ?? "").trim();
  if (first && last) return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  const local = String(email ?? "").split("@")[0] ?? "";
  return local.slice(0, 2).toUpperCase() || "—";
}

export function formatCreatedByShort(firstName?: string | null, lastName?: string | null) {
  const first = String(firstName ?? "").trim();
  const last = String(lastName ?? "").trim();
  if (first && last) return `${first} ${last.slice(0, 1)}.`;
  return first || "l’équipe";
}

export function relativeReceivedLabel(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "—";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "—";
  const diff = Math.max(0, now - time);
  const hours = Math.floor(diff / 36e5);
  if (hours < 1) return "à l’instant";
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 21) return `il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(time));
}

export function originShortPrecision(input: {
  sourceChannel: string | null | undefined;
  sourceDetail?: string | null;
  prescriberType?: string | null;
  utmSource?: string | null;
  createdByInitials?: string | null;
  promotedFromProspect?: boolean;
  firstTouch?: string | null;
}): { pill: string; color: string; detail: string } {
  const channel = isCfaSourceChannel(input.sourceChannel) ? input.sourceChannel : null;
  if (!channel) return { pill: "Origine inconnue", color: UNKNOWN_ORIGIN_META.color, detail: "" };
  const meta = CFA_CHANNEL_META[channel];
  const initials = String(input.createdByInitials ?? "").trim();
  const utm = String(input.utmSource ?? "").trim();
  const detail = String(input.sourceDetail ?? "").trim();
  const prescriber = CFA_PRESCRIBER_TYPES.find((item) => item.value === input.prescriberType)?.label;

  if (input.promotedFromProspect || (input.firstTouch === "web_brochure" && channel === "web_preregistration")) {
    return {
      pill: meta.label,
      color: meta.color,
      detail: `via Futurs candidats${utm ? ` · ${prettyUtm(utm)}` : ""}`,
    };
  }
  if (channel === "web_preregistration" || channel === "web_brochure") {
    return {
      pill: meta.label,
      color: meta.color,
      detail: utm ? `auto · ${prettyUtm(utm)}` : "auto",
    };
  }
  const humanCore = detail || prescriber || meta.label;
  return {
    pill: meta.label,
    color: meta.color,
    detail: initials ? `${humanCore} · ${initials}` : humanCore,
  };
}

export function prettyUtm(value: string) {
  const map: Record<string, string> = {
    instagram: "Instagram",
    ig: "Instagram",
    meta: "Meta",
    facebook: "Facebook",
    google: "Google",
    tiktok: "TikTok",
  };
  return map[value.toLowerCase()] ?? value;
}

export function prospectStatusLabel(status: string | null | undefined) {
  if (status === "to_call") return "À rappeler";
  if (status === "called") return "Rappelé";
  if (status === "not_interested") return "Pas intéressé";
  return "Nouveau";
}

export function isProspectStatus(value: string | null | undefined): value is CfaProspectStatus {
  return CFA_PROSPECT_STATUSES.includes(String(value ?? "") as CfaProspectStatus);
}

export function isCandidateStatus(status: string | null | undefined) {
  const value = String(status ?? "");
  return value !== "" && value !== "prospect" && value !== "rejected";
}

export function shouldPromoteStage(current: string, intended: "prospect" | "candidate") {
  if (intended !== "candidate") return false;
  return current === "prospect" || current === "brochure";
}
