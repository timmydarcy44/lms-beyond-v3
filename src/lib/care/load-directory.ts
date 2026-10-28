import { compareCareDirectory, matchesCareDirectory, type CareDirectoryQuery } from "@/lib/care/directory-search";
import { loadNextCareSlotIso } from "@/lib/care/next-slot";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { CareDirectoryRow } from "@/lib/care/types";

const DIRECTORY_SELECT =
  "expert_id, slug, display_name, title, tagline, headline, avatar_url, domains, city, offers_cabinet, offers_visio, publics, badge_count, min_price_cents, member_since";

async function loadCareDirectoryRows(): Promise<CareDirectoryRow[]> {
  const db = getServiceRoleClient();
  if (!db) return [];
  const { data, error } = await db.from("care_directory").select(DIRECTORY_SELECT);
  if (error || !data) return [];
  return data as CareDirectoryRow[];
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
