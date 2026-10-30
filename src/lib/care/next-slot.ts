import { unstable_cache } from "next/cache";
import { loadAvailableCareSlots } from "@/lib/care/load-available-slots";

async function computeNextCareSlotIso(expertId: string): Promise<string | null> {
  const from = new Date();
  const to = new Date(from.getTime() + 21 * 24 * 60 * 60 * 1000);
  const slots = await loadAvailableCareSlots({ expertId, from, to });
  return slots[0]?.startsAt.toISOString() ?? null;
}

export const loadNextCareSlotIso = unstable_cache(computeNextCareSlotIso, ["care-next-slot"], {
  revalidate: 30,
  tags: ["care-slots"],
});

async function computeUpcomingCareSlotIsos(expertId: string, limit: number): Promise<string[]> {
  const from = new Date();
  const to = new Date(from.getTime() + 31 * 24 * 60 * 60 * 1000);
  const slots = await loadAvailableCareSlots({ expertId, from, to });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const slot of [...slots].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())) {
    const iso = slot.startsAt.toISOString();
    if (seen.has(iso)) continue;
    seen.add(iso);
    out.push(iso);
    if (out.length >= limit) break;
  }
  return out;
}

export const loadUpcomingCareSlotIsos = unstable_cache(computeUpcomingCareSlotIsos, ["care-upcoming-slots"], {
  revalidate: 30,
  tags: ["care-slots"],
});
