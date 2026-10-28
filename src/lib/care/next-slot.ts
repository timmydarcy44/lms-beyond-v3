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
