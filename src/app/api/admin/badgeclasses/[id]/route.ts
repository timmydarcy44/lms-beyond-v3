import { NextRequest, NextResponse } from "next/server";
import { prisma, resolveAndApplyDatabaseUrl } from "@/lib/prisma";
import { getDatabaseConfigError } from "@/lib/db/database-url";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { requireRole } from "@/lib/auth/require-role";
import { BadgeClassStatus, ReceivabilityReviewMode } from "@prisma/client";
import { UserRole } from "@/lib/auth/user-role";
import { getBaseUrl } from "@/lib/openbadges/urls";
import { parseBadgeEvaluationConfig } from "@/lib/openbadges/badge-class-payload";
import {
  canUseOpenBadgesSupabaseRepo,
  getBadgeClassViaSupabase,
  OpenBadgesRpcUnavailableError,
  updateBadgeClassViaSupabase,
} from "@/lib/openbadges/badge-repository";

const resolveIssuerForOrg = async (orgId: string) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, slug: true },
  });
  if (!org) return null;

  const existing = await prisma.issuerProfile.findFirst({
    where: {
      orgId,
      name: { equals: org.name, mode: "insensitive" },
    },
  });
  if (existing) return existing;

  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const url = org.slug ? `${baseUrl}/org/${org.slug}` : baseUrl;
  const email = org.slug ? `contact@${org.slug}.local` : "contact@invalid.local";

  return prisma.issuerProfile.create({
    data: {
      orgId,
      name: org.name,
      url,
      email,
      description: `Émetteur organisation ${org.name}.`,
      imageUrl: null,
    },
  });
};

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const queryOrgId = url.searchParams.get("organizationId");

  if (canUseOpenBadgesSupabaseRepo()) {
    try {
      const badgeClass = await getBadgeClassViaSupabase(id, queryOrgId);
      if (!badgeClass) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, badgeClass });
    } catch (supabaseErr) {
      if (!(supabaseErr instanceof OpenBadgesRpcUnavailableError)) {
        throw supabaseErr;
      }
    }
  }

  if (!resolveAndApplyDatabaseUrl()) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const badgeClass = await prisma.badgeClass.findUnique({
    where: { id },
    include: {
      issuer: true,
      criteria: { orderBy: { sortOrder: "asc" } },
      receivability: true,
    },
  });
  if (!badgeClass) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (queryOrgId && badgeClass.orgId !== queryOrgId) {
    return NextResponse.json({ error: "ORG_MISMATCH" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, badgeClass });
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const payload = await request.json();
  const { id } = await params;

  const hasEvaluationFields =
    Object.prototype.hasOwnProperty.call(payload, "level")
    || Object.prototype.hasOwnProperty.call(payload, "evaluationMethods")
    || Object.prototype.hasOwnProperty.call(payload, "validatorExpertId");

  let evaluationConfig: ReturnType<typeof parseBadgeEvaluationConfig> | null = null;
  if (hasEvaluationFields) {
    evaluationConfig = parseBadgeEvaluationConfig(payload);
    if (!evaluationConfig.ok) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: evaluationConfig.issues },
        { status: 400 },
      );
    }
  }
  const receivabilityReviewMode = payload.receivabilityReviewMode as ReceivabilityReviewMode | undefined;
  const payloadOrgId = typeof payload.organizationId === "string" ? payload.organizationId.trim() : null;
  const hasRequiresEnrollment = Object.prototype.hasOwnProperty.call(payload, "requiresEnrollment");
  const hasRequiredCourseId = Object.prototype.hasOwnProperty.call(payload, "requiredCourseId");
  const hasVisibleInLearnerDashboard = Object.prototype.hasOwnProperty.call(
    payload,
    "visibleInLearnerDashboard",
  );
  const requiresEnrollment = hasRequiresEnrollment ? Boolean(payload.requiresEnrollment) : undefined;
  const visibleInLearnerDashboard = hasVisibleInLearnerDashboard
    ? Boolean(payload.visibleInLearnerDashboard)
    : requiresEnrollment === true
      ? false
      : undefined;
  const requiredCourseId =
    hasRequiredCourseId && typeof payload.requiredCourseId === "string" && payload.requiredCourseId.trim().length > 0
      ? payload.requiredCourseId.trim()
      : hasRequiredCourseId
        ? null
        : undefined;
  let existingOrgId: string | null = null;
  if (canUseOpenBadgesSupabaseRepo()) {
    try {
      const existingRpc = await getBadgeClassViaSupabase(id, auth.user.orgId ?? payloadOrgId);
      if (!existingRpc) {
        const byId = await getBadgeClassViaSupabase(id, null);
        if (byId) existingOrgId = String(byId.orgId ?? "").trim() || null;
      } else {
        existingOrgId = String(existingRpc.orgId ?? auth.user.orgId ?? "").trim() || null;
      }
    } catch (supabaseErr) {
      if (!(supabaseErr instanceof OpenBadgesRpcUnavailableError)) {
        throw supabaseErr;
      }
    }
  }
  if (!existingOrgId) {
    if (!resolveAndApplyDatabaseUrl()) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const existing = await prisma.badgeClass.findUnique({
      where: { id },
      select: { orgId: true },
    });
    if (!existing || existing.orgId !== auth.user.orgId) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    existingOrgId = existing.orgId;
  }
  if (payloadOrgId && payloadOrgId !== existingOrgId) {
    return NextResponse.json({ error: "ORG_MISMATCH" }, { status: 400 });
  }
  if (requiresEnrollment === true && !requiredCourseId) {
    return NextResponse.json({ error: "REQUIRED_COURSE_MISSING" }, { status: 400 });
  }
  if (requiresEnrollment === false && requiredCourseId) {
    return NextResponse.json({ error: "REQUIRED_COURSE_NOT_ALLOWED" }, { status: 400 });
  }
  const allowedReviewModes: readonly string[] = ["HUMAN", "AI", "MIXED"];
  if (receivabilityReviewMode && !allowedReviewModes.includes(String(receivabilityReviewMode))) {
    return NextResponse.json({ error: "INVALID_REVIEW_MODE" }, { status: 400 });
  }
  const hasMethodConfigs =
    Array.isArray(payload.methodConfigs) && payload.methodConfigs.length > 0
    || Array.isArray(payload.receivability?.methodConfigs) && payload.receivability.methodConfigs.length > 0;

  if (
    (receivabilityReviewMode === "AI" || receivabilityReviewMode === "MIXED")
    && !hasMethodConfigs
    && (!payload.receivability?.aiEvaluationPrompt || payload.receivability.aiEvaluationPrompt.trim().length === 0)
  ) {
    return NextResponse.json({ error: "AI_PROMPT_REQUIRED" }, { status: 400 });
  }
  const rpcPayload: Record<string, unknown> = {
    ...payload,
    requiresEnrollment,
    requiredCourseId,
    visibleInLearnerDashboard,
    level: evaluationConfig?.ok ? evaluationConfig.data.level : payload.level,
    evaluationMethods: evaluationConfig?.ok ? evaluationConfig.data.evaluationMethods : payload.evaluationMethods,
    validatorExpertId: evaluationConfig?.ok ? evaluationConfig.data.validatorExpertId : payload.validatorExpertId,
    receivability: payload.receivability
      ? {
          expectedModalities: evaluationConfig?.ok
            ? evaluationConfig.data.expectedModalities
            : payload.receivability.expectedModalities,
          aiEvaluationPrompt: evaluationConfig?.ok
            ? evaluationConfig.data.aiEvaluationPrompt
            : payload.receivability.aiEvaluationPrompt,
          methodConfigs: evaluationConfig?.ok
            ? evaluationConfig.data.methodConfigs
            : payload.receivability.methodConfigs ?? payload.methodConfigs,
        }
      : undefined,
  };

  if (canUseOpenBadgesSupabaseRepo()) {
    try {
      const badgeClass = await updateBadgeClassViaSupabase(id, existingOrgId, rpcPayload);
      if (!badgeClass) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
      return NextResponse.json({ ok: true, badgeClass });
    } catch (supabaseErr) {
      if (!(supabaseErr instanceof OpenBadgesRpcUnavailableError)) {
        console.error("[badgeclasses][put][supabase]", supabaseErr);
        return NextResponse.json(
          {
            ok: false,
            error: "BADGE_UPDATE_FAILED",
            message: supabaseErr instanceof Error ? supabaseErr.message : String(supabaseErr),
          },
          { status: 500 },
        );
      }
    }
  }

  if (!resolveAndApplyDatabaseUrl()) {
    return NextResponse.json(
      {
        ok: false,
        error: "OPEN_BADGES_STORAGE_UNAVAILABLE",
        message: getDatabaseConfigError(),
      },
      { status: 503 },
    );
  }

  const issuer = await resolveIssuerForOrg(existingOrgId);
  if (!issuer) {
    return NextResponse.json({ error: "ORG_NOT_FOUND" }, { status: 400 });
  }

  const badgeClass = await prisma.$transaction(async (tx) => {
    const shouldUpdateCriteriaUrl = Object.prototype.hasOwnProperty.call(payload, "criteriaUrl");
    const updated = await tx.badgeClass.update({
      where: { id },
      data: {
        issuerId: issuer.id,
        name: payload.name ?? undefined,
        description: payload.description ?? undefined,
        imageTemplateUrl: payload.imageUrl ?? payload.imageTemplateUrl ?? undefined,
        imageUrl: payload.imageUrl ?? undefined,
        criteriaUrl: shouldUpdateCriteriaUrl ? payload.criteriaUrl ?? null : undefined,
        criteriaText: payload.criteriaText ?? null,
        criteriaMarkdown: payload.criteriaMarkdown ?? null,
        alignment: payload.alignment ?? null,
        tags: payload.tags ?? undefined,
        version: payload.version ?? undefined,
        status: payload.status ? (payload.status as BadgeClassStatus) : undefined,
        receivabilityReviewMode: receivabilityReviewMode ?? undefined,
        requiresEnrollment: requiresEnrollment ?? undefined,
        requiredCourseId:
          requiresEnrollment === false
            ? null
            : requiredCourseId ?? undefined,
        visibleInLearnerDashboard:
          requiresEnrollment === true
            ? false
            : visibleInLearnerDashboard ?? undefined,
        level: evaluationConfig?.ok ? evaluationConfig.data.level : undefined,
        evaluationMethods: evaluationConfig?.ok ? evaluationConfig.data.evaluationMethods : undefined,
        validatorExpertId: evaluationConfig?.ok ? evaluationConfig.data.validatorExpertId : undefined,
      },
    });

    if (Array.isArray(payload.criteria)) {
      await tx.badgeCriteria.deleteMany({ where: { badgeClassId: id } });
      if (payload.criteria.length > 0) {
        await tx.badgeCriteria.createMany({
          data: payload.criteria.map((criterion: any) => ({
            badgeClassId: id,
            label: criterion.label,
            description: criterion.description ?? null,
            sortOrder: Number(criterion.sortOrder ?? 0),
          })),
        });
      }
    }

    if (payload.receivability) {
      const expectedModalities = evaluationConfig?.ok
        ? evaluationConfig.data.expectedModalities
        : payload.receivability.expectedModalities;
      const aiEvaluationPrompt = evaluationConfig?.ok
        ? evaluationConfig.data.aiEvaluationPrompt
        : (payload.receivability.aiEvaluationPrompt ?? "");
      const methodConfigs = evaluationConfig?.ok
        ? evaluationConfig.data.methodConfigs
        : payload.receivability.methodConfigs ?? payload.methodConfigs;
      await tx.badgeReceivability.upsert({
        where: { badgeClassId: id },
        create: {
          badgeClassId: id,
          expectedModalities,
          aiEvaluationPrompt,
          methodConfigs: methodConfigs ?? undefined,
        },
        update: {
          expectedModalities,
          aiEvaluationPrompt,
          ...(methodConfigs !== undefined ? { methodConfigs } : {}),
        },
      });
    }

    return updated;
  });

  return NextResponse.json({ ok: true, badgeClass });
}
