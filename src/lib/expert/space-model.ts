export type MissionStatus = "nouvelle" | "acceptee" | "planifiee" | "terminee" | "annulee";
export type MissionBilling = "paid" | "to_invoice" | "upcoming" | "none";
export type SlotFormat = "visio" | "presentiel";
export type SlotKind = "indisponible" | "rendez_vous" | "formation" | "disponible";

export type ExpertMission = {
  id: string;
  title: string;
  client: string;
  startsAt: string;
  endsAt: string;
  format: SlotFormat;
  location: string;
  durationLabel: string;
  amountCents: number;
  status: MissionStatus;
  billing: MissionBilling;
  paidAt: string | null;
  visioUrl: string | null;
};

export type ExpertSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  format: SlotFormat;
  kind: SlotKind;
  location: string;
  missionId: string | null;
  title: string | null;
  client: string | null;
  clientId?: string | null;
};

export function slotKindFromRule(rule: unknown): SlotKind {
  const value = String(rule ?? "");
  if (value.includes("indisponible")) return "indisponible";
  if (value.includes("formation")) return "formation";
  if (value.includes("disponible")) return "disponible";
  return "rendez_vous";
}

export function slotClientIdFromRule(rule: unknown): string | null {
  const match = String(rule ?? "").match(/CLIENT:([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

export function encodeSlotRule(kind: SlotKind, weekly: boolean, clientId?: string | null) {
  return [kind, clientId ? `CLIENT:${clientId}` : null, weekly ? "WEEKLY" : null].filter(Boolean).join("|");
}

export type ExpertDocumentItem = {
  id: string;
  name: string;
  folder: "contrat" | "cv" | "attestation" | "facture" | "modele" | "autre";
  status: "to_sign" | "signed" | "deposited";
  uploadedAt: string;
  expiresAt: string | null;
  pages: number | null;
  url: string;
};

export type ExpertReview = {
  id: string;
  client: string;
  rating: number;
  body: string;
  mission: string;
  at: string;
};

export type ProfileSectionId = "titre" | "specialites" | "regions" | "formats" | "tarif" | "photo" | "bio";

export type ProfileVisibility = Record<ProfileSectionId, "public" | "private">;

export const PROFILE_SECTIONS: Array<{ id: ProfileSectionId; label: string; missing: string }> = [
  { id: "titre", label: "Titre", missing: "Renseigner votre titre" },
  { id: "specialites", label: "Spécialités", missing: "Ajouter vos spécialités" },
  { id: "regions", label: "Régions", missing: "Renseigner vos régions" },
  { id: "formats", label: "Formats", missing: "Renseigner vos formats" },
  { id: "tarif", label: "Tarif journalier", missing: "Renseigner votre tarif journalier" },
  { id: "photo", label: "Photo", missing: "Ajouter une photo" },
  { id: "bio", label: "Bio", missing: "Renseigner votre bio" },
];

export const DEFAULT_VISIBILITY: ProfileVisibility = {
  titre: "public",
  specialites: "public",
  regions: "public",
  formats: "public",
  tarif: "private",
  photo: "public",
  bio: "public",
};

export type RevenueLine = {
  id: string;
  title: string;
  client: string;
  at: string;
  amountCents: number;
  bucket: "paid" | "upcoming";
  pill: "paid" | "upcoming" | "to_invoice";
  detail: string;
};

export function formatEuros(cents: number): string {
  const value = cents / 100;
  const whole = Number.isInteger(value);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(value);
}

export function formatSignedEuros(cents: number): string {
  return `+ ${formatEuros(cents)}`;
}

export function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function recentMonthKeys(now = new Date(), count = 3): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return monthKey(date);
  });
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  const label = date.toLocaleDateString("fr-FR", { month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function revenueLinesFromMissions(missions: ExpertMission[]): RevenueLine[] {
  return missions.flatMap((mission) => {
    if (mission.billing === "none" || mission.amountCents <= 0) return [];
    const at = mission.billing === "paid" ? mission.paidAt || mission.startsAt : mission.startsAt;
    const bucket = mission.billing === "paid" ? "paid" : "upcoming";
    const when = new Date(at);
    const detail =
      mission.billing === "paid"
        ? `${mission.client} · versé le ${when.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
        : `${mission.client} · ${when.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}`;
    return [
      {
        id: mission.id,
        title: mission.title,
        client: mission.client,
        at,
        amountCents: mission.amountCents,
        bucket,
        pill: mission.billing === "paid" ? "paid" : mission.billing,
        detail,
      },
    ];
  });
}

export function revenueForMonth(lines: RevenueLine[], month: string) {
  const inMonth = lines.filter((line) => monthKey(new Date(line.at)) === month);
  const paid = inMonth.filter((line) => line.bucket === "paid");
  const upcoming = inMonth.filter((line) => line.bucket === "upcoming");
  const paidCents = paid.reduce((sum, line) => sum + line.amountCents, 0);
  const upcomingCents = upcoming.reduce((sum, line) => sum + line.amountCents, 0);
  return {
    paid,
    upcoming,
    paidCents,
    upcomingCents,
    totalCents: paidCents + upcomingCents,
    toInvoice: upcoming.filter((line) => line.pill === "to_invoice"),
  };
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function atHour(day: Date, hour: number, minute = 0): string {
  const next = new Date(day);
  next.setHours(hour, minute, 0, 0);
  return next.toISOString();
}

export function weekdayShort(date: Date): string {
  const raw = date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function dayPhrase(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (isSameDay(date, now)) return `aujourd'hui ${time}`;
  const tomorrow = addDays(now, 1);
  if (isSameDay(date, tomorrow)) return `demain ${time}`;
  const weekday = date.toLocaleDateString("fr-FR", { weekday: "long" });
  return `${weekday} ${time}`;
}

export function longDayLabel(date: Date, now = new Date()): string {
  if (isSameDay(date, now)) {
    return `Aujourd'hui, ${date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`;
  }
  const label = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function withinJoinWindow(startsAt: string, endsAt: string, now = new Date()): boolean {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const current = now.getTime();
  return current >= start - 15 * 60 * 1000 && current <= end;
}

const CERT_CODES = /^(NTC|MEM|REM|RDC)$/i;

export function cleanClient(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || CERT_CODES.test(trimmed)) return null;
  return trimmed;
}

export function missionTitleFromLabel(label: string, expertFirstName: string): string {
  let title = label.trim();
  if (expertFirstName) {
    title = title.replace(new RegExp(`\\b${expertFirstName}\\b`, "ig"), "").replace(/\s*[·\-–]\s*/g, " ").replace(/\s+/g, " ").trim();
  }
  return title || "Mission";
}

export function slotsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart).getTime() < new Date(bEnd).getTime() && new Date(bStart).getTime() < new Date(aEnd).getTime();
}

export function documentExpiryLabel(expiresAt: string | null, now = new Date()): { label: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  const end = new Date(expiresAt);
  if (Number.isNaN(end.getTime())) return null;
  const days = Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0 || days > 30) return null;
  return { label: days <= 1 ? "Expire demain" : `Expire dans ${days} jours`, urgent: true };
}
