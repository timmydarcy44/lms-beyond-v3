import { NextRequest, NextResponse } from "next/server";
import { requireEarnerSession } from "@/lib/auth/earner-session";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadEarnerAccessibleBadgeRow } from "@/lib/openbadges/badge-earner-access";
import { generatePlaygroundAssistantResponse } from "@/lib/openbadges/badge-playground-ai";
import { collectPlaygroundAttempts } from "@/lib/openbadges/badge-playground-session";
import { getLearnerSubmissionsFromBadgeRow } from "@/lib/openbadges/badge-earner-outcome";
import { getOpenBadgeClassByIdOnly } from "@/lib/openbadges/open-badges-table-store";
import {
  getPlaygroundMaxAttempts,
  resolveMethodConfigsForBadge,
} from "@/lib/openbadges/badge-method-config";

type RouteParams = { badgeClassId: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const { badgeClassId } = await context.params;
  const body = await request.json();
  const preview = body?.preview === true;
  const prompt = String(body?.prompt ?? "").trim();
  const attemptNumber = Math.max(1, Number(body?.attemptNumber) || 1);

  if (!prompt) {
    return NextResponse.json({ error: "PROMPT_REQUIRED" }, { status: 400 });
  }

  const auth = preview ? null : await requireEarnerSession(request);
  if (auth && !auth.ok) return auth.response;
  if (preview && !(await isSuperAdmin())) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const badgeRow = preview
    ? await getOpenBadgeClassByIdOnly(badgeClassId)
    : await loadEarnerAccessibleBadgeRow(badgeClassId, auth && auth.ok ? auth.orgIds : []);
  if (!badgeRow) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const methodConfigs = resolveMethodConfigsForBadge(badgeRow);
  const pg = methodConfigs.find((c) => c.methodId === "playground");
  if (!pg) {
    return NextResponse.json({ error: "NO_PLAYGROUND" }, { status: 400 });
  }

  const maxAttempts = getPlaygroundMaxAttempts(pg);
  if (attemptNumber > maxAttempts) {
    return NextResponse.json({ error: "PLAYGROUND_ATTEMPTS_EXCEEDED" }, { status: 403 });
  }

  const consigne = pg.playground?.learnerPrompt?.trim() || pg.evaluationPrompt;
  const previous = preview || !auth || !auth.ok
    ? []
    : collectPlaygroundAttempts(getLearnerSubmissionsFromBadgeRow(badgeRow, auth.user.id));

  const { aiResponse, promptQuality } = await generatePlaygroundAssistantResponse({
    learnerPrompt: prompt,
    consigne,
    attemptNumber,
    previousAttempts: previous,
  });

  return NextResponse.json({
    ok: true,
    aiResponse,
    promptQuality,
    attemptNumber,
  });
}
