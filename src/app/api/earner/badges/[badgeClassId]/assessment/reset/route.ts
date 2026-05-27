import { NextRequest, NextResponse } from "next/server";
import { requireEarnerSession } from "@/lib/auth/earner-session";
import {
  canUseOpenBadgesSupabaseRepo,
  getBadgeClassViaSupabase,
} from "@/lib/openbadges/badge-repository";
import { resetLearnerBadgeAttempt } from "@/lib/openbadges/badge-earner-attempt";

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
    if (!badgeRow) badgeRow = await getBadgeClassViaSupabase(badgeClassId, null);
  }

  if (!badgeRow || !isActiveStatus(badgeRow.status)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const rowOrg = String(badgeRow.orgId ?? "").trim();
  if (rowOrg && !auth.orgIds.includes(rowOrg)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const ok = await resetLearnerBadgeAttempt(badgeClassId, auth.user.id);
  if (!ok) {
    return NextResponse.json({ error: "RESET_FAILED" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, restarted: true });
}
