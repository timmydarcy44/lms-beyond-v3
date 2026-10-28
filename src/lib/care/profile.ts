import { CARE_DOMAINS, type CareDomain } from "@/lib/care/domains";
import type { CareSessionFormat } from "@/lib/care/available-slots";
import { getServiceRoleClient } from "@/lib/supabase/server";
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

function asDomain(value: unknown): CareDomain | null {
  return CARE_DOMAINS.some((item) => item.id === value) ? (value as CareDomain) : null;
}

export async function loadPublishedCareSlugs() {
  const db = getServiceRoleClient();
  if (!db) return [];
  const { data } = await db.from("care_directory").select("slug");
  return (data ?? []).map((row) => String(row.slug)).filter(Boolean);
}

export async function loadCareProfileBySlug(
  slug: string,
  opts?: { viewerId?: string | null },
): Promise<CarePublicProfile | null> {
  const db = getServiceRoleClient();
  if (!db) return null;
  const { data: profile, error } = await db.from("care_profiles").select("*").eq("slug", slug).maybeSingle();
  if (error || !profile) return null;
  const expertId = String(profile.expert_id);
  const owner = Boolean(opts?.viewerId && opts.viewerId === expertId);
  if (!owner && (profile.published !== true || profile.is_care !== true)) return null;
  let servicesQuery = db.from("care_services").select("*").eq("expert_id", expertId).order("position");
  if (!owner) servicesQuery = servicesQuery.eq("active", true);
  const [services, experiences, trainings, badges] = await Promise.all([
    servicesQuery,
    db.from("care_experiences").select("*").eq("expert_id", expertId).order("position"),
    db.from("care_trainings").select("*").eq("expert_id", expertId).order("position"),
    db.from("care_expert_badges").select("badge_id, name, image_url, verification_url, awarded_at").eq("expert_id", expertId),
  ]);
  return {
    expert_id: expertId,
    slug: String(profile.slug),
    published: profile.published === true,
    is_care: profile.is_care === true,
    display_name: String(profile.display_name ?? ""),
    title: String(profile.title ?? ""),
    tagline: String(profile.tagline ?? ""),
    headline: String(profile.headline ?? ""),
    bio: String(profile.bio ?? ""),
    approach: String(profile.approach ?? ""),
    avatar_url: profile.avatar_url ? String(profile.avatar_url) : null,
    domains: (Array.isArray(profile.domains) ? profile.domains : []).map(asDomain).filter((item): item is CareDomain => Boolean(item)),
    publics: Array.isArray(profile.publics) ? profile.publics.map(String) : [],
    city: profile.city ? String(profile.city) : null,
    address: profile.address ? String(profile.address) : null,
    offers_cabinet: profile.offers_cabinet === true,
    offers_visio: profile.offers_visio === true,
    languages: Array.isArray(profile.languages) ? profile.languages.map(String) : [],
    payment_methods: Array.isArray(profile.payment_methods) ? profile.payment_methods.map(String) : [],
    cancellation_hours: Number(profile.cancellation_hours) || 24,
    member_since: profile.member_since ? String(profile.member_since) : null,
    services: (services.data ?? []).map((row) => ({
      id: String(row.id),
      expert_id: expertId,
      position: Number(row.position) || 0,
      name: String(row.name ?? ""),
      domain: asDomain(row.domain) ?? "famille",
      description: String(row.description ?? ""),
      duration_min: Number(row.duration_min) || 0,
      formats: (Array.isArray(row.formats) ? row.formats : []).filter((item): item is CareSessionFormat => item === "cabinet" || item === "visio"),
      price_cents: Number(row.price_cents) || 0,
      active: row.active !== false,
    })),
    experiences: (experiences.data ?? []).map((row) => ({
      id: String(row.id),
      position: Number(row.position) || 0,
      period_label: String(row.period_label ?? ""),
      role: String(row.role ?? ""),
      organization: String(row.organization ?? ""),
      description: String(row.description ?? ""),
    })),
    trainings: (trainings.data ?? []).map((row) => ({
      id: String(row.id),
      position: Number(row.position) || 0,
      year: String(row.year ?? ""),
      title: String(row.title ?? ""),
      organization: String(row.organization ?? ""),
    })),
    badges: (badges.data ?? []).map((row) => ({
      badge_id: String(row.badge_id),
      name: String(row.name ?? "Open Badge"),
      image_url: row.image_url ? String(row.image_url) : null,
      verification_url: String(row.verification_url ?? ""),
      awarded_at: row.awarded_at ? String(row.awarded_at) : null,
      issuer: "Byound",
    })),
  };
}

export async function loadPublishedCareProfile(slug: string): Promise<CarePublicProfile | null> {
  return loadCareProfileBySlug(slug);
}
