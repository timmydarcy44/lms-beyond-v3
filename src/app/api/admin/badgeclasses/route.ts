import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { BadgeClassStatus, ReceivabilityReviewMode, UserRole } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { getBadgeCriteriaUrl, getBaseUrl } from "@/lib/openbadges/urls";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const resolveIssuerForOrg = async (orgId: string) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, slug: true },
  });
  if (!org) return null;

  const existing = await prisma.issuerProfile.findFirst({
    where: { orgId },
  });
  if (existing) return existing;

  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const safeName = org.name?.trim() || "Organisation";
  let host = "localhost";
  try {
    host = new URL(baseUrl).hostname || host;
  } catch {
    // fallback host
  }
  const url = org.slug ? `${baseUrl}/organizations/${org.slug}` : baseUrl;
  const email = `no-reply@${host}`;
  const description = `Émetteur officiel de ${safeName}`;
  const imageUrl = `${baseUrl}/images/issuer-default.png`;

  try {
    return await prisma.issuerProfile.create({
      data: {
        orgId,
        name: safeName,
        url,
        email,
        description,
        imageUrl,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[issuer][resolve] create failed", {
        orgId,
        name: safeName,
        url,
        email,
        imageUrl,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      const fallback = await prisma.issuerProfile.findFirst({ where: { orgId } });
      if (fallback) return fallback;
    }
    throw error;
  }
};

export async function POST(request: Request) {
  try {
    const headerOrgId = request.headers.get("x-org-id");
    if (!headerOrgId) {
      return NextResponse.json({ ok: false, error: "MISSING_ORG_ID" }, { status: 400 });
    }

    const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
    if (!auth.ok) return auth.response;

    let payload: any = null;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: ["JSON invalide"] },
        { status: 400 },
      );
    }
    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: ["payload invalide"] },
        { status: 400 },
      );
    }
    const organizationId = payload.organizationId ?? payload.orgId;
    if (organizationId && organizationId !== headerOrgId) {
      return NextResponse.json({ ok: false, error: "ORG_MISMATCH" }, { status: 400 });
    }
    if (!organizationId) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: ["organizationId manquant"] },
        { status: 400 },
      );
    }

    const receivabilityReviewMode = (payload.receivabilityReviewMode ?? "HUMAN") as ReceivabilityReviewMode;
    const requiresEnrollment = Boolean(payload.requiresEnrollment);
    const requiredCourseId =
      typeof payload.requiredCourseId === "string" && payload.requiredCourseId.trim().length > 0
        ? payload.requiredCourseId.trim()
        : null;

    const allowedReviewModes: ReceivabilityReviewMode[] = ["HUMAN", "AI", "MIXED"];
    if (!allowedReviewModes.includes(receivabilityReviewMode)) {
      return NextResponse.json({ ok: false, error: "INVALID_REVIEW_MODE" }, { status: 400 });
    }

    const validationIssues: string[] = [];
    if (!payload.name || String(payload.name).trim().length === 0) validationIssues.push("name manquant");
    if (!payload.description || String(payload.description).trim().length === 0) {
      validationIssues.push("description manquante");
    }
    if (!payload.receivability || typeof payload.receivability !== "object") {
      validationIssues.push("receivability manquant");
    } else if (!payload.receivability.expectedModalities) {
      validationIssues.push("receivability.expectedModalities manquant");
    }
    if (!payload.imageUrl && !payload.imageTemplateUrl) {
      validationIssues.push("imageUrl manquant");
    }
    if (validationIssues.length > 0) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: validationIssues },
        { status: 400 },
      );
    }

    if (requiresEnrollment && !requiredCourseId) {
      return NextResponse.json({ ok: false, error: "REQUIRED_COURSE_ID" }, { status: 400 });
    }
    if (!requiresEnrollment && requiredCourseId) {
      return NextResponse.json({ ok: false, error: "REQUIRED_COURSE_NOT_ALLOWED" }, { status: 400 });
    }
    if (
      (receivabilityReviewMode === "AI" || receivabilityReviewMode === "MIXED")
      && (!payload.receivability?.aiEvaluationPrompt || payload.receivability.aiEvaluationPrompt.trim().length === 0)
    ) {
      return NextResponse.json({ ok: false, error: "AI_PROMPT_REQUIRED" }, { status: 400 });
    }

    const issuer = await resolveIssuerForOrg(auth.user.orgId);
    if (!issuer) {
      return NextResponse.json({ ok: false, error: "ORG_NOT_FOUND" }, { status: 400 });
    }

    if (requiresEnrollment && requiredCourseId) {
      const supabase = await getServiceRoleClientOrFallback();
      if (!supabase) {
        return NextResponse.json(
          { ok: false, error: "COURSE_LOOKUP_UNAVAILABLE" },
          { status: 503 },
        );
      }
      const { data: course, error } = await supabase
        .from("courses")
        .select("id")
        .eq("id", requiredCourseId)
        .eq("org_id", auth.user.orgId)
        .maybeSingle();
      if (error) {
        return NextResponse.json({ ok: false, error: "COURSE_LOOKUP_FAILED" }, { status: 500 });
      }
      if (!course) {
        return NextResponse.json({ ok: false, error: "COURSE_NOT_FOUND" }, { status: 400 });
      }
    }

    const shouldAutofillCriteriaUrl =
      payload.criteriaUrl === undefined || payload.criteriaUrl === null || payload.criteriaUrl === "";
    const criteriaText =
      typeof payload.criteriaText === "string" && payload.criteriaText.trim().length > 0
        ? payload.criteriaText.trim()
        : null;
    const criteriaMarkdown =
      typeof payload.criteriaMarkdown === "string" && payload.criteriaMarkdown.trim().length > 0
        ? payload.criteriaMarkdown.trim()
        : null;

    const badgeClass = await prisma.$transaction(async (tx) => {
      const created = await tx.badgeClass.create({
        data: {
          orgId: auth.user.orgId,
          issuerId: issuer.id,
          createdByUserId: auth.user.id,
          name: payload.name,
          description: payload.description,
          imageTemplateUrl: payload.imageUrl ?? payload.imageTemplateUrl ?? null,
          imageUrl: payload.imageUrl ?? null,
          criteriaUrl: shouldAutofillCriteriaUrl ? null : payload.criteriaUrl,
          criteriaText,
          criteriaMarkdown,
          alignment: payload.alignment ?? null,
          tags: Array.isArray(payload.tags) ? payload.tags : [],
          version: payload.version ?? 1,
          status: (payload.status as BadgeClassStatus) ?? BadgeClassStatus.DRAFT,
          receivabilityReviewMode,
          requiresEnrollment,
          requiredCourseId: requiresEnrollment ? requiredCourseId : null,
        },
      });

      if (shouldAutofillCriteriaUrl) {
        await tx.badgeClass.update({
          where: { id: created.id },
          data: { criteriaUrl: getBadgeCriteriaUrl(created.id) },
        });
      }

      if (Array.isArray(payload.criteria) && payload.criteria.length > 0) {
        await tx.badgeCriteria.createMany({
          data: payload.criteria.map((criterion: any) => ({
            badgeClassId: created.id,
            label: criterion.label,
            description: criterion.description ?? null,
            sortOrder: Number(criterion.sortOrder ?? 0),
          })),
        });
      }

      if (payload.receivability) {
        await tx.badgeReceivability.create({
          data: {
            badgeClassId: created.id,
            expectedModalities: payload.receivability.expectedModalities,
            aiEvaluationPrompt: payload.receivability.aiEvaluationPrompt ?? "",
          },
        });
      }

      return created;
    });

    return NextResponse.json({ ok: true, badgeClass });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[badgeclasses][post] error", error);
    }
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target) ? error.meta?.target.join(",") : "";
        const field = target.includes("name") ? "name" : target.includes("slug") ? "slug" : undefined;
        const message = field === "name"
          ? "Un badge avec ce nom existe déjà pour cette organisation."
          : "Conflit d’unicité.";
        return NextResponse.json(
          { ok: false, error: "CONFLICT", code: error.code, message, field },
          { status: 409 },
        );
      }
      if (error.code === "P2003") {
        const fieldName = typeof error.meta?.field_name === "string" ? error.meta.field_name : undefined;
        return NextResponse.json(
          { ok: false, error: "FK_INVALID", code: error.code, message: "Clé étrangère invalide.", field: fieldName },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { ok: false, error: "INTERNAL_ERROR", code: error.code, message: "Erreur base de données." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const queryOrgId = url.searchParams.get("organizationId");
  if (queryOrgId && queryOrgId !== auth.user.orgId) {
    return NextResponse.json({ error: "ORG_MISMATCH" }, { status: 400 });
  }

  const badgeClasses = await prisma.badgeClass.findMany({
    where: { orgId: auth.user.orgId },
    include: {
      issuer: true,
      criteria: { orderBy: { sortOrder: "asc" } },
      receivability: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, badgeClasses });
}
