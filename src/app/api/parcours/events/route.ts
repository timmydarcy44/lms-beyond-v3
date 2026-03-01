import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { evaluateParcoursScenarios } from "@/lib/parcours/scenarios/evaluator";
import { parcoursEventSchema } from "@/lib/parcours/scenarios/schema";
import {
  getServerClient,
  getServiceRoleClientOrFallback,
} from "@/lib/supabase/server";

const formationCompletedPayloadSchema = z.object({
  formationId: z.string().uuid(),
});

const testScoredPayloadSchema = z.object({
  testId: z.string().uuid(),
  score: z.coerce.number().min(0),
  maxScore: z.coerce.number().min(0).optional(),
});

const inactiveDaysPayloadSchema = z.object({
  days: z.coerce.number().int().min(1),
});

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type ServiceClient = NonNullable<
  Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>
>;

type PathProgressRow = {
  id: string;
  last_accessed_at: string | null;
  updated_at: string | null;
};

type LearnerPathContext = {
  isAssigned: boolean;
  progress: PathProgressRow | null;
  lastActivityIso: string | null;
};

const toDateOrNull = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

async function getLearnerPathContext(
  client: ServiceClient,
  pathId: string,
  learnerId: string,
): Promise<LearnerPathContext> {
  const context: LearnerPathContext = {
    isAssigned: false,
    progress: null,
    lastActivityIso: null,
  };

  const {
    data: progress,
    error: progressError,
  } = await client
    .from("path_progress")
    .select("id, last_accessed_at, updated_at")
    .eq("path_id", pathId)
    .eq("user_id", learnerId)
    .maybeSingle();

  if (progressError) {
    throw new Error(
      `[parcours events] path_progress lookup failed: ${progressError.message}`,
    );
  }

  if (progress) {
    context.progress = progress;
    context.isAssigned = true;
    context.lastActivityIso =
      progress.last_accessed_at ?? progress.updated_at ?? null;
  }

  const {
    data: directAssignment,
    error: directAssignmentError,
  } = await client
    .from("content_assignments")
    .select("id")
    .eq("content_type", "path")
    .eq("content_id", pathId)
    .eq("learner_id", learnerId)
    .maybeSingle();

  if (directAssignmentError) {
    throw new Error(
      `[parcours events] direct assignment lookup failed: ${directAssignmentError.message}`,
    );
  }

  if (directAssignment) {
    context.isAssigned = true;
  } else {
    const {
      data: groupAssignments,
      error: groupAssignmentsError,
    } = await client
      .from("content_assignments")
      .select("group_id")
      .eq("content_type", "path")
      .eq("content_id", pathId)
      .not("group_id", "is", null);

    if (groupAssignmentsError) {
      throw new Error(
        `[parcours events] group assignment lookup failed: ${groupAssignmentsError.message}`,
      );
    }

    const groupIds =
      groupAssignments
        ?.map((item) => item.group_id)
        .filter((id): id is string => Boolean(id)) ?? [];

    if (groupIds.length > 0) {
      const {
        data: membership,
        error: membershipError,
      } = await client
        .from("group_members")
        .select("group_id")
        .eq("user_id", learnerId)
        .in("group_id", groupIds)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        throw new Error(
          `[parcours events] group membership lookup failed: ${membershipError.message}`,
        );
      }

      if (membership) {
        context.isAssigned = true;
      }
    }
  }

  if (!context.lastActivityIso) {
    const {
      data: lastSession,
      error: lastSessionError,
    } = await client
      .from("learning_sessions")
      .select("ended_at, created_at")
      .eq("path_id", pathId)
      .eq("user_id", learnerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSessionError) {
      throw new Error(
        `[parcours events] learning session lookup failed: ${lastSessionError.message}`,
      );
    }

    if (lastSession) {
      context.lastActivityIso =
        lastSession.ended_at ?? lastSession.created_at ?? null;
    }
  }

  if (context.progress) {
    context.isAssigned = true;
  }

  return context;
}

async function courseBelongsToPath(
  client: ServiceClient,
  pathId: string,
  courseId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("path_courses")
    .select("course_id")
    .eq("path_id", pathId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[parcours events] path_courses lookup failed: ${error.message}`,
    );
  }

  return Boolean(data);
}

async function testBelongsToPath(
  client: ServiceClient,
  pathId: string,
  testId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("path_tests")
    .select("test_id")
    .eq("path_id", pathId)
    .eq("test_id", testId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[parcours events] path_tests lookup failed: ${error.message}`,
    );
  }

  return Boolean(data);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = parcoursEventSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Payload invalide", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const payload = parseResult.data;
    const serviceClient = await getServiceRoleClientOrFallback();
    if (!serviceClient) {
      return NextResponse.json(
        { error: "Service Supabase indisponible" },
        { status: 500 },
      );
    }

    const {
      data: path,
      error: pathError,
    } = await serviceClient
      .from("paths")
      .select("id, owner_id, creator_id")
      .eq("id", payload.parcoursId)
      .maybeSingle();

    if (pathError) {
      console.error("[parcours events] path lookup failed", pathError);
      return NextResponse.json(
        { error: "Erreur serveur (parcours)" },
        { status: 500 },
      );
    }

    if (!path) {
      return NextResponse.json(
        { error: "Parcours introuvable" },
        { status: 404 },
      );
    }

    const callerId = authData.user.id;
    const isOwner =
      path.owner_id === callerId || path.creator_id === callerId;
    const isLearner = callerId === payload.learnerId;

    if (!isOwner && !isLearner) {
      return NextResponse.json(
        { error: "Accès refusé pour cet évènement" },
        { status: 403 },
      );
    }

    let learnerContext: LearnerPathContext;
    try {
      learnerContext = await getLearnerPathContext(
        serviceClient,
        payload.parcoursId,
        payload.learnerId,
      );
    } catch (error) {
      console.error("[parcours events] learner context error", error);
      return NextResponse.json(
        { error: "Impossible de vérifier l'appartenance au parcours" },
        { status: 500 },
      );
    }

    if (!learnerContext.isAssigned) {
      return NextResponse.json(
        { error: "Apprenant non lié à ce parcours" },
        { status: 403 },
      );
    }

    const now = new Date();
    let normalizedPayload: Record<string, unknown> = {};
    const dedupeMatchers: Array<{ column: string; value: string }> = [];

    switch (payload.eventType) {
      case "formation_completed": {
        const parsed = formationCompletedPayloadSchema.safeParse(payload.payload);
        if (!parsed.success) {
          return NextResponse.json(
            {
              error: "Payload formation incomplet",
              details: parsed.error.flatten(),
            },
            { status: 400 },
          );
        }

        const { formationId } = parsed.data;

        let belongsToPath = false;
        try {
          belongsToPath = await courseBelongsToPath(
            serviceClient,
            payload.parcoursId,
            formationId,
          );
        } catch (error) {
          console.error(
            "[parcours events] course path lookup failed",
            error,
          );
          return NextResponse.json(
            { error: "Erreur serveur (liaison formation)" },
            { status: 500 },
          );
        }

        if (!belongsToPath) {
          return NextResponse.json(
            {
              error: "Cette formation n'est pas liée au parcours",
            },
            { status: 400 },
          );
        }

        const {
          data: progress,
          error: courseProgressError,
        } = await serviceClient
          .from("course_progress")
          .select("progress_percent, updated_at")
          .eq("course_id", formationId)
          .eq("user_id", payload.learnerId)
          .maybeSingle();

        if (courseProgressError) {
          console.error(
            "[parcours events] course_progress lookup failed",
            courseProgressError,
          );
          return NextResponse.json(
            { error: "Erreur serveur (progression formation)" },
            { status: 500 },
          );
        }

        const progressPercent = Number(progress?.progress_percent ?? 0);
        if (!progress || Number.isNaN(progressPercent) || progressPercent < 100) {
          return NextResponse.json(
            {
              error: "La formation n'est pas complétée pour cet apprenant",
            },
            { status: 400 },
          );
        }

        normalizedPayload = {
          formationId,
          progressPercent,
          progressUpdatedAt: progress.updated_at ?? null,
          verifiedAt: now.toISOString(),
        };

        dedupeMatchers.push({
          column: "payload->>formationId",
          value: formationId,
        });
        break;
      }

      case "test_scored": {
        const parsed = testScoredPayloadSchema.safeParse(payload.payload);
        if (!parsed.success) {
          return NextResponse.json(
            {
              error: "Payload test invalide",
              details: parsed.error.flatten(),
            },
            { status: 400 },
          );
        }

        const { testId, score } = parsed.data;

        let belongsToPath = false;
        try {
          belongsToPath = await testBelongsToPath(
            serviceClient,
            payload.parcoursId,
            testId,
          );
        } catch (error) {
          console.error("[parcours events] test path lookup failed", error);
          return NextResponse.json(
            { error: "Erreur serveur (liaison test)" },
            { status: 500 },
          );
        }

        if (!belongsToPath) {
          return NextResponse.json(
            { error: "Ce test n'est pas lié au parcours" },
            { status: 400 },
          );
        }

        const {
          data: attempt,
          error: attemptError,
        } = await serviceClient
          .from("test_attempts")
          .select("id, score, max_score, passed, created_at")
          .eq("test_id", testId)
          .eq("user_id", payload.learnerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (attemptError) {
          console.error(
            "[parcours events] test_attempt lookup failed",
            attemptError,
          );
          return NextResponse.json(
            { error: "Erreur serveur (tentative test)" },
            { status: 500 },
          );
        }

        if (!attempt || !attempt.id) {
          return NextResponse.json(
            {
              error: "Aucune tentative de test trouvée pour cet apprenant",
            },
            { status: 400 },
          );
        }

        const attemptScore = Number(attempt.score ?? 0);
        if (Number.isNaN(attemptScore) || attemptScore < score) {
          return NextResponse.json(
            { error: "Score de test non vérifié" },
            { status: 400 },
          );
        }

        normalizedPayload = {
          testId,
          score: attemptScore,
          maxScore:
            typeof attempt.max_score === "number" ? attempt.max_score : null,
          passed: Boolean(attempt.passed),
          attemptId: attempt.id,
          attemptCreatedAt: attempt.created_at,
          verifiedAt: now.toISOString(),
        };

        dedupeMatchers.push({
          column: "payload->>attemptId",
          value: attempt.id,
        });
        break;
      }

      case "inactive_days": {
        const parsed = inactiveDaysPayloadSchema.safeParse(payload.payload);
        if (!parsed.success) {
          return NextResponse.json(
            {
              error: "Payload inactivité invalide",
              details: parsed.error.flatten(),
            },
            { status: 400 },
          );
        }

        const { days } = parsed.data;
        const referenceIso = learnerContext.lastActivityIso;

        if (!referenceIso) {
          return NextResponse.json(
            {
              error: "Impossible de vérifier l'inactivité pour cet apprenant",
            },
            { status: 400 },
          );
        }

        const referenceDate = toDateOrNull(referenceIso);
        if (!referenceDate) {
          return NextResponse.json(
            { error: "Référence d'activité invalide" },
            { status: 400 },
          );
        }

        const diffDays = Math.floor(
          (now.getTime() - referenceDate.getTime()) / MS_PER_DAY,
        );

        if (diffDays < days) {
          return NextResponse.json(
            {
              error:
                "L'inactivité réelle est inférieure au seuil demandé pour cet évènement",
            },
            { status: 400 },
          );
        }

        normalizedPayload = {
          days,
          asOfDate: referenceDate.toISOString(),
          computedDays: diffDays,
          computedAt: now.toISOString(),
        };

        dedupeMatchers.push({
          column: "payload->>asOfDate",
          value: referenceDate.toISOString(),
        });
        dedupeMatchers.push({
          column: "payload->>days",
          value: String(days),
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: "Type d'évènement non supporté" },
          { status: 400 },
        );
    }

    let dedupedEvent:
      | {
          id: string;
          event_type: string;
          payload: Record<string, unknown> | null;
        }
      | null = null;

    if (dedupeMatchers.length > 0) {
      let query = serviceClient
        .from("parcours_events")
        .select("id, event_type, payload")
        .eq("parcours_id", payload.parcoursId)
        .eq("learner_id", payload.learnerId)
        .eq("event_type", payload.eventType)
        .order("created_at", { ascending: false })
        .limit(1);

      for (const matcher of dedupeMatchers) {
        query = query.eq(matcher.column, matcher.value);
      }

      const {
        data: existing,
        error: dedupeError,
      } = await query.maybeSingle();

      if (dedupeError) {
        console.error("[parcours events] dedupe lookup failed", dedupeError);
        return NextResponse.json(
          { error: "Erreur serveur (idempotence)" },
          { status: 500 },
        );
      }

      if (existing) {
        dedupedEvent = {
          id: existing.id as string,
          event_type: existing.event_type as string,
          payload: (existing.payload ?? {}) as Record<string, unknown> | null,
        };
      }
    }

    if (dedupedEvent) {
      await evaluateParcoursScenarios(payload.parcoursId, payload.learnerId, {
        id: dedupedEvent.id,
        parcoursId: payload.parcoursId,
        learnerId: payload.learnerId,
        eventType: payload.eventType,
        payload: dedupedEvent.payload ?? {},
      });

      return NextResponse.json({
        success: true,
        eventId: dedupedEvent.id,
        deduped: true,
      });
    }

    const {
      data: inserted,
      error: insertError,
    } = await serviceClient
      .from("parcours_events")
      .insert({
        parcours_id: payload.parcoursId,
        learner_id: payload.learnerId,
        event_type: payload.eventType,
        payload: normalizedPayload,
      })
      .select("id, event_type, payload")
      .single();

    if (insertError || !inserted) {
      console.error("[parcours events] insert error", insertError);
      return NextResponse.json(
        { error: "Impossible d’enregistrer l’évènement" },
        { status: 500 },
      );
    }

    await evaluateParcoursScenarios(payload.parcoursId, payload.learnerId, {
      id: inserted.id as string,
      parcoursId: payload.parcoursId,
      learnerId: payload.learnerId,
      eventType: inserted.event_type,
      payload: (inserted.payload ?? {}) as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, eventId: inserted.id });
  } catch (error) {
    console.error("[parcours events] unexpected error", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(error) },
      { status: 500 },
    );
  }
}
