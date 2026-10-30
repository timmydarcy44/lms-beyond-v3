import { isPlaceholderCareRow } from "@/lib/care/demo-profiles";
import { compareCareDirectory, matchesCareDirectory, careSlotInWhen, type CareDirectoryQuery } from "@/lib/care/directory-search";
import { loadUpcomingCareSlotIsos } from "@/lib/care/next-slot";
import { formatPersonName } from "@/lib/care/person-name";
import { isCarePlaceholderText } from "@/lib/care/profile-format";
import { carePlaceLine, carePriceLine, isCareListingPublic, type CarePublicationService } from "@/lib/care/publication";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { CareDirectoryRow } from "@/lib/care/types";

function asText(value: unknown) {
  return value == null ? "" : String(value);
}

async function loadCareDirectoryRows(): Promise<CareDirectoryRow[]> {
  const db = getServiceRoleClient();
  if (!db) return [];
  const columns =
    "expert_id, slug, display_name, title, tagline, headline, bio, approach, avatar_url, domains, city, offers_cabinet, offers_visio, publics, member_since, published, is_care, is_test";
  let { data, error } = await db.from("care_profiles").select(columns).eq("published", true).eq("is_care", true);
  if (error?.message?.includes("is_test")) {
    const retry = await db
      .from("care_profiles")
      .select(columns.replace(", is_test", ""))
      .eq("published", true)
      .eq("is_care", true);
    data = retry.data as typeof data;
    error = retry.error;
  }
  if (error || !data) return [];
  const ids = data.map((row) => String(row.expert_id)).filter(Boolean);
  if (!ids.length) return [];
  const [{ data: services }, { data: badges }, { data: experts }, { data: memberships }] = await Promise.all([
    db.from("care_services").select("expert_id, price_cents, active, name").in("expert_id", ids),
    db.from("care_expert_badges").select("expert_id").in("expert_id", ids),
    db.from("experts").select("id, email, review_status, is_active").in("id", ids),
    db.from("expert_memberships").select("expert_id, status").eq("pole", "care").in("expert_id", ids),
  ]);
  const expertById = new Map((experts ?? []).map((row) => [String(row.id), row]));
  const careActive = new Set(
    (memberships ?? []).filter((row) => row.status === "active").map((row) => String(row.expert_id)),
  );
  const servicesByExpert = new Map<string, CarePublicationService[]>();
  for (const service of services ?? []) {
    const expertId = String(service.expert_id);
    const list = servicesByExpert.get(expertId) ?? [];
    list.push({
      name: asText(service.name).trim(),
      active: service.active !== false,
      price_cents: Number(service.price_cents) || 0,
    });
    servicesByExpert.set(expertId, list);
  }
  const badgeCount = new Map<string, number>();
  for (const badge of badges ?? []) {
    const expertId = String(badge.expert_id);
    badgeCount.set(expertId, (badgeCount.get(expertId) ?? 0) + 1);
  }
  return data.flatMap((row) => {
    const expertId = String(row.expert_id);
    if (
      isPlaceholderCareRow({
        expert_id: expertId,
        title: row.title ? String(row.title) : null,
        tagline: row.tagline ? String(row.tagline) : null,
        city: row.city ? String(row.city) : null,
      })
    ) {
      return [];
    }
    const expert = expertById.get(expertId);
    const serviceRows = servicesByExpert.get(expertId) ?? [];
    const input = {
      published: row.published === true,
      is_care: row.is_care === true,
      is_test: "is_test" in row ? row.is_test === true : false,
      email: expert?.email ? String(expert.email) : null,
      review_status: expert?.review_status ? String(expert.review_status) : null,
      care_active: careActive.has(expertId),
      avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      tagline: asText(row.tagline),
      bio: asText(row.bio),
      approach: asText(row.approach),
      domains: Array.isArray(row.domains) ? row.domains : [],
      city: row.city ? String(row.city) : null,
      offers_cabinet: row.offers_cabinet === true,
      offers_visio: row.offers_visio === true,
      services: serviceRows,
    };
    if (!isCareListingPublic(input)) return [];
    const price = carePriceLine(serviceRows);
    const place = carePlaceLine(input);
    const publicServices = serviceRows.filter((item) => item.active && !isCarePlaceholderText(item.name));
    const priced = publicServices.filter((item) => item.price_cents > 0).map((item) => item.price_cents);
    return [
      {
        expert_id: expertId,
        slug: asText(row.slug),
        display_name: formatPersonName(asText(row.display_name)) || asText(row.display_name),
        title: isCarePlaceholderText(asText(row.title)) ? "" : asText(row.title),
        tagline: isCarePlaceholderText(asText(row.tagline)) ? "" : asText(row.tagline),
        headline: isCarePlaceholderText(asText(row.headline)) ? "" : asText(row.headline),
        avatar_url: row.avatar_url ? String(row.avatar_url) : null,
        domains: Array.isArray(row.domains) ? row.domains : [],
        city: row.city ? String(row.city) : null,
        offers_cabinet: row.offers_cabinet === true,
        offers_visio: row.offers_visio === true,
        publics: Array.isArray(row.publics) ? row.publics.map(String) : [],
        badge_count: badgeCount.get(expertId) ?? 0,
        min_price_cents: priced.length ? Math.min(...priced) : publicServices.length ? 0 : null,
        member_since: row.member_since ? String(row.member_since) : null,
        price_main: price.main,
        price_hint: price.hint,
        place_main: place.main,
        place_hint: place.hint,
        service_names: publicServices.map((item) => item.name),
      } satisfies CareDirectoryRow,
    ];
  });
}

export async function loadCareDirectoryPreview(limit = 2): Promise<CareDirectoryRow[]> {
  const rows = await loadCareDirectoryRows();
  return rows.sort((a, b) => compareCareDirectory(a, b, {})).slice(0, limit);
}

export async function loadFilteredCareDirectory(query: CareDirectoryQuery) {
  const matched = (await loadCareDirectoryRows()).filter((row) => matchesCareDirectory(row, query));
  const nextSlot: Record<string, string | null> = {};
  const slotsByExpert: Record<string, string[]> = {};
  await Promise.all(
    matched.map(async (row) => {
      const slots = await loadUpcomingCareSlotIsos(row.expert_id, 12);
      slotsByExpert[row.expert_id] = slots;
      nextSlot[row.expert_id] = slots[0] ?? null;
      row.next_slots = slots.slice(0, 3);
    }),
  );
  const timed = query.quand
    ? matched.filter((row) => (slotsByExpert[row.expert_id] ?? []).some((iso) => careSlotInWhen(iso, query.quand)))
    : matched;
  timed.sort((a, b) => compareCareDirectory(a, b, nextSlot));
  return { rows: timed, nextSlot };
}
