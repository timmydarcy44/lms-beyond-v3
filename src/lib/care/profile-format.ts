import { CARE_DOMAINS, type CareDomain } from "@/lib/care/domains";
import type { CareSessionFormat } from "@/lib/care/available-slots";
import type { CareProfile, CareService } from "@/lib/care/types";

export type CareExperience = {
  id: string;
  position: number;
  period_label: string;
  role: string;
  organization: string;
  description: string;
};

export type CareTraining = {
  id: string;
  position: number;
  year: string;
  title: string;
  organization: string;
};

export type CareExpertBadge = {
  badge_id: string;
  name: string;
  image_url: string | null;
  verification_url: string;
  awarded_at: string | null;
  issuer: string;
};

export type CarePublicProfile = CareProfile & {
  services: CareService[];
  experiences: CareExperience[];
  trainings: CareTraining[];
  badges: CareExpertBadge[];
};

export function hasCareText(value: string | null | undefined) {
  return Boolean(value?.replace(/\s+/g, " ").trim());
}

export function hasCarePublicText(value: string | null | undefined) {
  return hasCareText(value) && !isCarePlaceholderText(value);
}

export function isCarePlaceholderText(value: string | null | undefined) {
  const text = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return true;
  if (/^\[[^\]]+\]$/.test(text)) return true;
  if (/^(lorem|ipsum|todo|tbd|xxx+|placeholder)$/i.test(text)) return true;
  return false;
}

export function careDomainLabel(id: CareDomain | string) {
  return CARE_DOMAINS.find((item) => item.id === id)?.label ?? id;
}

export function formatCareDuration(minutes: number) {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} h`;
  if (minutes > 60) return `${Math.floor(minutes / 60)} h ${minutes % 60}`;
  return `${minutes} min`;
}

export function formatCareFormats(formats: CareSessionFormat[]) {
  return formats.map((item) => (item === "cabinet" ? "Cabinet" : "Visio")).join(" · ");
}

export const CARE_PAYMENT_LABELS: Record<string, string> = {
  on_site: "Sur place",
  card: "Carte",
  wallet: "Wallet",
};

export const CARE_LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
};
