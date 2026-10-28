import { compareCareDirectory, matchesCareDirectory, type CareDirectoryQuery } from "@/lib/care/directory-search";
import { loadNextCareSlotIso } from "@/lib/care/next-slot";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { CareDirectoryRow } from "@/lib/care/types";

function asText(value: unknown) {
  return value == null ? "" : String(value);
}

async function loadCareDirectoryRows(): Promise<CareDirectoryRow[]> {
  const db = getServiceRoleClient();
  if (!db) return [];
  const { data, error } = await db
    .from("care_profiles")
    .select(
      "expert_id, slug, display_name, title, tagline, headline, avatar_url, domains, city, offers_cabinet, offers_visio, publics, member_since",
    )
    .eq("published", true)
    .eq("is_care", true);
  if (error || !data) return [];
  const ids = data.map((row) => String(row.expert_id)).filter(Boolean);
  const [{ data: services }, { data: badges }] = ids.length
    ? await Promise.all([
        db.from("care_services").select("expert_id, price_cents, active, name").in("expert_id", ids),
        db.from("care_expert_badges").select("expert_id").in("expert_id", ids),
      ])
    : [
        { data: [] as Array<{ expert_id: string; price_cents: number | null; active: boolean | null; name: string | null }> },
        { data: [] as Array<{ expert_id: string }> },
      ];
  const minPrice = new Map<string, number>();
  for (const service of services ?? []) {
    if (service.active === false) continue;
    const name = asText(service.name).trim();
    if (!name) continue;
    const price = Number(service.price_cents);
    if (!Number.isFinite(price)) continue;
    const expertId = String(service.expert_id);
    const previous = minPrice.get(expertId);
    if (previous == null || price < previous) minPrice.set(expertId, price);
  }
  const badgeCount = new Map<string, number>();
  for (const badge of badges ?? []) {
    const expertId = String(badge.expert_id);
    badgeCount.set(expertId, (badgeCount.get(expertId) ?? 0) + 1);
  }
  return data.map((row) => {
    const expertId = String(row.expert_id);
    return {
      expert_id: expertId,
      slug: asText(row.slug),
      display_name: asText(row.display_name),
      title: asText(row.title),
      tagline: asText(row.tagline),
      headline: asText(row.headline),
      avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      domains: Array.isArray(row.domains) ? row.domains : [],
      city: row.city ? String(row.city) : null,
      offers_cabinet: row.offers_cabinet === true,
      offers_visio: row.offers_visio === true,
      publics: Array.isArray(row.publics) ? row.publics.map(String) : [],
      badge_count: badgeCount.get(expertId) ?? 0,
      min_price_cents: minPrice.get(expertId) ?? null,
      member_since: row.member_since ? String(row.member_since) : null,
    };
  });
}

export async function loadCareDirectoryPreview(limit = 2): Promise<CareDirectoryRow[]> {
  const rows = await loadCareDirectoryRows();
  return rows.sort((a, b) => compareCareDirectory(a, b, {})).slice(0, limit);
}

export async function loadFilteredCareDirectory(query: CareDirectoryQuery) {
  const matched = (await loadCareDirectoryRows()).filter((row) => matchesCareDirectory(row, query));
  const nextSlot: Record<string, string | null> = {};
  await Promise.all(
    matched.map(async (row) => {
      nextSlot[row.expert_id] = await loadNextCareSlotIso(row.expert_id);
    }),
  );
  matched.sort((a, b) => compareCareDirectory(a, b, nextSlot));
  return { rows: matched, nextSlot };
}
