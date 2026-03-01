import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";
import { getEnrolledCourseIds } from "@/lib/openbadges/enrollment";

export async function GET(request: Request) {
  const auth = requireRole(request, [UserRole.EARNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const badgeClasses = await prisma.badgeClass.findMany({
    where: { orgId: auth.user.orgId, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      description: true,
      requiresEnrollment: true,
      requiredCourseId: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const requiredCourseIds = badgeClasses
    .map((badge) => badge.requiredCourseId)
    .filter((id): id is string => Boolean(id));

  let enrolledCourseIds = new Set<string>();
  if (requiredCourseIds.length > 0) {
    enrolledCourseIds = await getEnrolledCourseIds(auth.user.id, auth.user.orgId, requiredCourseIds);
  }

  const response = badgeClasses.map((badge) => ({
    ...badge,
    eligible: badge.requiresEnrollment
      ? Boolean(badge.requiredCourseId && enrolledCourseIds.has(badge.requiredCourseId))
      : true,
  }));

  return NextResponse.json({ ok: true, badgeClasses: response });
}
