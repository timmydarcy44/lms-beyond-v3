import { NextRequest, NextResponse } from "next/server";
import { prisma, resolveAndApplyDatabaseUrl } from "@/lib/prisma";
import { getRequestUser, requireRole } from "@/lib/auth/require-role";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { BadgeClassStatus, UserRole } from "@prisma/client";
import {
  canUseOpenBadgesSupabaseRepo,
  getBadgeClassViaSupabase,
  updateBadgeClassViaSupabase,
} from "@/lib/openbadges/badge-repository";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const ALLOWED = new Set(["DRAFT", "ACTIVE", "ARCHIVED"]);

function normalizeStatus(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const upper = raw.trim().toUpperCase();
  return ALLOWED.has(upper) ? upper : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  const headerUser = getRequestUser(request);
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
    if (!auth.ok) return auth.response;
  }

  const payload = await request.json();
  const { id } = await params;
  const status = normalizeStatus(payload.status);
  if (!status) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  const orgId =
    (typeof payload.organizationId === "string" ? payload.organizationId.trim() : "")
    || headerUser?.orgId
    || request.headers.get("x-org-id")
    || "";

  if (canUseOpenBadgesSupabaseRepo()) {
    try {
      const existing = await getBadgeClassViaSupabase(id, orgId || null);
      if (!existing) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      const effectiveOrgId = String(existing.orgId ?? orgId ?? "").trim();
      if (!effectiveOrgId) {
        return NextResponse.json({ error: "ORG_REQUIRED" }, { status: 400 });
      }
      const badgeClass = await updateBadgeClassViaSupabase(id, effectiveOrgId, { status });
      if (!badgeClass) {
        return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, badgeClass });
    } catch (err) {
      console.error("[badgeclasses][status][supabase]", err);
      return NextResponse.json(
        {
          ok: false,
          error: "STATUS_UPDATE_FAILED",
          message: err instanceof Error ? err.message : String(err),
        },
        { status: 500 },
      );
    }
  }

  if (!resolveAndApplyDatabaseUrl()) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (!headerUser?.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const existing = await prisma.badgeClass.findUnique({
    where: { id },
    select: { orgId: true },
  });
  if (!existing || existing.orgId !== headerUser.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const badgeClass = await prisma.badgeClass.update({
    where: { id },
    data: { status: status as BadgeClassStatus },
  });

  return NextResponse.json({ ok: true, badgeClass });
}
