import type { SupabaseClient } from "@supabase/supabase-js";
import { getLearnerEarnedOpenBadges } from "@/lib/openbadges/learner-visible-badges";
import { getBadgeCriteriaUrl, getPublicShareBaseUrl } from "@/lib/openbadges/urls";

export type PublicProfileEarnedBadge = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  level: number | null;
  awardedAt: string;
  shareUrl: string;
  criteriaUrl: string;
  openBadgeClassJsonUrl: string;
  criteria: Array<{ label: string; description: string | null }>;
  criteriaMarkdown: string | null;
};

function parseCriteriaFromConfig(config: unknown): {
  criteria: PublicProfileEarnedBadge["criteria"];
  criteriaMarkdown: string | null;
  description: string;
  level: number | null;
} {
  const empty = { criteria: [], criteriaMarkdown: null, description: "", level: null };
  if (!config || typeof config !== "object" || Array.isArray(config)) return empty;
  const c = config as Record<string, unknown>;
  const criteriaRaw = Array.isArray(c.criteria) ? c.criteria : [];
  const criteria = criteriaRaw
    .map((item) => {
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      if (!label) return null;
      return {
        label,
        description: row.description ? String(row.description) : null,
      };
    })
    .filter((x): x is { label: string; description: string | null } => Boolean(x));

  const levelRaw = c.level;
  const level =
    typeof levelRaw === "number"
      ? levelRaw
      : typeof levelRaw === "string" && levelRaw.trim()
        ? Number.parseInt(levelRaw, 10)
        : null;

  return {
    criteria,
    criteriaMarkdown:
      typeof c.criteriaMarkdown === "string" && c.criteriaMarkdown.trim()
        ? c.criteriaMarkdown.trim()
        : null,
    description: typeof c.description === "string" ? c.description : "",
    level: Number.isFinite(level) ? level : null,
  };
}

export async function loadPublicProfileEarnedBadges(
  supabase: SupabaseClient,
  userId: string,
): Promise<PublicProfileEarnedBadge[]> {
  const { data: memberships } = await supabase
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", userId);

  const orgIds = Array.from(
    new Set((memberships ?? []).map((row) => String(row.org_id ?? "")).filter(Boolean)),
  );
  if (orgIds.length === 0) return [];

  const earned = await getLearnerEarnedOpenBadges(userId, orgIds);
  if (earned.length === 0) return [];

  const badgeIds = earned.map((b) => b.id);
  const { data: badgeRows } = await supabase
    .from("open_badges")
    .select("id, name, description, image_url, evaluation_config")
    .in("id", badgeIds);

  const rowById = new Map(
    (badgeRows ?? []).map((row) => [String((row as { id: string }).id), row as Record<string, unknown>]),
  );

  const base = getPublicShareBaseUrl().replace(/\/$/, "");

  return earned.map((badge) => {
    const row = rowById.get(badge.id);
    const config = row?.evaluation_config;
    const parsed = parseCriteriaFromConfig(config);
    const description =
      String(row?.description ?? "").trim() ||
      parsed.description ||
      "";
    const level =
      badge.level ??
      parsed.level ??
      null;

    return {
      id: badge.id,
      name: badge.name,
      description,
      imageUrl: badge.imageUrl ?? (row?.image_url ? String(row.image_url) : null),
      level,
      awardedAt: badge.awardedAt,
      shareUrl: badge.shareUrl,
      criteriaUrl: getBadgeCriteriaUrl(badge.id),
      openBadgeClassJsonUrl: `${base}/api/public/badgeclasses/${badge.id}`,
      criteria: parsed.criteria,
      criteriaMarkdown: parsed.criteriaMarkdown,
    };
  });
}
