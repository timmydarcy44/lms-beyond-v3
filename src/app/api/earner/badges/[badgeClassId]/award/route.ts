import { NextRequest, NextResponse } from "next/server";
import { requireEarnerSession } from "@/lib/auth/earner-session";
import {
  canUseOpenBadgesSupabaseRepo,
  getBadgeClassViaSupabase,
} from "@/lib/openbadges/badge-repository";
import { runFullBadgeEarnerEvaluation } from "@/lib/openbadges/badge-earner-evaluation";
import {
  getLearnerOpenBadgeAward,
  recordOpenBadgeAward,
} from "@/lib/openbadges/open-badge-earner-submissions";
import { buildOpenBadgeLinkedInShareUrl } from "@/lib/openbadges/linkedin-share";
import { getBadgeCriteriaUrl } from "@/lib/openbadges/urls";

type RouteParams = { badgeClassId: string };

function isActiveStatus(raw: unknown): boolean {
  const value = String(raw ?? "").trim().toLowerCase();
  return value === "active" || value === "published";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const auth = await requireEarnerSession(request);
  if (!auth.ok) return auth.response;

  const { badgeClassId } = await context.params;

  let badgeRow: Record<string, unknown> | null = null;
  if (canUseOpenBadgesSupabaseRepo()) {
    badgeRow = await getBadgeClassViaSupabase(badgeClassId, auth.user.orgId);
    if (!badgeRow) {
      badgeRow = await getBadgeClassViaSupabase(badgeClassId, null);
    }
  }

  if (!badgeRow) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const rowOrg = String(badgeRow.orgId ?? "").trim();
  if (!rowOrg || !auth.orgIds.includes(rowOrg) || !isActiveStatus(badgeRow.status)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const evaluationConfig = badgeRow.evaluation_config ?? badgeRow.evaluationConfig;
  const existing = getLearnerOpenBadgeAward(evaluationConfig, auth.user.id);
  if (existing) {
    return NextResponse.json({ ok: true, award: existing, alreadyAwarded: true });
  }

  const { result: outcome } = await runFullBadgeEarnerEvaluation({
    badgeRow,
    earnerId: auth.user.id,
    force: false,
  });

  if (!outcome.awarded) {
    return NextResponse.json({ error: "NOT_AWARDED", outcome }, { status: 403 });
  }

  const shareUrl = outcome.shareUrl || getBadgeCriteriaUrl(badgeClassId);
  const badgeName = String(badgeRow.name ?? "");
  const badgeLevel =
    typeof badgeRow.level === "number"
      ? badgeRow.level
      : typeof (badgeRow.evaluation_config as Record<string, unknown> | undefined)?.level ===
          "number"
        ? ((badgeRow.evaluation_config as Record<string, unknown>).level as number)
        : null;
  const award = {
    awardedAt: new Date().toISOString(),
    shareUrl,
    linkedInShareUrl: buildOpenBadgeLinkedInShareUrl({
      shareUrl,
      badgeName,
      level: badgeLevel,
    }),
    badgeName,
    imageUrl: (badgeRow.imageUrl as string | null) ?? (badgeRow.image_url as string | null) ?? null,
  };

  const stored = await recordOpenBadgeAward(badgeClassId, auth.user.id, award);
  if (!stored) {
    return NextResponse.json({ error: "STORAGE_FAILED" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, award });
}
