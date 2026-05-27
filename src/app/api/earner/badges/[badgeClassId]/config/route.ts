import { NextRequest, NextResponse } from "next/server";
import { requireEarnerSession } from "@/lib/auth/earner-session";
import {
  getPlaygroundMaxAttempts,
  resolveMethodConfigsForBadge,
} from "@/lib/openbadges/badge-method-config";
import {
  learnerMustRestartBadgeAssessment,
  resolveLearnerAssessmentProgress,
} from "@/lib/openbadges/badge-earner-attempt";
import { loadEarnerAccessibleBadgeRow } from "@/lib/openbadges/badge-earner-access";

type RouteParams = { badgeClassId: string };

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  try {
    const auth = await requireEarnerSession(request);
    if (!auth.ok) return auth.response;

    const { badgeClassId } = await context.params;
    const badgeRow = await loadEarnerAccessibleBadgeRow(badgeClassId, auth.orgIds);

    if (!badgeRow) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const methodConfigs = resolveMethodConfigsForBadge(badgeRow);
    const receivability = badgeRow.receivability as Record<string, unknown> | undefined;

    const playgroundConfig = methodConfigs.find((c) => c.methodId === "playground");
    const evaluationConfig =
      badgeRow.evaluation_config ?? badgeRow.evaluationConfig ?? null;
    const mustRestartAssessment = learnerMustRestartBadgeAssessment(
      evaluationConfig,
      auth.user.id,
    );

    const progress = resolveLearnerAssessmentProgress(
      methodConfigs,
      evaluationConfig,
      auth.user.id,
    );

    return NextResponse.json({
      ok: true,
      badgeClass: {
        id: badgeRow.id,
        name: badgeRow.name,
        description: badgeRow.description,
        level: badgeRow.level,
        evaluationMethods: badgeRow.evaluationMethods,
        methodConfigs,
        expectedModalities: receivability?.expectedModalities ?? null,
        playgroundAttemptsUsed: progress.playgroundAttemptsUsed,
        playgroundMaxAttempts: playgroundConfig
          ? getPlaygroundMaxAttempts(playgroundConfig)
          : null,
        mustRestartAssessment,
        submittedMethodIds: progress.submittedMethodIds,
        readyForFinalEvaluation: progress.readyForFinalEvaluation,
      },
    });
  } catch (error) {
    console.error("[earner][config][GET]", error);
    return NextResponse.json(
      { error: "CONFIG_LOAD_FAILED", message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
