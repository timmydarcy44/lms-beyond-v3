import type { SupabaseClient } from "@supabase/supabase-js";

export type WalletEarnedBadgeRow = {
  name: string;
  earnedAt: string;
  description: string | null;
  imageUrl: string | null;
};

/**
 * Badges obtenus (table LMS `user_badges` + définitions `badges`).
 * Échoue silencieusement si les tables ne sont pas présentes sur l’instance.
 */
export async function fetchLearnerWalletBadges(
  client: SupabaseClient,
  learnerId: string,
): Promise<WalletEarnedBadgeRow[]> {
  try {
    const { data: ubRows, error: ubErr } = await client
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", learnerId)
      .order("earned_at", { ascending: false })
      .limit(20);

    if (ubErr || !ubRows?.length) return [];

    const badgeIds = [...new Set(ubRows.map((r: { badge_id: string }) => r.badge_id).filter(Boolean))];
    if (!badgeIds.length) return [];

    const { data: badgeRows, error: bErr } = await client
      .from("badges")
      .select("id, label, description, code")
      .in("id", badgeIds);

    if (bErr || !badgeRows?.length) return [];

    const byId = new Map<string, { label?: string | null; description?: string | null; code?: string | null }>(
      badgeRows.map((b: { id: string; label?: string | null; description?: string | null; code?: string | null }) => [
        b.id,
        b,
      ]),
    );

    return ubRows.map((ub: { badge_id: string; earned_at: string }) => {
      const b = byId.get(ub.badge_id);
      const name = (b?.label || b?.code || "Badge").trim() || "Badge";
      return {
        name,
        earnedAt: ub.earned_at,
        description: b?.description ?? null,
        imageUrl: null,
      };
    });
  } catch {
    return [];
  }
}
