import { CARE_DOMAINS, type CareDomain } from "@/lib/care/domains";
import type { CareSessionFormat } from "@/lib/care/available-slots";
import { formatPersonName } from "@/lib/care/person-name";
import { isCareListingPublic, type CarePublicationService } from "@/lib/care/publication";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { hasCarePublicText, type CarePublicProfile } from "@/lib/care/profile-format";

export {
  CARE_LANGUAGE_LABELS,
  CARE_PAYMENT_LABELS,
  careDomainLabel,
  formatCareDuration,
  formatCareFormats,
  hasCareText,
  hasCarePublicText,
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
  const { data } = await db.from("care_profiles").select("slug, expert_id").eq("published", true).eq("is_care", true);
  const rows = data ?? [];
  const visible: string[] = [];
  for (const row of rows) {
    const profile = await loadPublishedCareProfile(String(row.slug));
    if (profile) visible.push(profile.slug);
  }
  return visible;
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
  const [services, experiences, trainings, badges, expert] = await Promise.all([
    servicesQuery,
    db.from("care_experiences").select("*").eq("expert_id", expertId).order("position"),
    db.from("care_trainings").select("*").eq("expert_id", expertId).order("position"),
    db.from("care_expert_badges").select("badge_id, name, image_url, verification_url, awarded_at").eq("expert_id", expertId),
    db.from("experts").select("first_name, last_name, headline, bio, avatar_url, photo_url, specialties, formats_supported, regions").eq("id", expertId).maybeSingle(),
  ]);
  const expertRow = expert.data;
  const expertName = [expertRow?.first_name, expertRow?.last_name].filter(Boolean).join(" ").trim();
  const expertFormats = Array.isArray(expertRow?.formats_supported) ? expertRow.formats_supported.map(String) : [];
  const offersCabinet = profile.offers_cabinet === true || expertFormats.some((item) => /cabinet|presentiel|sur site/i.test(item));
  const offersVisio = profile.offers_visio === true || expertFormats.some((item) => /visio|distanciel|en ligne/i.test(item));
  return {
    expert_id: expertId,
    slug: String(profile.slug),
    published: profile.published === true,
    is_care: profile.is_care === true,
    display_name: formatPersonName(
      hasCarePublicText(String(profile.display_name ?? "")) ? String(profile.display_name) : expertName,
    ) || expertName,
    title: hasCarePublicText(String(profile.title ?? "")) ? String(profile.title) : String(expertRow?.headline ?? "").trim(),
    tagline: hasCarePublicText(String(profile.tagline ?? "")) ? String(profile.tagline) : "",
    headline: hasCarePublicText(String(profile.headline ?? "")) ? String(profile.headline) : String(expertRow?.headline ?? "").trim(),
    bio: hasCarePublicText(String(profile.bio ?? "")) ? String(profile.bio) : String(expertRow?.bio ?? "").trim(),
    approach: String(profile.approach ?? ""),
    avatar_url:
      (profile.avatar_url ? String(profile.avatar_url) : null) ||
      (expertRow?.avatar_url ? String(expertRow.avatar_url) : null) ||
      (expertRow?.photo_url ? String(expertRow.photo_url) : null),
    domains: (Array.isArray(profile.domains) ? profile.domains : []).map(asDomain).filter((item): item is CareDomain => Boolean(item)),
    publics: Array.isArray(profile.publics) ? profile.publics.map(String) : [],
    city: hasCarePublicText(profile.city ? String(profile.city) : "")
      ? String(profile.city)
      : Array.isArray(expertRow?.regions)
        ? String(expertRow.regions[0] ?? "") || null
        : null,
    address: profile.address ? String(profile.address) : null,
    offers_cabinet: offersCabinet,
    offers_visio: offersVisio,
    languages: Array.isArray(profile.languages) ? profile.languages.map(String) : [],
    payment_methods: Array.isArray(profile.payment_methods) ? profile.payment_methods.map(String) : [],
    cancellation_hours: Number(profile.cancellation_hours) || 24,
    member_since: profile.member_since ? String(profile.member_since) : null,
    is_test: profile.is_test === true,
    services: (services.data ?? []).map((row) => ({
      id: String(row.id),
      expert_id: expertId,
      position: Number(row.position) || 0,
      name: String(row.name ?? "").trim() || "Séance",
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
  try {
    const profile = await loadCareProfileBySlug(slug);
    if (!profile) return null;
    const db = getServiceRoleClient();
    if (!db) return null;
    const [{ data: expert }, { data: membership }] = await Promise.all([
      db.from("experts").select("email, review_status, is_active").eq("id", profile.expert_id).maybeSingle(),
      db.from("expert_memberships").select("status").eq("expert_id", profile.expert_id).eq("pole", "care").maybeSingle(),
    ]);
    const services: CarePublicationService[] = profile.services.map((item) => ({
      name: item.name,
      active: item.active,
      price_cents: item.price_cents,
    }));
    const visible = isCareListingPublic({
      published: profile.published,
      is_care: profile.is_care,
      is_test: profile.is_test === true,
      email: expert?.email ? String(expert.email) : null,
      review_status: expert?.review_status ? String(expert.review_status) : null,
      care_active: membership?.status === "active",
      avatar_url: profile.avatar_url,
      tagline: profile.tagline,
      bio: profile.bio,
      approach: profile.approach,
      domains: profile.domains,
      city: profile.city,
      offers_cabinet: profile.offers_cabinet,
      offers_visio: profile.offers_visio,
      services,
    });
    if (!visible) return null;
    return { ...profile, address: null };
  } catch {
    return null;
  }
}
