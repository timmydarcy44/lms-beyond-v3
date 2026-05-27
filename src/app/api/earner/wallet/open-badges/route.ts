import { NextRequest, NextResponse } from "next/server";
import { requireEarnerSession } from "@/lib/auth/earner-session";
import { canUseOpenBadgesSupabaseRepo } from "@/lib/openbadges/badge-repository";
import { listLearnerVisibleOpenBadgesForOrgs } from "@/lib/openbadges/open-badges-table-store";
import { getLearnerOpenBadgeAward } from "@/lib/openbadges/open-badge-earner-submissions";
import { buildOpenBadgeLinkedInShareUrl } from "@/lib/openbadges/linkedin-share";
import { getBadgeCriteriaUrl } from "@/lib/openbadges/urls";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireEarnerSession(request);
  if (!auth.ok) return auth.response;

  if (!canUseOpenBadgesSupabaseRepo()) {
    return NextResponse.json({ ok: true, badges: [] });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, badges: [] });
  }

  const visible = await listLearnerVisibleOpenBadgesForOrgs(auth.orgIds);
  const badgeIds = visible.map((b) => b.id);
  if (badgeIds.length === 0) {
    return NextResponse.json({ ok: true, badges: [] });
  }

  const { data: rows } = await supabase
    .from("open_badges")
    .select("id, name, title, image_url, evaluation_config")
    .in("id", badgeIds);

  const earned: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    awardedAt: string;
    shareUrl: string;
    linkedInShareUrl: string;
  }> = [];

  for (const row of rows ?? []) {
    const config = (row as { evaluation_config?: Record<string, unknown> }).evaluation_config;
    const level =
      typeof config?.level === "number" && Number.isFinite(config.level)
        ? config.level
        : null;
    const award = getLearnerOpenBadgeAward(config, auth.user.id);
    if (!award) continue;
    const name = String(row.name ?? row.title ?? award.badgeName ?? "Badge");
    const badgeId = String(row.id);
    const shareUrl = getBadgeCriteriaUrl(badgeId);
    earned.push({
      id: badgeId,
      name,
      imageUrl: (row.image_url as string | null) ?? award.imageUrl ?? null,
      awardedAt: award.awardedAt,
      shareUrl,
      linkedInShareUrl: buildOpenBadgeLinkedInShareUrl({
        shareUrl,
        badgeName: name,
        level,
      }),
    });
  }

  earned.sort((a, b) => Date.parse(b.awardedAt) - Date.parse(a.awardedAt));

  return NextResponse.json({ ok: true, badges: earned });
}
