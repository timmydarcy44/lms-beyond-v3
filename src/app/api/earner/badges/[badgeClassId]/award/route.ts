import { NextRequest, NextResponse } from "next/server";
import { requireEarnerSession } from "@/lib/auth/earner-session";
import {
  canUseOpenBadgesSupabaseRepo,
  getBadgeClassViaSupabase,
} from "@/lib/openbadges/badge-repository";
import { runFullBadgeEarnerEvaluation } from "@/lib/openbadges/badge-earner-evaluation";
import { issueBadgeAssertion } from "@/lib/openbadges/badge-assertions";
import { buildOpenBadgeLinkedInShareUrl } from "@/lib/openbadges/linkedin-share";
import { getBadgeCriteriaUrl } from "@/lib/openbadges/urls";
import { getServiceRoleClient } from "@/lib/supabase/server";

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

  const db = getServiceRoleClient();
  if (!db) {
    return NextResponse.json({ error: "STORAGE_FAILED" }, { status: 503 });
  }

  const { data: existingAssertion } = await db
    .from("badge_assertions")
    .select("id, issued_at")
    .eq("badge_class_id", badgeClassId)
    .eq("recipient_profile_id", auth.user.id)
    .maybeSingle();
  if (existingAssertion?.id) {
    const shareUrl = getBadgeCriteriaUrl(badgeClassId);
    const badgeName = String(badgeRow.name ?? "");
    return NextResponse.json({
      ok: true,
      alreadyAwarded: true,
      assertionId: existingAssertion.id,
      award: {
        awardedAt: existingAssertion.issued_at,
        shareUrl,
        linkedInShareUrl: buildOpenBadgeLinkedInShareUrl({ shareUrl, badgeName, level: null }),
        badgeName,
      },
    });
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

  const issued = await issueBadgeAssertion(db, {
    badgeClassId,
    recipientProfileId: auth.user.id,
    issuedAt: award.awardedAt,
    isPublic: false,
  });
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error }, { status: issued.error === "STORAGE" ? 503 : 422 });
  }

  return NextResponse.json({
    ok: true,
    alreadyAwarded: issued.alreadyExisted,
    assertionId: issued.assertionId,
    signed: issued.signed,
    award: { ...award, awardedAt: issued.awardedAt },
  });
}
