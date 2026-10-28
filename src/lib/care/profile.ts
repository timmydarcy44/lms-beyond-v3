import { CARE_DOMAINS, type CareDomain } from "@/lib/care/domains";
import type { CareSessionFormat } from "@/lib/care/available-slots";
import { careCompleteness, isCareDirectoryComplete } from "@/lib/care/completeness";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { CarePublicProfile } from "@/lib/care/profile-format";

export {
  CARE_LANGUAGE_LABELS,
  CARE_PAYMENT_LABELS,
  careDomainLabel,
  formatCareDuration,
  formatCareFormats,
  hasCareText,
  type CareExperience,
  type CareExpertBadge,
  type CarePublicProfile,
  type CareTraining,
} from "@/lib/care/profile-format";

function asDomain(value: unknown): CareDomain | null {
  return CARE_DOMAINS.some((item) => item.id === value) ? (value as CareDomain) : null;
}

export async function loadPublishedCareSlugs() {
  const db = getServiceRoleClient();
  if (!db) return [];
  const { data } = await db
    .from("care_directory")
    .select("slug, avatar_url, title, tagline, domains, min_price_cents");
  return (data ?? [])
    .filter((row) =>
      isCareDirectoryComplete({
        avatar_url: row.avatar_url ? String(row.avatar_url) : null,
        title: String(row.title ?? ""),
        tagline: String(row.tagline ?? ""),
        domains: Array.isArray(row.domains) ? row.domains : [],
        min_price_cents: row.min_price_cents == null ? null : Number(row.min_price_cents),
      }),
    )
    .map((row) => String(row.slug))
    .filter(Boolean);
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
  const profile = await loadCareProfileBySlug(slug);
  if (!profile || !careCompleteness(profile).canPublish) return null;
  return profile;
}
